import React, { useState } from "react";
import { C, ACCENT, PILL, WORK_PILLS, PERSONAL_PILLS } from "../../lib/tokens";
import Segmented from "./Segmented.jsx";
import { PillSelect, Pill } from "./Pill.jsx";
import { todayISO } from "../../lib/taskDates.js";

const META_OVERDUE = new Set(["overdue"]);
const COLUMN_LIMIT = 10;
const dueKey = (t) => t.due || "9999-99-99";

const CMP = {
  importance: (a, b) => (b.importance || 1) - (a.importance || 1) || dueKey(a).localeCompare(dueKey(b)) || (a.createdAt || "").localeCompare(b.createdAt || ""),
  due: (a, b) => dueKey(a).localeCompare(dueKey(b)) || (b.importance || 1) - (a.importance || 1),
  added: (a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""),
};

const DUE_ORDER = ["Overdue", "Today", "This week", "Later"];
function dueBucket(t, today) {
  if (!t.due) return "Later";
  if (t.due < today) return "Overdue";
  if (t.due === today) return "Today";
  const diff = (new Date(t.due) - new Date(today)) / 86400000;
  return diff <= 7 ? "This week" : "Later";
}

const DEFERS = [
  { n: 1, label: "+1 day" },
  { n: 3, label: "+3 days" },
  { n: 7, label: "+1 week" },
];

