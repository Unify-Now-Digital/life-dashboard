import React from "react";
import { C } from "../lib/tokens";

// Floating shortcut to the focused Spanish-practice view. Bottom-left, stacked
// above the camera button (PhotoQuickAdd). Navigates same-origin via the
// ?spanish flag (see host.js / isSpanishHost) so the Supabase session carries
// over with no re-login. Browser back returns to the dashboard.
export default function SpanishButton() {
  return (
    <a
      href="?spanish"
      aria-label="Open Spanish practice"
      title="Spanish practice"
      style={{
        position: "fixed",
        left: "max(12px, env(safe-area-inset-left))",
        bottom: "calc(176px + env(safe-area-inset-bottom))",
        height: 36,
        padding: "0 14px",
        borderRadius: 18,
        background: C.bg,
        color: C.accent,
        border: `0.5px solid ${C.borderStrong}`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "inherit",
        textDecoration: "none",
        zIndex: 40,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
      </svg>
      Español
    </a>
  );
}
