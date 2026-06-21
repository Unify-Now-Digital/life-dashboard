import React, { useState } from "react";
import { C, ACCENT } from "../../lib/tokens";
import { PillSelect } from "./Pill.jsx";

const META_OVERDUE = new Set(["overdue"]);

// One task row: [pill] text …… [meta]. Clicking the row opens focus; clicking
// the pill recategorises (handled inside PillSelect via stopPropagation).
function TaskRow({ task, onOpen, onRecategorise, onToggleDone }) {
  const meta = task.meta;
  const overdue = meta && META_OVERDUE.has(String(meta).toLowerCase());
  const done = task.status === "done";
  return (
    <div
      onClick={() => onOpen(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(task.id);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 2px",
        borderBottom: `0.5px solid ${C.border}`,
        cursor: "pointer",
      }}
    >
      <span onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex" }}>
        <PillSelect value={task.pill} column={task.column} onChange={onRecategorise} />
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          color: done ? C.textTertiary : C.text,
          textDecoration: done ? "line-through" : "none",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {task.text}
      </span>
      {meta && (
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: overdue ? C.danger : C.textTertiary,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {meta}
        </span>
      )}
    </div>
  );
}

function Column({ title, accent, tasks, onOpen, onRecategorise, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const commit = () => {
    const text = draft.trim();
    if (text) onAdd(text);
    setDraft("");
    setAdding(false);
  };
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: accent }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{title}</span>
      </div>
      <div>
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onOpen={onOpen}
            onRecategorise={(pill) => onRecategorise(t.id, pill)}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{ fontSize: 13, color: C.textTertiary, padding: "10px 2px" }}>Nothing here.</div>
        )}
        {adding ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(""); setAdding(false); }
            }}
            placeholder="Task…"
            style={{
              width: "100%",
              marginTop: 8,
              border: `1px solid ${C.accent}`,
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 14,
              fontFamily: "inherit",
              background: C.bg,
              color: C.text,
              outline: "none",
            }}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              marginTop: 8,
              background: "none",
              border: "none",
              color: C.accent,
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: "4px 2px",
            }}
          >
            + add task
          </button>
        )}
      </div>
    </div>
  );
}

// Tasks view — Work | Personal columns. When `decisionsActive`, both columns
// filter to tasks with isDecision === true. Spec §4.
export default function TasksView({ tasks, decisionsActive, isDesktop, onOpen, onRecategorise, onAdd }) {
  const open = tasks.filter((t) => t.status !== "done");
  const visible = decisionsActive ? open.filter((t) => t.isDecision) : open;
  const work = visible.filter((t) => t.column === "work");
  const personal = visible.filter((t) => t.column === "personal");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        gap: isDesktop ? 36 : 24,
        alignItems: "flex-start",
      }}
    >
      <Column title="Work" accent={ACCENT.work} tasks={work} onOpen={onOpen} onRecategorise={onRecategorise} onAdd={(text) => onAdd("work", text)} />
      {isDesktop && <div style={{ width: 0.5, alignSelf: "stretch", background: C.border }} />}
      <Column title="Personal" accent={ACCENT.personal} tasks={personal} onOpen={onOpen} onRecategorise={onRecategorise} onAdd={(text) => onAdd("personal", text)} />
    </div>
  );
}
