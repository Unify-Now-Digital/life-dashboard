import React from "react";
import { C, styles } from "../lib/tokens";

const habits = [
  { key: "gym", label: "Gym sessions" },
  { key: "spanish", label: "Spanish" },
  { key: "clean", label: "No alcohol / clean eating" },
  { key: "sleep", label: "Bed by 10pm" },
];

export default function Streaks({ streaks, logged, onTick }) {
  return (
    <div>
      <div style={{ ...styles.sectionH, padding: "0 4px" }}>
        Habit streaks
        <span style={styles.sectionSub}>tap to log today</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {habits.map(({ key, label }) => {
          const isLogged = logged[key];
          const count = streaks[key];
          return (
            <div
              key={key}
              onClick={() => onTick(key)}
              style={{
                background: C.bgSecondary,
                borderRadius: 8,
                padding: "12px 14px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: count === 0 ? C.textTertiary : C.text,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {count}
              </div>
              <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: isLogged ? C.success : C.accent, marginTop: 4, fontWeight: 500 }}>
                {isLogged ? "✓ done today" : "tap to tick today"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
