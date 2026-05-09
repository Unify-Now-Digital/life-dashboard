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
  const [showMonth, setShowMonth] = useState(false);
  const yesISO = isoYesterday();
  const anyUnanswered = HABITS.some((h) => hasUnanswered(h.key, habitLog, habitNoLog));

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        <span>
          Habits{" "}
          <span style={styles.sectionSub}>
            {anyUnanswered ? "· tap a ring to confirm yesterday" : "· all caught up"}
          </span>
        </span>
        <button
          onClick={() => setShowMonth(!showMonth)}
          style={{
            background: "transparent",
            border: `0.5px solid ${C.border}`,
            borderRadius: 4,
            padding: "3px 8px",
            fontSize: 10,
            color: C.textSecondary,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {showMonth ? "hide month" : "show month"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {HABITS.map((h) => {
          const status = statusFor(h.key, yesISO, habitLog, habitNoLog);
          const streak = streakFor(h.key, habitLog, habitNoLog);
          return (
            <div
              key={h.key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            >
              <HabitRing
                habit={h.key}
                status={status}
                streak={streak}
                size={44}
                onClick={() => setOpen(open === h.key ? null : h.key)}
              />
              <div style={{ fontSize: 11, color: C.text, fontWeight: 500 }}>{h.label}</div>
              <div style={{ fontSize: 10, color: C.textTertiary, fontVariantNumeric: "tabular-nums" }}>
                {streak}d
              </div>
              {showMonth && <HabitMonth habit={h.key} habitLog={habitLog} habitNoLog={habitNoLog} />}
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
