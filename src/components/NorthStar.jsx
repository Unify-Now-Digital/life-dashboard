import React from "react";
import { C, styles } from "../lib/tokens";
import { EditableText } from "./Editable.jsx";

// Compact sidebar variant — no card chrome, just the italic line.
// Set `compact` to false to render the legacy full-card form.
export default function NorthStar({ value, onChange, compact = true }) {
  if (compact) {
    return (
      <div
        style={{
          padding: "10px 12px",
          fontSize: 12,
          lineHeight: 1.55,
          color: C.textSecondary,
          fontStyle: "italic",
          fontFamily: "Georgia, 'Times New Roman', serif",
          borderLeft: `2px solid ${C.accent}`,
          background: C.bgSecondary,
          borderRadius: "0 8px 8px 0",
        }}
      >
        <EditableText
          value={value}
          onChange={onChange}
          multiline
          style={{
            fontSize: 12,
            fontStyle: "italic",
            lineHeight: 1.55,
            color: C.textSecondary,
            fontFamily: "Georgia, 'Times New Roman', serif",
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        North star
        <span style={styles.sectionSub}>tap to edit</span>
      </div>
      <div
        style={{
          fontSize: 14,
          color: C.textSecondary,
          lineHeight: 1.6,
          padding: "12px 14px",
          borderLeft: `2px solid ${C.accent}`,
          background: C.bgSecondary,
          borderRadius: "0 8px 8px 0",
          fontStyle: "italic",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <EditableText
          value={value}
          onChange={onChange}
          multiline
          style={{
            fontSize: 14,
            fontStyle: "italic",
            lineHeight: 1.6,
            color: C.textSecondary,
            fontFamily: "Georgia, 'Times New Roman', serif",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
