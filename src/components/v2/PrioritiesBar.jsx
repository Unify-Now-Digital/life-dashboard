import React, { useState } from "react";
import { C, ACCENT, PILL } from "../../lib/tokens";

// Permanent priorities bar (spec §3). Renders each flagged, open task as a
// compact chip (category-pill colour + short text), a dashed "+ add" chip, and
// a "Decisions · N" toggle on the right. On mobile it collapses to a single
// summary line with a count.
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

  const decisionsBtn = (
    <button
      onClick={onToggleDecisions}
      style={{
        border: `0.5px solid ${decisionsActive ? ACCENT.work : C.border}`,
        background: decisionsActive ? PILL.UD.bg : "transparent",
        color: decisionsActive ? PILL.UD.color : C.textSecondary,
        borderRadius: 7,
        padding: "4px 10px",
        fontSize: 12,
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
          gap: 6,
          background: C.card,
          border: `0.5px solid ${C.border}`,
          borderLeft: `2.5px solid ${s.color}`,
          borderRadius: 8,
          padding: "5px 10px",
          fontSize: 12.5,
          color: C.text,
          cursor: "pointer",
          fontFamily: "inherit",
          maxWidth: 240,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: s.color,
            flexShrink: 0,
          }}
        />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t.text}
        </span>
      </button>
    );
  };

  const addChip = (
    <button
      onClick={onAddPriority}
      title="Add a priority"
      style={{
        border: `0.5px dashed ${C.borderStrong}`,
        background: "transparent",
        color: amber,
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

  const dot = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: amber }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Priorities
      </span>
    </span>
  );

  // Mobile: collapse to a single line with a count, expandable.
  if (compact) {
    return (
      <div
        style={{
          background: C.bgSecondary,
          border: `0.5px solid ${C.border}`,
          borderRadius: 12,
          padding: "8px 12px",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
          >
            {dot}
            <span style={{ fontSize: 12.5, color: C.text }}>{priorities.length}</span>
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
    <div
      style={{
        background: C.bgSecondary,
        border: `0.5px solid ${C.border}`,
        borderRadius: 12,
        padding: "10px 14px",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {dot}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, overflowX: "auto", paddingBottom: 1 }}>
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