function ImportanceMark({ level }) {
  if (!level || level <= 1) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 1.5, height: 9, flexShrink: 0 }} title={`Importance ${level}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ width: 2.5, height: 3 + i * 2, borderRadius: 1, background: i <= level ? C.accent : C.border }} />
      ))}
    </span>
  );
}

function TaskRow({ task, onOpen, onRecategorise, onDefer }) {
  const [deferOpen, setDeferOpen] = useState(false);
  const meta = task.meta;
  const overdue = meta && META_OVERDUE.has(String(meta).toLowerCase());
  const done = task.status === "done";
  return (
    <div
      onClick={() => onOpen(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(task.id)}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 2px", borderBottom: `0.5px solid ${C.border}`, cursor: "pointer" }}
    >
      <span onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex" }}>
        <PillSelect value={task.pill} column={task.column} onChange={onRecategorise} />
      </span>
      <span style={{ flex: 1, fontSize: 14.5, color: done ? C.textTertiary : C.text, textDecoration: done ? "line-through" : "none", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {task.text}
      </span>
      <ImportanceMark level={task.importance} />

      {/* Click the urgency flag to defer; rows with no date get a subtle trigger. */}
      <span style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setDeferOpen((o) => !o)}
          title="Defer"
          style={{
            background: "transparent",
            border: "none",
            padding: "2px 2px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: 500,
            color: overdue ? C.danger : meta ? C.textTertiary : C.borderStrong,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {meta || (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4" />
            </svg>
          )}
        </button>
        {deferOpen && (
          <>
            <div onClick={() => setDeferOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
            <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 61, background: C.card, border: `0.5px solid ${C.borderStrong}`, borderRadius: 9, padding: 4, boxShadow: "0 6px 20px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", minWidth: 110 }}>
              {DEFERS.map(({ n, label }) => (
                <button
                  key={n}
                  onClick={() => { onDefer(task.id, n); setDeferOpen(false); }}
                  style={{ background: "transparent", border: "none", textAlign: "left", padding: "7px 10px", borderRadius: 6, fontSize: 13, color: C.text, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </span>
    </div>
  );
}

function Column({ title, accent, column, tasks, sortBy, groupMode, today, onOpen, onRecategorise, onDefer, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [showAll, setShowAll] = useState(false);

  const sorted = [...tasks].sort(CMP[sortBy]);
  const renderRow = (t) => <TaskRow key={t.id} task={t} onOpen={onOpen} onRecategorise={(pill) => onRecategorise(t.id, pill)} onDefer={onDefer} />;

  const groupHeader = (label, danger) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: danger ? C.danger : C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
  );

  let body;
  if (groupMode === "due") {
    const g = {};
    for (const t of sorted) (g[dueBucket(t, today)] ||= []).push(t);
    body = DUE_ORDER.filter((k) => g[k]?.length).map((k) => (
      <div key={k} style={{ marginTop: 10 }}>{groupHeader(k, k === "Overdue")}{g[k].map(renderRow)}</div>
    ));
  } else if (groupMode === "label") {
    const order = column === "personal" ? PERSONAL_PILLS : WORK_PILLS;
    const g = {};
    for (const t of sorted) (g[t.pill] ||= []).push(t);
    const keys = [...order.filter((p) => g[p]), ...Object.keys(g).filter((p) => !order.includes(p))];
    body = keys.map((p) => (
      <div key={p} style={{ marginTop: 10 }}>
        <div style={{ marginBottom: 4 }}><Pill name={p} size="sm" /></div>
        {g[p].map(renderRow)}
      </div>
    ));
  } else {
    const shown = showAll ? sorted : sorted.slice(0, COLUMN_LIMIT);
    body = (
      <>
        {shown.map(renderRow)}
        {sorted.length > COLUMN_LIMIT && (
          <button onClick={() => setShowAll((v) => !v)} style={{ marginTop: 8, background: "none", border: "none", color: C.textSecondary, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", padding: "4px 2px" }}>
            {showAll ? "show fewer" : `+ ${sorted.length - COLUMN_LIMIT} more`}
          </button>
        )}
      </>
    );
  }

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
        <span style={{ fontSize: 12.5, color: C.textTertiary }}>{tasks.length}</span>
      </div>
      {tasks.length === 0 && <div style={{ fontSize: 13, color: C.textTertiary, padding: "10px 2px" }}>Nothing here.</div>}
      {body}
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
          style={{ width: "100%", marginTop: 8, border: `1px solid ${C.accent}`, borderRadius: 8, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", background: C.bg, color: C.text, outline: "none" }}
        />
      ) : (
        <button onClick={() => setAdding(true)} style={{ marginTop: 8, background: "none", border: "none", color: C.accent, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", padding: "4px 2px" }}>
          + add task
        </button>
      )}
    </div>
  );
}

// Tasks view — Work | Personal columns with sort, group-by (due / label), list
// limits, importance (1–3), and click-to-defer on each row. Spec §4.
export default function TasksView({ tasks, decisionsActive, isDesktop, onOpen, onRecategorise, onAdd, onDefer }) {
  const [sortBy, setSortBy] = useState("importance");
  const [groupMode, setGroupMode] = useState("none");
  const today = todayISO();

  const open = tasks.filter((t) => t.status !== "done");
  const visible = decisionsActive ? open.filter((t) => t.isDecision) : open;
  const work = visible.filter((t) => t.column === "work");
  const personal = visible.filter((t) => t.column === "personal");

  const col = (title, accent, column, list) => (
    <Column title={title} accent={accent} column={column} tasks={list} sortBy={sortBy} groupMode={groupMode} today={today} onOpen={onOpen} onRecategorise={onRecategorise} onDefer={onDefer} onAdd={(text) => onAdd(column, text)} />
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: C.textTertiary }}>Sort</span>
          <Segmented options={[{ value: "importance", label: "Importance" }, { value: "due", label: "Due" }, { value: "added", label: "Added" }]} value={sortBy} onChange={setSortBy} accent={C.accent} size="sm" />
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: C.textTertiary }}>Group</span>
          <Segmented options={[{ value: "none", label: "Off" }, { value: "due", label: "Due" }, { value: "label", label: "Label" }]} value={groupMode} onChange={setGroupMode} accent={C.accent} size="sm" />
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: isDesktop ? 36 : 24, alignItems: "flex-start" }}>
        {col("Work", ACCENT.work, "work", work)}
        {isDesktop && <div style={{ width: 0.5, alignSelf: "stretch", background: C.border }} />}
        {col("Personal", ACCENT.personal, "personal", personal)}
      </div>
    </div>
  );
}
