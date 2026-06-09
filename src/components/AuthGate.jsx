import React, { useEffect, useState } from "react";
import { C, styles } from "../lib/tokens";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import {
  signInWithPasskey,
  enrollPasskey,
  isPasskeySupported,
  isPlatformAuthenticatorAvailable,
} from "../lib/passkey";

// If Supabase env vars aren't configured we skip auth entirely and treat the
// dashboard as a local-only PWA. This keeps `npm run dev` frictionless.
//
// When Supabase IS configured: passkey (Face ID / Touch ID) is the primary
// sign-in. Email magic link stays as the one-time bootstrap (you need a session
// before you can enrol a passkey) and as a permanent recovery path, so a lost
// passkey can never lock Arin out.
//
// Only this address may sign in. Enforced authoritatively by a server-side
// trigger on auth.users; mirrored here for UX.
const ALLOWED_EMAIL = "arinmelvin@gmail.com";

// Local hint so we don't nag to enrol on a device that already has a passkey
// (or where the prompt was dismissed). Not a security boundary — the server is.
const ENROLL_HINT = "lifeDashboard:passkey:enrolled";

export default function AuthGate({ children }) {
  if (!isSupabaseEnabled()) return children;

  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [canPasskey, setCanPasskey] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isPasskeySupported()) return;
    isPlatformAuthenticatorAvailable().then(setCanPasskey);
  }, []);

  if (session === undefined) return null; // initial flash, render nothing
  if (session) return <SignedIn>{children}</SignedIn>;

  const signInPasskey = async () => {
    setError("");
    setPasskeyBusy(true);
    try {
      await signInWithPasskey();
      // onAuthStateChange flips us into children.
    } catch (e) {
      if (e?.name === "NotAllowedError") setError("Face ID cancelled.");
      else setError("No passkey here yet — use the email link once to set up.");
    } finally {
      setPasskeyBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    // Client-side allowlist (the authoritative check is a server-side trigger
    // on auth.users — see migration restrict_signups_to_owner_email). This
    // just avoids firing a pointless magic link and gives a clear message.
    if (email.trim().toLowerCase() !== ALLOWED_EMAIL) {
      setError("This dashboard is private.");
      return;
    }
    setError("");
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setSending(false);
    if (!error) setSent(true);
    else setError("Could not send link. Try again.");
  };

  return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ ...styles.card, maxWidth: 380, width: "100%" }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Sign in</div>
        <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 14 }}>
          {canPasskey ? "Use Face ID — no password, no email." : "Magic link by email — no password."}
        </div>

        {canPasskey && !showEmail && (
          <>
            <button
              type="button"
              onClick={signInPasskey}
              disabled={passkeyBusy}
              style={primaryBtn(passkeyBusy)}
            >
              {passkeyBusy ? "Waiting for Face ID…" : "Sign in with Face ID"}
            </button>
            <button type="button" onClick={() => setShowEmail(true)} style={linkBtn}>
              Email me a link instead
            </button>
          </>
        )}

        {(!canPasskey || showEmail) &&
          (sent ? (
            <div style={{ fontSize: 13, color: C.text }}>
              Link sent to <strong>{email}</strong>. Check your inbox, then add Face ID once you're in.
            </div>
          ) : (
            <form onSubmit={submit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: "100%",
                  border: `0.5px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontSize: 14,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  marginBottom: 8,
                }}
              />
              <button type="submit" disabled={sending} style={primaryBtn(sending)}>
                {sending ? "Sending…" : "Send magic link"}
              </button>
              {canPasskey && (
                <button type="button" onClick={() => setShowEmail(false)} style={linkBtn}>
                  Back to Face ID
                </button>
              )}
            </form>
          ))}

        {error && <div style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
}

// Wraps the dashboard once authenticated. Surfaces a one-time, dismissible
// prompt to add a passkey to this device (so next time is Face ID, not email).
function SignedIn({ children }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (localStorage.getItem(ENROLL_HINT) === "1") return;
    if (!isPasskeySupported()) return;
    isPlatformAuthenticatorAvailable().then((ok) => setShow(ok));
  }, []);

  if (!show) return children;

  const add = async () => {
    setBusy(true);
    setMsg("");
    try {
      await enrollPasskey();
      localStorage.setItem(ENROLL_HINT, "1");
      setShow(false);
    } catch (e) {
      if (e?.name === "NotAllowedError") setMsg("Cancelled.");
      else setMsg(e?.message || "Could not add this device.");
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(ENROLL_HINT, "1");
    setShow(false);
  };

  return (
    <>
      <div
        style={{
          background: "#F2F7FC",
          border: `0.5px solid ${C.accent}33`,
          color: C.text,
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12,
          margin: "8px 0 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ flex: 1, minWidth: 180 }}>
          Add Face ID to this device so you can skip the email next time.
        </span>
        <button type="button" onClick={add} disabled={busy} style={smallPrimary(busy)}>
          {busy ? "Adding…" : "Add Face ID"}
        </button>
        <button type="button" onClick={dismiss} style={smallGhost}>
          Not now
        </button>
        {msg && <span style={{ color: C.danger, width: "100%" }}>{msg}</span>}
      </div>
      {children}
    </>
  );
}

const primaryBtn = (disabled) => ({
  width: "100%",
  background: C.accent,
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "9px 10px",
  fontSize: 13,
  fontWeight: 500,
  cursor: disabled ? "default" : "pointer",
  fontFamily: "inherit",
  opacity: disabled ? 0.6 : 1,
});

const linkBtn = {
  width: "100%",
  background: "none",
  border: "none",
  color: C.textSecondary,
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: "8px 0 0",
};

const smallPrimary = (disabled) => ({
  background: C.accent,
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 500,
  cursor: disabled ? "default" : "pointer",
  fontFamily: "inherit",
  opacity: disabled ? 0.6 : 1,
});

const smallGhost = {
  background: "none",
  border: `0.5px solid ${C.border}`,
  color: C.textSecondary,
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
};
