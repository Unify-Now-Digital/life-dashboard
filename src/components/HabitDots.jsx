import React from "react";
import { C } from "../lib/tokens";

export default function HabitDots({ history, size = 5, gap = 3 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap, lineHeight: 0 }}>
      {history.map((d, i) => {
        let bg, border;
        if (d.status === "yes") {
          bg = C.accent;
          border = C.accent;
        } else if (d.status === "no") {
          bg = C.bg;
          border = C.danger;
        } else {
          bg = "transparent";
          border = C.borderStrong;
        }
        return (
          <span
            key={d.date}
            title={`${d.date}: ${d.status}`}
            style={{
              display: "inline-block",
              width: size,
              height: size,
              borderRadius: "50%",
              background: bg,
              border: `0.75px solid ${border}`,
              boxSizing: "border-box",
            }}
          />
        );
      })}
    </div>
  );
}
