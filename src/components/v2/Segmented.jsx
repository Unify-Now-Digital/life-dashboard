import React from "react";
import { C } from "../../lib/tokens";

// Small segmented control. options: [{ value, label }]. Used by the view tabs
// and the Monthly/Weekly finance toggle.
export default function Segmented({ options, value, onChange, accent = C.accent, size = "md" }) {
  const pad = size === "sm" ? "4px 12px" : "6px 16px";
  const fontSize = size === "sm" ? 12 : 13;
  return (
    <div
      style={{
        display: "inline-flex",
        background: C.bgTertiary,
        border: `0.5px solid ${C.border}`,
        borderRadius: 9,
        padding: 2,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              border: "none",
              borderRadius: 7,
              padding: pad,
              fontSize,
              fontWeight: active ? 500 : 400,
              fontFamily: "inherit",
              cursor: "pointer",
              color: active ? accent : C.textSecondary,
              background: active ? C.card : "transparent",
              boxShadow: active ? "0 0.5px 2px rgba(0,0,0,0.08)" : "none",
              transition: "color 0.12s",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
