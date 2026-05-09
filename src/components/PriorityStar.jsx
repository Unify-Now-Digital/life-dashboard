import React from "react";
import { C } from "../lib/tokens";

// Star toggle for promoting a priority to "Top 3".
// Filled = starred, outlined = not. Click flips state and stamps starredAt.
export default function PriorityStar({ starred, onToggle, size = 14 }) {
  return (
    <button
      onClick={onToggle}
      aria-label={starred ? "Unstar" : "Star — pin to Top 3"}
      title={starred ? "Pinned to Top 3" : "Pin to Top 3"}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 2,
        lineHeight: 0,
        color: starred ? C.accent : C.textTertiary,
        fontFamily: "inherit",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" fill={starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4">
        <path d="M8 1.5l1.9 4.1 4.5.5-3.4 3.1.9 4.4L8 11.5 4.1 13.6l.9-4.4L1.6 6.1l4.5-.5L8 1.5z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
