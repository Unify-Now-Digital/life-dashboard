import React from "react";
import { C } from "../../lib/tokens";

// Floating trigger for the personal-assistant chat panel. Bottom-right,
// mirroring SpanishButton's fixed/safe-area/z-index conventions on the
// opposite corner, clear of HabitFooter. No idle pulse/bounce — a static,
// always-available FAB.
//
// HabitFooter switches to a 2x2 grid on mobile (~300px tall, vs. a single
// ~150px row on desktop), so the clearance needed above it differs sharply
// by breakpoint — a single fixed offset would sit the button under the
// footer on phones.
export default function AssistantButton({ onClick, isCompact }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open assistant"
      title="Assistant"
      style={{
        position: "fixed",
        right: "max(12px, env(safe-area-inset-right))",
        bottom: isCompact ? "calc(320px + env(safe-area-inset-bottom))" : "calc(176px + env(safe-area-inset-bottom))",
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        background: C.accent,
        color: "#fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        zIndex: 90,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
      </svg>
    </button>
  );
}
