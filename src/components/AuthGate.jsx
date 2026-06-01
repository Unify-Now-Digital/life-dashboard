import React, { useEffect, useState } from "react";
import { C, styles } from "../lib/tokens";
import { supabase, isSupabaseEnabled } from "../lib/supabase";

// If Supabase env vars aren't configured we skip auth entirely and treat the
// dashboard as a local-only PWA. This keeps `npm run dev` frictionless.
//
// When Supabase IS configured we show a magic-link prompt until a session is
// established, then render children.
// Only this address may sign in. Enforced authoritatively by a server-side
// trigger on auth.users; mirrored here for UX.
const ALLOWED_EMAIL = "arinmelvin@gmail.com";

export default function AuthGate({ children }) {
  if (!isSupabaseEnabled()) return children;

  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null; // initial flash, render nothing
  if (session) return children;

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
          Magic link by email — no password.
        </div>
        {sent ? (
          <div style={{ fontSize: 13, color: C.text }}>
            Link sent to <strong>{email}</strong>. Check your inbox.
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
            <button
              type="submit"
              disabled={sending}
              style={{
                width: "100%",
                background: C.accent,
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 13,
                fontWeight: 500,
                cursor: sending ? "default" : "pointer",
                fontFamily: "inherit",
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? "Sending…" : "Send magic link"}
            </button>
            {error && (
              <div style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>{error}</div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
