import React from "react";
import { C } from "../lib/tokens";
import { normalizePractice, levelFor, streakLen, effectiveStreakDates } from "../lib/calma.js";

// Floating shortcut to the focused Spanish-practice view — doubles as a glanceable
// progress reminder (lifetime XP, level tier + bar, current streak) so the
// dashboard nudges a jump to Spanish. Bottom-left, stacked above the camera
// button. Navigates same-origin via the ?spanish flag (see host.js) so the
// Supabase session carries over with no re-login.
export default function SpanishButton({ practice }) {
  const p = normalizePractice(practice, 60); // pure read — no write here
  const xp = p.xp || 0;
  const level = levelFor(xp);
  const streak = streakLen(effectiveStreakDates(p));

  return (
    <a
      href="?spanish"
      aria-label="Open Spanish practice"
      title="Spanish practice"
      style={{
        position: "fixed",
        left: "max(12px, env(safe-area-inset-left))",
        bottom: "calc(176px + env(safe-area-inset-bottom))",
        width: 196,
        boxSizing: "border-box",
        padding: "9px 12px 10px",
        borderRadius: 14,
        background: C.bg,
        color: C.text,
        border: `0.5px solid ${C.borderStrong}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        textDecoration: "none",
        fontFamily: "inherit",
        zIndex: 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.accent }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
          </svg>
          Español
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>
          {xp.toLocaleString()} XP
        </span>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: C.textSecondary, fontVariantNumeric: "tabular-nums" }}>
        {level.name}
        {streak > 0 ? ` · racha ${streak}` : ""}
        {level.max ? "" : ` · faltan ${level.toNext.toLocaleString()}`}
      </div>
      {!level.max && (
        <div style={{ marginTop: 6, height: 4, borderRadius: 999, background: C.border, overflow: "hidden" }}>
          <div style={{ width: `${level.pct}%`, height: "100%", background: C.accent, borderRadius: 999 }} />
        </div>
      )}
    </a>
  );
}
