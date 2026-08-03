import React from "react";
import { C, ACCENT } from "../../lib/tokens";

// Floating trigger for the personal-assistant chat panel. Bottom-right,
// mirroring SpanishButton's fixed/safe-area/z-index conventions on the
// opposite corner. No idle pulse/bounce — a static, always-available FAB.
//
// HabitFooter is no longer permanently docked (focus-first shell — see
// CLAUDE.md) so this only needs to clear the safe area, not a fixed footer.
// `reviewReady` + `onReviewClick`: when a new weekly review is available, a
// small dot badge appears in the button's corner. It's a distinct tap
// target (own onClick, stops propagation) so opening the assistant
// normally never auto-triggers the review — only deliberately tapping the
// badge does.
export default function AssistantButton({ onClick, reviewReady, onReviewClick }) {
  return (
    <div
      style={{
        position: "fixed",
        right: "max(12px, env(safe-area-inset-right))",
        bottom: "max(16px, env(safe-area-inset-bottom))",
        width: 56,
        height: 56,
        zIndex: 90,
      }}
    >
      <button
        onClick={onClick}
        aria-label="Open assistant"
        title="Assistant"
        style={{
          position: "absolute",
          inset: 0,
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
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
        </svg>
      </button>

      {reviewReady && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReviewClick?.();
          }}
          aria-label="Weekly review ready"
          title="Weekly review ready — tap for a summary"
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: `2px solid ${C.card}`,
            // Priorities amber — matches the existing accent used for
            // anything "needs your attention" elsewhere in the app
            // (PrioritiesBar/decisions).
            background: ACCENT.priorities,
            padding: 0,
            cursor: "pointer",
          }}
        />
      )}
    </div>
  );
}
