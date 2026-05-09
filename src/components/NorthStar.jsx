import React from "react";
import { C, styles } from "../lib/tokens";
import { EditableText } from "./Editable.jsx";

// Compact sidebar variant — no card chrome, larger bold italic line with a
// leading star glyph so it reads as the dashboard's anchor.
// Set `compact` to false to render the legacy full-card form.
export default function NorthStar({ value, onChange, compact = true }) {
  if (compact) {
    return (
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          background: C.bgSecondary,
          borderLeft: `3px solid ${C.accent}`,
          borderRadius: "0 8px 8px 0",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: 18,
            lineHeight: 1.2,
            color: C.accent,
            flexShrink: 0,
          }}
        >
          ★
        </span>
        <EditableText
          value={value}
          onChange={onChange}
          multiline
          style={{
            fontSize: 15,
            fontWeight: 600,
            fontStyle: "italic",
            lineHeight: 1.4,
            color: C.text,
            fontFamily: "Georgia, 'Times New Roman', serif",
            display: "block",
            flex: 1,
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
