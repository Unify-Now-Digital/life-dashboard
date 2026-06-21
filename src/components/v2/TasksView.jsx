import React, { useState } from "react";
import { C, ACCENT } from "../../lib/tokens";
import Segmented from "./Segmented.jsx";
import { PillSelect } from "./Pill.jsx";

const META_OVERDUE = new Set(["overdue"]);
const COLUMN_LIMIT = 10;

const todayISO = () => new Date().toISOString().slice(0, 10);
const dueKey = (t) => t.due || "9999-99-99";

// Sort comparators.
const CMP = {
  importance: (a, b) => (b.importance || 1) - (a.importance || 1) || dueKey(a).localeCompare(dueKey(b)) || (a.createdAt || "").localeCompare(b.createdAt || ""),
  due: (a, b) => dueKey(a).localeCompare(dueKey(b)) || (b.importance || 1) - (a.importance || 1),
  added: (a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""),
};

// Due-bucket grouping.
const GROUP_ORDER = ["Overdue", "Today", "This week", "Later"];
function bucketOf(t, today) {
  if (!t.due) return "Later";
  if (t.due < today) return "Overdue";
  if (t.due === today) return "Today";
  const diff = (new Date(t.due) - new Date(today)) / 86400000;
  return diff <= 7 ? "This week" : "Later";
}

// Importance indicator — three rising bars, filled to the level. Hidden at 1.
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

function TaskRow({ task, onOpen, onRecategorise }) {
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
      {meta && (
        <span style={{ fontSize: 12.5, fontWeight: 500, color: overdue ? C.danger : C.textTertiary, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>
          {meta}
        </span>
      )}
    </div>
  );
}

function Column({ title, accent, tasks, sortBy, grouped, today, onOpen, onRecategorise, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [showAll, setShowAll] = useState(false);

  const sorted = [...tasks].sort(CMP[sortBy]);

  const commit = () => {
    const text = draft.trim();
    if (text) onAdd(text);
    setDraft("");
    setAdding(false);
  };

  const renderRow = (t) => <TaskRow key={t.id} task={t} onOpen={onOpen} onRecategorise={(pill) => onRecategorise(t.id, pill)} />;

  let body;
  if (grouped) {
    const groups = {};
    for (const t of sorted) (groups[bucketOf(t, today)] ||= []).push(t);
    body = GROUP_ORDER.filter((g) => groups[g]?.length).map((g) => (
      <div key={g} style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: g === "Overdue" ? C.danger : C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{g}</div>
        {groups[g].map(renderRow)}
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

// Tasks view — Work | Personal columns with sort / group-by-due / list limits
// and an importance (1–3) indicator. Spec §4.
export default function TasksView({ tasks, decisionsActive, isDesktop, onOpen, onRecategorise, onAdd }) {
  const [sortBy, setSortBy] = useState("importance");
  const [grouped, setGrouped] = useState(false);
  const today = todayISO();

  const open = tasks.filter((t) => t.status !== "done");
  const visible = decisionsActive ? open.filter((t) => t.isDecision) : open;
  const work = visible.filter((t) => t.column === "work");
  const personal = visible.filter((t) => t.column === "personal");

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <span style={{ fontSize: 12.5, color: C.textTertiary }}>Sort</span>
        <Segmented
          options={[{ value: "importance", label: "Importance" }, { value: "due", label: "Due" }, { value: "added", label: "Added" }]}
          value={sortBy}
          onChange={setSortBy}
          accent={C.accent}
          size="sm"
        />
        <button
          onClick={() => setGrouped((g) => !g)}
          style={{
            border: `0.5px solid ${grouped ? C.accent : C.border}`,
            background: grouped ? C.accentLight : "transparent",
            color: grouped ? C.accentDark : C.textSecondary,
            borderRadius: 999,
            padding: "5px 13px",
            fontSize: 12.5,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Group by due
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: isDesktop ? 36 : 24, alignItems: "flex-start" }}>
        <Column title="Work" accent={ACCENT.work} tasks={work} sortBy={sortBy} grouped={grouped} today={today} onOpen={onOpen} onRecategorise={onRecategorise} onAdd={(text) => onAdd("work", text)} />
        {isDesktop && <div style={{ width: 0.5, alignSelf: "stretch", background: C.border }} />}
        <Column title="Personal" accent={ACCENT.personal} tasks={personal} sortBy={sortBy} grouped={grouped} today={today} onOpen={onOpen} onRecategorise={onRecategorise} onAdd={(text) => onAdd("personal", text)} />
      </div>
    </div>
  );
}
