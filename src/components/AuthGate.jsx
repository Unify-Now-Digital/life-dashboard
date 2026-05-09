import React, { useEffect, useState } from "react";
import { C, styles } from "../lib/tokens";
import { supabase, isSupabaseEnabled } from "../lib/supabase";

// If Supabase env vars aren't configured we skip auth entirely and treat the
// dashboard as a local-only PWA. This keeps `npm run dev` frictionless.
//
// When Supabase IS configured we show a magic-link prompt until a session is
// established, then render children.
export default function AuthGate({ children }) {
  if (!isSupabaseEnabled()) return children;

  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setSending(false);
    if (!error) setSent(true);
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
          </form>
        )}
      </div>
    </div>
  );
}
