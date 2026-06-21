import React from "react";
import { C, ACCENT } from "../../lib/tokens";
import { PillSelect } from "./Pill.jsx";

// Focus view for a single task: everything else dimmed behind an overlay.
// Shows the task text, its pill (recategorise), notes / next action, and the
// priority / decision / done controls. Spec §4.
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
        borderRadius: 7,
        padding: "6px 12px",
        fontSize: 12,
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
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          border: `0.5px solid ${C.borderStrong}`,
          borderRadius: 14,
          padding: 20,
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 12px 40px rgba(0,0,0,0.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <PillSelect value={task.pill} column={col} onChange={(pill) => onUpdate({ pill })} />
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", color: C.textTertiary, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4 }}
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
            fontSize: 19,
            fontWeight: 500,
            fontFamily: "inherit",
            resize: "none",
            outline: "none",
            lineHeight: 1.35,
          }}
        />

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Notes / next action
          </div>
          <textarea
            value={task.notes || ""}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="What's the next concrete step?"
            rows={4}
            style={{
              width: "100%",
              border: `0.5px solid ${C.border}`,
              borderRadius: 8,
              background: C.bgSecondary,
              color: C.text,
              fontSize: 13.5,
              fontFamily: "inherit",
              padding: "10px 12px",
              resize: "vertical",
              outline: "none",
              lineHeight: 1.5,
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: C.textSecondary }}>Due</span>
          <input
            type="date"
            value={task.due || ""}
            onChange={(e) => onUpdate({ due: e.target.value || null })}
            style={{
              border: `0.5px solid ${C.border}`,
              borderRadius: 7,
              background: C.bgSecondary,
              color: C.text,
              fontFamily: "inherit",
              fontSize: 12.5,
              padding: "5px 8px",
              colorScheme: "light dark",
            }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {flagBtn(task.priority ? "★ Priority" : "☆ Priority", task.priority, () => onUpdate({ priority: !task.priority }), ACCENT.priorities)}
          {flagBtn("Decision", task.isDecision, () => onUpdate({ isDecision: !task.isDecision }), ACCENT.work)}
          {flagBtn(task.status === "done" ? "✓ Done" : "Mark done", task.status === "done", () => onUpdate({ status: task.status === "done" ? "open" : "done" }), ACCENT.personal)}
          <button
            onClick={() => { onDelete(); onClose(); }}
            style={{ marginLeft: "auto", border: `0.5px solid ${C.border}`, background: "transparent", color: C.danger, borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
