import React, { useState } from "react";
import { C, PILL, WORK_PILLS, PERSONAL_PILLS } from "../../lib/tokens";

// Category pill. Display-only by default; pass `onPick` (+ column) to make it
// tappable, opening a tiny picker of the valid pills for that column.
export function Pill({ name, size = "md", onClick, style }) {
  const s = PILL[name] || { bg: C.bgTertiary, color: C.textSecondary };
  const pad = size === "sm" ? "1px 7px" : "2px 9px";
  const fontSize = size === "sm" ? 10.5 : 11.5;
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: s.bg,
        color: s.color,
        borderRadius: 6,
        padding: pad,
        fontSize,
        fontWeight: 500,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

// Tappable pill that opens a recategorise picker.
export function PillSelect({ value, column, onChange }) {
  const [open, setOpen] = useState(false);
  const options = column === "personal" ? PERSONAL_PILLS : WORK_PILLS;
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <Pill
        name={value}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      />
      {open && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            style={{ position: "fixed", inset: 0, zIndex: 60 }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 61,
              background: C.card,
              border: `0.5px solid ${C.borderStrong}`,
              borderRadius: 8,
              padding: 4,
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
              minWidth: 120,
            }}
          >
            {options.map((opt) => (
              <span key={opt} onClick={() => { onChange(opt); setOpen(false); }}>
                <Pill name={opt} style={{ opacity: opt === value ? 1 : 0.7 }} />
              </span>
            ))}
          </div>
        </>
      )}
    </span>
  );
}
