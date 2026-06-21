import React from "react";
import { C, ACCENT } from "../../lib/tokens";
import { PillSelect } from "./Pill.jsx";
import { metaFromDue } from "../../lib/taskDates.js";

// Compact right-side focus drawer for a single task. Quick done / delete live in
// the header; notes / due / importance / flags below. Spec §4.
export default function TaskFocus({ task, onClose, onUpdate, onDelete, onDefer }) {
  if (!task) return null;
  const col = task.column;
  const done = task.status === "done";

  const iconBtn = (label, color, onClick, children) => (
    <button onClick={onClick} title={label} aria-label={label} style={{ width: 30, height: 30, borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.card, color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
      {children}
    </button>
  );

  const flagBtn = (label, on, onClick, accent) => (
    <button onClick={onClick} style={{ border: `0.5px solid ${on ? accent : C.border}`, background: on ? accent : "transparent", color: on ? "#fff" : C.textSecondary, borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
      {label}
    </button>
  );

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 200, display: "flex", justifyContent: "flex-end", animation: "overlayIn 0.15s ease" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.card, borderLeft: `0.5px solid ${C.borderStrong}`, height: "100%", width: "min(420px, 100%)", boxSizing: "border-box", padding: "16px 18px calc(18px + env(safe-area-inset-bottom))", overflowY: "auto", boxShadow: "-12px 0 40px rgba(0,0,0,0.28)", animation: "drawerIn 0.18s ease", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <PillSelect value={task.pill} column={col} onChange={(pill) => onUpdate({ pill })} />
          <span style={{ flex: 1 }} />
          {iconBtn(done ? "Reopen" : "Mark done", done ? C.success : C.textSecondary, () => onUpdate({ status: done ? "open" : "done" }),
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>)}
          {iconBtn("Delete", C.danger, () => { onDelete(); onClose(); },
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>)}
          {iconBtn("Close", C.textTertiary, onClose,
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>)}
        </div>

        <textarea
          value={task.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={2}
          style={{ width: "100%", border: "none", background: "transparent", color: done ? C.textTertiary : C.text, textDecoration: done ? "line-through" : "none", fontSize: 18, fontWeight: 600, fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.3, padding: 0 }}
        />

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Notes / next action</div>
          <textarea
            value={task.notes || ""}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="What's the next concrete step?"
            rows={3}
            style={{ width: "100%", border: `0.5px solid ${C.border}`, borderRadius: 9, background: C.bgSecondary, color: C.text, fontSize: 13.5, fontFamily: "inherit", padding: "9px 11px", resize: "vertical", outline: "none", lineHeight: 1.5, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: C.textSecondary, width: 70 }}>Due</span>
          <input
            type="date"
            value={task.due || ""}
            onChange={(e) => onUpdate({ due: e.target.value || null, meta: metaFromDue(e.target.value || null) })}
            style={{ border: `0.5px solid ${C.border}`, borderRadius: 8, background: C.bgSecondary, color: task.due ? C.text : C.textTertiary, fontFamily: "inherit", fontSize: 12.5, padding: "6px 9px", colorScheme: "light dark" }}
          />
          <div style={{ display: "inline-flex", gap: 5 }}>
            {[{ n: 1, l: "+1d" }, { n: 3, l: "+3d" }, { n: 7, l: "+1w" }].map(({ n, l }) => (
              <button key={n} onClick={() => onDefer(n)} style={{ border: `0.5px solid ${C.border}`, background: "transparent", color: C.textSecondary, borderRadius: 7, padding: "5px 9px", fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 12, color: C.textSecondary, width: 70 }}>Importance</span>
          <div style={{ display: "inline-flex", gap: 5 }}>
            {[{ lvl: 1, label: "Low" }, { lvl: 2, label: "Med" }, { lvl: 3, label: "High" }].map(({ lvl, label }) => {
              const on = (task.importance || 1) === lvl;
              return (
                <button key={lvl} onClick={() => onUpdate({ importance: lvl })} style={{ border: `0.5px solid ${on ? C.accent : C.border}`, background: on ? C.accentLight : "transparent", color: on ? C.accentDark : C.textSecondary, borderRadius: 7, padding: "5px 11px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {flagBtn(task.priority ? "★ Priority" : "☆ Priority", task.priority, () => onUpdate({ priority: !task.priority }), ACCENT.priorities)}
          {flagBtn("Decision", task.isDecision, () => onUpdate({ isDecision: !task.isDecision }), ACCENT.work)}
        </div>
      </div>
    </div>
  );
}
