import React from "react";
import { C } from "../lib/tokens";
import { STREAK_GOAL } from "../lib/habits";

// Inline SVG icons — sized 16x16, monochrome currentColor
const ICONS = {
  gym: (
    // Dumbbell
    <g>
      <rect x="2" y="6" width="2" height="4" rx="0.5" />
      <rect x="4" y="5" width="1.5" height="6" rx="0.5" />
      <rect x="5.5" y="7" width="5" height="2" />
      <rect x="10.5" y="5" width="1.5" height="6" rx="0.5" />
      <rect x="12" y="6" width="2" height="4" rx="0.5" />
    </g>
  ),
  spanish: (
    // Speech bubble
    <path d="M3 4h10a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7l-3 2v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
  ),
  clean: (
    // Leaf
    <path d="M13 3c-4 0-7 2-9 4-2 2-2 5 0 7 2 2 5 2 7 0 2-2 4-5 4-9V3h-2z" />
  ),
  sleep: (
    // Moon
    <path d="M9 2a6 6 0 1 0 5 9 5 5 0 0 1-5-9z" />
  ),
};

const LABELS = {
  gym: "Gym",
  spanish: "Spanish",
  clean: "Clean",
  sleep: "Sleep",
};

export default function HabitRing({ habit, status, streak, onClick, size = 44 }) {
  // status: "yes" | "no" | "unanswered" — for yesterday
  const radius = size / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  // When the most recent answered day is "yes", fill the ring entirely so
  // a confirmed completion reads at a glance. Otherwise fall back to the
  // streak-progress indicator.
  const progress = status === "yes" ? 1 : Math.min(streak / STREAK_GOAL, 1);
  const dashOffset = circumference * (1 - progress);

  // Ring colour by status
  const ringColor =
    status === "no" ? C.danger : status === "yes" ? C.accent : streak > 0 ? C.accent : C.borderStrong;

  // Icon colour
  const iconColor =
    status === "yes" ? C.accent : status === "no" ? C.danger : streak > 0 ? C.text : C.textTertiary;

  const pulsing = status === "unanswered";

  return (
    <button
      onClick={onClick}
      title={`${LABELS[habit]} — ${streak}d streak${pulsing ? " · tap to log yesterday" : ""}`}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        fontFamily: "inherit",
        animation: pulsing ? "habitPulse 2s ease-in-out infinite" : "none",
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={C.bgTertiary}
            strokeWidth="2.5"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.2s ease" }}
          />
        </svg>
        {/* Icon centred */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
            transition: "color 0.2s ease",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            {ICONS[habit]}
          </svg>
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: C.textTertiary,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.02em",
        }}
      >
        {streak}
      </div>
    </button>
  );
}
