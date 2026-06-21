import React from "react";
import { C, ACCENT } from "../../lib/tokens";
import { PillSelect } from "./Pill.jsx";

// Right-side focus drawer for a single task: the rest of the board dims behind
// it. Shows the task text, its pill (recategorise), notes / next action, due
// date, and the priority / decision / done controls. Spec §4.
export default function TaskFocus({ task, onClose, onUpdate, onDelete }) {
  if (!task) return null;
  const col = task.column;

  const flagBtn = (label, on, onClick, accent) => (
    <button
      onClick={onClick}
      style={{
        border: `0.5px solid ${on ? accent : C.border}`,
        background: on ? accent : "transparent",
        color: on ? "#fff" : C.textSecondary,
        borderRadius: 8,
        padding: "7px 13px",
        fontSize: 12.5,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: C.overlay,
        zIndex: 200,
        display: "flex",
        justifyContent: "flex-end",
        animation: "overlayIn 0.15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          borderLeft: `0.5px solid ${C.borderStrong}`,
          height: "100%",
          width: "min(440px, 100%)",
          boxSizing: "border-box",
          padding: "20px 22px calc(24px + env(safe-area-inset-bottom))",
          overflowY: "auto",
          boxShadow: "-12px 0 40px rgba(0,0,0,0.18)",
          animation: "drawerIn 0.18s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <PillSelect value={task.pill} column={col} onChange={(pill) => onUpdate({ pill })} />
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", color: C.textTertiary, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        <textarea
          value={task.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={2}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            color: C.text,
            fontSize: 20,
            fontWeight: 500,
            fontFamily: "inherit",
            resize: "none",
            outline: "none",
            lineHeight: 1.35,
            padding: 0,
          }}
        />

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
            Notes / next action
          </div>
          <textarea
            value={task.notes || ""}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="What's the next concrete step?"
            rows={5}
            style={{
              width: "100%",
              border: `0.5px solid ${C.border}`,
              borderRadius: 10,
              background: C.bgSecondary,
              color: C.text,
              fontSize: 14,
              fontFamily: "inherit",
              padding: "12px 13px",
              resize: "none",
              outline: "none",
              lineHeight: 1.55,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
          <span style={{ fontSize: 12.5, color: C.textSecondary, width: 32 }}>Due</span>
          <input
            type="date"
            value={task.due || ""}
            onChange={(e) => onUpdate({ due: e.target.value || null })}
            style={{
              border: `0.5px solid ${C.border}`,
              borderRadius: 8,
              background: C.bgSecondary,
              color: task.due ? C.text : C.textTertiary,
              fontFamily: "inherit",
              fontSize: 13,
              padding: "7px 10px",
              colorScheme: "light dark",
            }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: "auto", paddingTop: 24 }}>
          {flagBtn(task.priority ? "★ Priority" : "☆ Priority", task.priority, () => onUpdate({ priority: !task.priority }), ACCENT.priorities)}
          {flagBtn("Decision", task.isDecision, () => onUpdate({ isDecision: !task.isDecision }), ACCENT.work)}
          {flagBtn(task.status === "done" ? "✓ Done" : "Mark done", task.status === "done", () => onUpdate({ status: task.status === "done" ? "open" : "done" }), ACCENT.personal)}
          <button
            onClick={() => { onDelete(); onClose(); }}
            style={{ marginLeft: "auto", border: `0.5px solid ${C.border}`, background: "transparent", color: C.danger, borderRadius: 8, padding: "7px 13px", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
