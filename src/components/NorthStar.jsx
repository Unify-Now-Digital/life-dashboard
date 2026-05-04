import React from "react";
import { C, styles } from "../lib/tokens";
import { EditableText } from "./Editable.jsx";

export default function NorthStar({ text, onChange }) {
  return (
    <div>
      <div style={{ ...styles.sectionH, padding: "0 4px" }}>North star</div>
      <div
        style={{
          fontSize: 13,
          color: C.textSecondary,
          lineHeight: 1.6,
          padding: "12px 14px",
          borderLeft: `2px solid ${C.accent}`,
          background: C.bgSecondary,
          borderRadius: "0 8px 8px 0",
          fontStyle: "italic",
        }}
      >
        <EditableText
          value={text}
          onChange={onChange}
          multiline
          style={{
            fontSize: 13,
            fontStyle: "italic",
            lineHeight: 1.6,
            color: C.textSecondary,
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
