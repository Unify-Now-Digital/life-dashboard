import React, { useState } from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn, EditModeToggle } from "../Editable.jsx";
import PriorityStar from "../PriorityStar.jsx";

// ----- Priority row --------------------------------------------------------
function PriorityRow({ priority, onUpdate, onRemove, editing }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
      }}
    >
      <div
        onClick={() =>
          onUpdate(priority.id, { done: !priority.done, doneAt: !priority.done ? today : null })
        }
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: `1.5px solid ${priority.done ? C.accent : C.borderStrong}`,
          background: priority.done ? C.accent : "transparent",
          flexShrink: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {priority.done && (
          <svg width="8" height="6" viewBox="0 0 9 7">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <PriorityStar
        starred={priority.starred}
        onToggle={() =>
          onUpdate(priority.id, { starred: !priority.starred, starredAt: !priority.starred ? today : null })
        }
      />
      <span
        style={{
          flex: 1,
          fontSize: 13,
          color: priority.done ? C.textTertiary : C.text,
          textDecoration: priority.done ? "line-through" : "none",
        }}
      >
        <EditableText
          value={priority.label}
          onChange={(v) => onUpdate(priority.id, { label: v })}
          placeholder="New priority…"
          style={{ fontSize: 13 }}
        />
      </span>
      {editing && (
        <IconBtn onClick={() => onRemove(priority.id)} danger label="Remove">
          ×
        </IconBtn>
      )}
    </div>
  );
}

// ----- Goal block ----------------------------------------------------------
function GoalBlock({ goal, onUpdateGoal, onRemoveGoal, onAddPriority, onUpdatePriority, onRemovePriority, editing }) {
  const total = goal.priorities?.length || 0;
  const done = goal.priorities?.filter((p) => p.done).length || 0;
  const denominator = goal.target ?? total;
  const pct = denominator > 0 ? Math.min(100, Math.round((done / denominator) * 100)) : 0;
  return (
    <div style={{ paddingTop: 12, paddingBottom: 12, borderTop: `0.5px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
          <EditableText
            value={goal.label}
            onChange={(v) => onUpdateGoal(goal.id, { label: v })}
            style={{ fontSize: 13, fontWeight: 500 }}
          />
        </span>
        <span style={{ fontSize: 11, color: C.textSecondary, fontVariantNumeric: "tabular-nums" }}>
          {done}/{denominator || 0}
        </span>
        {editing && (
          <IconBtn onClick={() => onRemoveGoal(goal.id)} danger label="Remove goal">
            ×
          </IconBtn>
        )}
      </div>
      <div style={{ height: 3, background: C.bgTertiary, borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: C.accent, transition: "width 0.3s" }} />
      </div>
      {(goal.priorities || []).map((p) => (
        <PriorityRow
          key={p.id}
          priority={p}
          onUpdate={(id, patch) => onUpdatePriority(goal.id, id, patch)}
          onRemove={(id) => onRemovePriority(goal.id, id)}
          editing={editing}
        />
      ))}
      {editing && (
        <button onClick={() => onAddPriority(goal.id)} style={{ ...styles.addBtn, fontSize: 12, padding: "5px 10px" }}>
          + Add priority
        </button>
      )}
    </div>
  );
}

// ----- Project shell -------------------------------------------------------
//
// Every project page wraps its content with this. Renders:
//   - title + close + edit toggle
//   - goals + priorities (the standard hierarchy)
//   - children (project-specific specialised content)
export default function Project({ title, color, onClose, goals, goalHandlers, children, headerExtras }) {
  const [editing, setEditing] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {color && (
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color }} />
          )}
          <div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {headerExtras}
          <EditModeToggle editing={editing} onToggle={() => setEditing(!editing)} />
          {onClose && (
            <div
              onClick={onClose}
              style={{ fontSize: 12, color: C.textTertiary, cursor: "pointer", padding: "4px 8px", borderRadius: 4 }}
            >
              close
            </div>
          )}
        </div>
      </div>

      {/* Goals + priorities */}
      {(goals && goals.length > 0) || editing ? (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              color: C.textTertiary,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Goals
          </div>
          {(goals || []).map((g) => (
            <GoalBlock
              key={g.id}
              goal={g}
              editing={editing}
              onUpdateGoal={goalHandlers.onUpdateGoal}
              onRemoveGoal={goalHandlers.onRemoveGoal}
              onAddPriority={goalHandlers.onAddPriority}
              onUpdatePriority={goalHandlers.onUpdatePriority}
              onRemovePriority={goalHandlers.onRemovePriority}
            />
          ))}
          {editing && goalHandlers.onAddGoal && (
            <button onClick={goalHandlers.onAddGoal} style={{ ...styles.addBtn, marginTop: 12 }}>
              + Add goal
            </button>
          )}
        </div>
      ) : null}

      {children}
    </div>
  );
}
