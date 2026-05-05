import React from "react";
import { C, styles } from "../lib/tokens";
import HabitRing from "./HabitRing.jsx";
import HabitDots from "./HabitDots.jsx";
import { isoYesterday, statusFor, streakFor, hasUnanswered, historyFor } from "../lib/habits";

const HABITS = [
  { key: "gym", label: "Gym" },
  { key: "spanish", label: "Spanish" },
  { key: "clean", label: "Clean" },
  { key: "sleep", label: "Sleep" },
];

// Inline section at the top of the dashboard. Confirmation still happens via the
// floating StickyHabits bar at the bottom — this is the always-visible status view.
export default function Habits({ habitLog, habitNoLog }) {
  const yesISO = isoYesterday();
  const anyUnanswered = HABITS.some((h) => hasUnanswered(h.key, habitLog, habitNoLog));

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        Habits
        <span style={styles.sectionSub}>
          {anyUnanswered ? "use the bar at the bottom to confirm yesterday" : "all caught up"}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {HABITS.map((h) => {
          const status = statusFor(h.key, yesISO, habitLog, habitNoLog);
          const streak = streakFor(h.key, habitLog, habitNoLog);
          const history = historyFor(h.key, habitLog, habitNoLog, 7);
          return (
            <div
              key={h.key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <HabitRing habit={h.key} status={status} streak={streak} onClick={() => {}} />
              <div style={{ fontSize: 12, color: C.text }}>{h.label}</div>
              <HabitDots history={history} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
