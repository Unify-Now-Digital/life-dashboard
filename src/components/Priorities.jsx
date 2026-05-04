import React from "react";
import { C, styles } from "../lib/tokens";

export default function Priorities({ priorities, onToggle, onChange }) {
  const done = priorities.filter((p) => p.done).length;
  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        Today's top 3
        <span style={styles.sectionSub}>{done} of 3</span>
      </div>
      {priorities.map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 0",
            borderBottom: i < priorities.length - 1 ? `0.5px solid ${C.border}` : "none",
          }}
        >
          <div
            onClick={() => onToggle(i)}
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: `1.5px solid ${p.done ? C.accent : C.borderStrong}`,
              background: p.done ? C.accent : "transparent",
              flexShrink: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {p.done && (
              <svg width="9" height="7" viewBox="0 0 9 7">
                <path
                  d="M1 3.5L3.5 6L8 1"
                  stroke="white"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <input
            value={p.text}
            onChange={(e) => onChange(i, e.target.value)}
            placeholder={`${["First", "Second", "Third"][i]} priority…`}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontSize: 15,
              color: p.done ? C.textTertiary : C.text,
              textDecoration: p.done ? "line-through" : "none",
              outline: "none",
              fontFamily: "inherit",
              padding: 0,
            }}
          />
        </div>
      ))}
    </div>
  );
}
