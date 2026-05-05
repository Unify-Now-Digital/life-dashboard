import React from "react";
import { C } from "../lib/tokens";

// Modal popover for confirming yesterday's habit answer.
// Shared between the floating StickyHabits bar and the inline Habits section.
export default function HabitConfirm({ label, status, onAnswer, onClose }) {
  return (
    <>
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
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
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
            Yes
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
            No
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
