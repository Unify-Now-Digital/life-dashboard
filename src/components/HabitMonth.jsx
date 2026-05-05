import React from "react";
import { C } from "../lib/tokens";
import { isoDate, statusFor } from "../lib/habits";

const WEEKS = 5;
const CELL = 10;
const GAP = 2;

// GitHub-style contribution grid for one habit:
//   columns = weeks (oldest left, current right)
//   rows = day of week (Sun row 0 ... Sat row 6)
// Cells beyond yesterday are rendered transparent so the current week
// looks "in progress" instead of stretching backwards.
export default function HabitMonth({ habit, habitLog, habitNoLog }) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const yDow = yesterday.getDay();

  const start = new Date(yesterday);
  start.setDate(start.getDate() - yDow - (WEEKS - 1) * 7);

  const cells = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(cur.getDate() + w * 7 + d);
      if (cur > yesterday) {
        cells.push({ key: `${w}-${d}`, status: "future" });
      } else {
        const iso = isoDate(cur);
        cells.push({
          key: `${w}-${d}`,
          status: statusFor(habit, iso, habitLog, habitNoLog),
          date: iso,
        });
      }
    }
  }

  const colorFor = (status) => {
    if (status === "yes") return C.accent;
    if (status === "no") return C.danger;
    if (status === "unanswered") return C.bgTertiary;
    return "transparent";
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${WEEKS}, ${CELL}px)`,
        gridTemplateRows: `repeat(7, ${CELL}px)`,
        gridAutoFlow: "column",
        gap: GAP,
      }}
    >
      {cells.map((c) => (
        <div
          key={c.key}
          title={c.date ? `${c.date} — ${c.status}` : ""}
          style={{
            width: CELL,
            height: CELL,
            background: colorFor(c.status),
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
