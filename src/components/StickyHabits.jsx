import React, { useState } from "react";
import { C } from "../lib/tokens";
import { isoYesterday, statusFor, streakFor, hasUnanswered, historyFor } from "../lib/habits";
import HabitRing from "./HabitRing.jsx";
import HabitDots from "./HabitDots.jsx";

const HABITS = [
  { key: "gym", label: "Gym session" },
  { key: "spanish", label: "Spanish practice" },
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

      {/* Confirmation popover */}
      {open && (
        <ConfirmYesterday
          habit={open}
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

function ConfirmYesterday({ habit, label, status, onAnswer, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.18)",
          zIndex: 200,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 90,
          left: "50%",
          transform: "translateX(-50%)",
          background: C.bg,
          border: `0.5px solid ${C.borderStrong}`,
          borderRadius: 12,
          padding: "16px 20px",
          minWidth: 260,
          zIndex: 201,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ fontSize: 13, color: C.textTertiary, marginBottom: 4 }}>Yesterday</div>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>{label}?</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onAnswer("yes")}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: `0.5px solid ${status === "yes" ? C.accent : C.border}`,
              background: status === "yes" ? C.accent : "transparent",
              color: status === "yes" ? "white" : C.text,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ✓ Yes
          </button>
          <button
            onClick={() => onAnswer("no")}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: `0.5px solid ${status === "no" ? C.danger : C.border}`,
              background: status === "no" ? C.danger : "transparent",
              color: status === "no" ? "white" : C.text,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ✗ No
          </button>
        </div>
        {status !== "unanswered" && (
          <button
            onClick={() => onAnswer("clear")}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "6px",
              border: "none",
              background: "transparent",
              color: C.textTertiary,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            clear answer
          </button>
        )}
      </div>
    </>
  );
}
