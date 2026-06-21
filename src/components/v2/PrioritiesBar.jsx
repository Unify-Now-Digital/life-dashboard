import React, { useState } from "react";
import { C, ACCENT, PILL } from "../../lib/tokens";

// Permanent priorities bar (spec §3, "version B" — slim inline chips). A left
// amber rail + star, then each flagged task as a compact category-tinted chip
// showing its pill code + short text. A dashed "+ add" chip and a
// "Decisions · N" toggle on the right. Collapses to a count line on mobile.
export default function PrioritiesBar({
  priorities,
  decisionsCount,
  decisionsActive,
  onToggleDecisions,
  onOpenTask,
  onAddPriority,
  compact,
}) {
  const [expanded, setExpanded] = useState(false);
  const amber = ACCENT.priorities;

  const star = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 2.5l2.9 6 6.6.6-5 4.3 1.5 6.4L12 16.9 6 19.8l1.5-6.4-5-4.3 6.6-.6z" />
    </svg>
  );

  const decisionsBtn = (
    <button
      onClick={onToggleDecisions}
      style={{
        border: `0.5px solid ${decisionsActive ? amber : "transparent"}`,
        background: decisionsActive ? "rgba(229,145,42,0.12)" : "transparent",
        color: amber,
        borderRadius: 999,
        padding: "5px 12px",
        fontSize: 12.5,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      Decisions · {decisionsCount}
    </button>
  );

  const chip = (t) => {
    const s = PILL[t.pill] || { bg: C.bgTertiary, color: C.textSecondary };
    return (
      <button
        key={t.id}
        onClick={() => onOpenTask(t.id)}
        title={t.text}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: s.bg,
          border: "none",
          borderRadius: 8,
          padding: "5px 11px",
          fontSize: 13,
          color: s.color,
          cursor: "pointer",
          fontFamily: "inherit",
          maxWidth: 260,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.01em", flexShrink: 0 }}>{t.pill}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{t.text}</span>
      </button>
    );
  };

  const addChip = (
    <button
      onClick={onAddPriority}
      title="Add a priority"
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `0.5px dashed ${C.borderStrong}`,
        background: "transparent",
        color: C.textSecondary,
        borderRadius: 8,
        padding: "5px 12px",
        fontSize: 12.5,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
        flexShrink: 0,
      }}
    >
      + add
    </button>
  );

  const shell = {
    background: C.bgSecondary,
    border: `0.5px solid ${C.border}`,
    borderLeft: `3px solid ${amber}`,
    borderRadius: 10,
    marginBottom: 12,
  };

  // Mobile: collapse to a single line with a count.
  if (compact) {
    return (
      <div style={{ ...shell, padding: "8px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", color: C.text }}
          >
            {star}
            <span style={{ fontSize: 13, fontWeight: 500 }}>{priorities.length} priorities</span>
            <span style={{ color: C.textTertiary, fontSize: 12 }}>{expanded ? "▴" : "▾"}</span>
          </button>
          {decisionsBtn}
        </div>
        {expanded && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {priorities.map(chip)}
            {addChip}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...shell, padding: "9px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      {star}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, overflowX: "auto" }}>
        {priorities.length === 0 && (
          <span style={{ fontSize: 12.5, color: C.textTertiary }}>No priorities flagged.</span>
        )}
        {priorities.map(chip)}
        {addChip}
      </div>
      {decisionsBtn}
    </div>
  );
}
