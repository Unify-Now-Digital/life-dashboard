import React, { useState } from "react";
import { C, styles } from "../lib/tokens";
import HabitRing from "./HabitRing.jsx";
import HabitMonth from "./HabitMonth.jsx";
import HabitConfirm from "./HabitConfirm.jsx";
import { isoYesterday, statusFor, streakFor, hasUnanswered } from "../lib/habits";

const HABITS = [
  { key: "gym", label: "Gym" },
  { key: "spanish", label: "Spanish" },
  { key: "clean", label: "Clean" },
  { key: "sleep", label: "Sleep" },
];

export default function Habits({ habitLog, habitNoLog, onConfirm }) {
  const [open, setOpen] = useState(null);
  const yesISO = isoYesterday();
  const anyUnanswered = HABITS.some((h) => hasUnanswered(h.key, habitLog, habitNoLog));

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        Habits
        <span style={styles.sectionSub}>
          {anyUnanswered ? "tap a ring to confirm yesterday" : "all caught up"}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {HABITS.map((h) => {
          const status = statusFor(h.key, yesISO, habitLog, habitNoLog);
          const streak = streakFor(h.key, habitLog, habitNoLog);
          return (
            <div
              key={h.key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <HabitRing
                habit={h.key}
                status={status}
                streak={streak}
                size={56}
                onClick={() => setOpen(open === h.key ? null : h.key)}
              />
              <div style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{h.label}</div>
              <div style={{ fontSize: 11, color: C.textTertiary, fontVariantNumeric: "tabular-nums" }}>
                {streak}d streak
              </div>
              <HabitMonth habit={h.key} habitLog={habitLog} habitNoLog={habitNoLog} />
            </div>
          );
        })}
      </div>

      {open && (
        <HabitConfirm
          label={HABITS.find((h) => h.key === open).label}
          status={statusFor(open, yesISO, habitLog, habitNoLog)}
          onAnswer={(answer) => {
            onConfirm(open, yesISO, answer);
            setOpen(null);
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
