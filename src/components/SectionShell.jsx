import React from "react";
import { C } from "../lib/tokens";

// Shared shell used by every dashboard section (Top 3, Habits, Calendar,
// Objectives, and the project MainSections). One look across the board:
//   - White outer card with a 3px coloured top accent so each section has
//     a clear "start" line.
//   - Header row: icon + bold-coloured label (+ optional meta sub) on the
//     left; chevron on the right.
//   - Click ANYWHERE on the header row toggles open/closed (when onToggle
//     is provided). No separate pill button.
//
// Use cases:
//   <SectionShell icon={...} label="Work" color={purple} expanded={true}
//                 onToggle={...}>{body}</SectionShell>
//
// If `onToggle` is omitted the section is non-collapsing (Top 3 etc.) — no
// chevron, no click handler, just the styled card.
export default function SectionShell({
  icon,
  label,
  color = C.accent,
  meta,
  expanded,
  onToggle,
  controlsRight,
  id,
  children,
}) {
  const collapsible = typeof onToggle === "function";
  const showBody = !collapsible || expanded;
  return (
    <div
      id={id}
      style={{
        background: C.bg,
        border: `0.5px solid ${C.border}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
      <div
        onClick={collapsible ? onToggle : undefined}
        role={collapsible ? "button" : undefined}
        aria-expanded={collapsible ? expanded : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={(e) => {
          if (!collapsible) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          cursor: collapsible ? "pointer" : "default",
          userSelect: "none",
          marginBottom: showBody ? 8 : 0,
          minHeight: 28,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {icon}
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
          {meta && (
            <span
              style={{
                fontSize: 11,
                color: C.textTertiary,
                fontWeight: 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              · {meta}
            </span>
          )}
        </span>
        <span
          style={{ display: "flex", alignItems: "center", gap: 8 }}
          onClick={(e) => {
            // Allow nested controls to handle their own clicks without
            // toggling the whole section.
            if (controlsRight) e.stopPropagation();
          }}
        >
          {controlsRight}
          {collapsible && (
            <span
              aria-hidden="true"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color,
                lineHeight: 1,
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
                display: "inline-block",
                width: 16,
                textAlign: "center",
              }}
            >
              ▾
            </span>
          )}
        </span>
      </div>
      {showBody && children}
    </div>
  );
}

// Inline SVG icons for the system sections (Top 3 / Habits / Calendar) so
// we don't have to bring in PROJECT_META machinery for non-projects. Stroke
// uses currentColor so callers control the hue via wrapper style={{ color }}.
export function SystemIcon({ kind, color, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color || C.text,
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    style: { display: "block", flexShrink: 0 },
  };
  switch (kind) {
    case "top3":
      return (
        <svg {...common}>
          <path d="M12 2l2.6 6 6.4.6-4.8 4.4 1.4 6.5L12 16l-5.6 3.5L7.8 13 3 8.6l6.4-.6z" />
        </svg>
      );
    case "habits":
      return (
        <svg {...common}>
          <path d="M3 12h3l2-7 4 14 2-7h3" />
          <circle cx="20" cy="12" r="2" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="1.5" />
          <path d="M3 9h18" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
        </svg>
      );
    case "objectives":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill={color || C.text} />
        </svg>
      );
    default:
      return null;
  }
}
