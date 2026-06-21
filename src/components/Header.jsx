import React from "react";
import { C } from "../lib/tokens";
import { lockNow, isLockEnabled } from "../lib/authLocal";

export default function Header({ today, dayOfYear, quote }) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateStr = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]}`;
  const hour = today.getHours();
  const greet =
    hour < 5 ? "Late night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, color: C.textTertiary, fontWeight: 500 }}>{dateStr}</div>
          <div style={{ fontSize: 24, fontWeight: 500, marginTop: 2, letterSpacing: "-0.01em" }}>
            {greet}, Arin.
          </div>
        </div>
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
      {quote && (
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 15,
            color: C.textSecondary,
            fontStyle: "italic",
            lineHeight: 1.5,
            marginTop: 14,
          }}
        >
          {quote}
        </div>
      )}
    </div>
  );
}
