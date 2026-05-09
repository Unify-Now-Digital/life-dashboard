import React, { useState } from "react";
import { C } from "../lib/tokens";
import { isoYesterday, statusFor, streakFor, hasUnanswered, historyFor } from "../lib/habits";
import HabitRing from "./HabitRing.jsx";
import HabitDots from "./HabitDots.jsx";
import HabitConfirm from "./HabitConfirm.jsx";

const HABITS = [
  { key: "spanish", label: "Spanish practice" },
  { key: "gym", label: "Gym session" },
  { key: "clean", label: "Clean eating, no alcohol" },
  { key: "sleep", label: "Bed by 10pm" },
];

export default function StickyHabits({ habitLog, habitNoLog, onConfirm }) {
  const [open, setOpen] = useState(null); // habit key currently being confirmed
  const yesISO = isoYesterday();
  const anyUnanswered = HABITS.some((h) => hasUnanswered(h.key, habitLog, habitNoLog));

  return (
    <>
      {/* Pulse animation injected once */}
      <style>{`
        @keyframes habitPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          border: `0.5px solid ${C.borderStrong}`,
          borderRadius: 22,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          zIndex: 100,
        }}
      >
        {HABITS.map((h) => {
          const status = statusFor(h.key, yesISO, habitLog, habitNoLog);
          const streak = streakFor(h.key, habitLog, habitNoLog);
          const history = historyFor(h.key, habitLog, habitNoLog, 7);
          return (
            <div
              key={h.key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            >
              <HabitRing
                habit={h.key}
                status={status}
                streak={streak}
                onClick={() => setOpen(open === h.key ? null : h.key)}
              />
              <HabitDots history={history} />
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
    </>
  );
}
