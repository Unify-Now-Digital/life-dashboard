import React from "react";
import { C, WISDOM_PILL } from "../lib/tokens";
import { lockNow, isLockEnabled } from "../lib/authLocal";
import UnifyTrend from "./v2/UnifyTrend.jsx";

function CategoryPill({ category }) {
  if (!category) return null;
  const s = WISDOM_PILL[category] || { bg: C.bgTertiary, color: C.textSecondary };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 600, textTransform: "capitalize", whiteSpace: "nowrap", flexShrink: 0 }}>
      {category}
    </span>
  );
}

function RotateBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Another phrase"
      aria-label="Rotate phrase"
      style={{ width: 26, height: 26, borderRadius: 7, border: `0.5px solid ${C.border}`, background: C.card, color: C.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v4h-4" />
      </svg>
    </button>
  );
}

export default function Header({ today, dayOfYear, wisdom, onRotate, unifyHidden, onToggleUnify }) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateStr = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]}`;
  const hour = today.getHours();
  const greet =
    hour < 5 ? "Late night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, rowGap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, color: C.textTertiary, fontWeight: 500 }}>{dateStr}</div>
          <div style={{ fontSize: 24, fontWeight: 500, marginTop: 2, letterSpacing: "-0.01em" }}>
            {greet}, Arin.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flex: "1 1 320px", maxWidth: 500, minWidth: 230, justifyContent: "flex-end" }}>
          {onToggleUnify && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <UnifyTrend hidden={unifyHidden} onToggle={onToggleUnify} />
            </div>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <button
            type="button"
            onClick={lockNow}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 11,
              color: C.textTertiary,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            aria-label={isLockEnabled() ? "Lock dashboard" : "Set a lock"}
          >
            {isLockEnabled() ? "Lock" : "Set a lock"}
          </button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Day
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{dayOfYear}</div>
          </div>
          </div>
        </div>
      </div>
      {wisdom?.text && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <CategoryPill category={wisdom.category} />
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 15,
              color: C.textSecondary,
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            {"“"}{wisdom.text}{"”"}
          </span>
          <span style={{ flex: 1, minWidth: 8 }} />
          {onRotate && <RotateBtn onClick={onRotate} />}
        </div>
      )}
    </div>
  );
}
