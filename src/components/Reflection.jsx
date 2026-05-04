import React from "react";
import { C, styles } from "../lib/tokens";

export default function Reflection({ value, onChange }) {
  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        Today's reflection
        <span style={styles.sectionSub}>{value.length} chars</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="One line. What mattered today?"
        style={{
          width: "100%",
          border: `0.5px solid ${C.border}`,
          background: C.bg,
          padding: "10px 12px",
          borderRadius: 8,
          fontSize: 14,
          color: C.text,
          resize: "none",
          minHeight: 60,
          fontFamily: "inherit",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = C.accent;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accentLight}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}
