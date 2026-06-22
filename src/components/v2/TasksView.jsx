import React, { useState, useRef } from "react";
import { C, ACCENT, WORK_PILLS, PERSONAL_PILLS } from "../../lib/tokens";
import { PillSelect, Pill } from "./Pill.jsx";
import { todayISO } from "../../lib/taskDates.js";

const META_OVERDUE = new Set(["overdue"]);
const COLUMN_LIMIT = 10;
const SWIPE_TRIGGER = 72;
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

// Keep a saved group order in sync with the groups that currently exist.
function reconcile(saved, natural) {
  const s = (Array.isArray(saved) ? saved : []).filter((k) => natural.includes(k));
  return [...s, ...natural.filter((k) => !s.includes(k))];
}

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

function ReorderArrow({ dir, disabled, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }}
      disabled={disabled}
      aria-label={dir === "up" ? "Move group up" : "Move group down"}
      style={{ background: "none", border: "none", padding: 2, cursor: disabled ? "default" : "pointer", color: disabled ? C.border : C.textTertiary, fontSize: 11, lineHeight: 1, fontFamily: "inherit" }}
    >
      {dir === "up" ? "▲" : "▼"}
    </button>
  );
}

function TaskRow({ task, hidePill, isDesktop, onOpen, onRecategorise, onDefer, onToggleDone, onDelete }) {
  const [deferOpen, setDeferOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [dx, setDx] = useState(0);
  const startX = useRef(0);
  const swiping = useRef(false);
  const meta = task.meta;
  const overdue = meta && META_OVERDUE.has(String(meta).toLowerCase());
  const done = task.status === "done";

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; swiping.current = true; };
  const onTouchMove = (e) => {
    if (!swiping.current) return;
    const d = e.touches[0].clientX - startX.current;
    setDx(Math.max(-130, Math.min(130, d)));
  };
  const onTouchEnd = () => {
    swiping.current = false;
    if (dx > SWIPE_TRIGGER) onToggleDone(task.id);
    else if (dx < -SWIPE_TRIGGER) onDelete(task.id);
    setDx(0);
  };

  const quickBtn = (label, color, onClick) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color, display: "flex", alignItems: "center", flexShrink: 0 }}
    >
      {label === "Delete" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>
      )}
    </button>
  );

  return (
    <div style={{ position: "relative", overflow: dx !== 0 ? "hidden" : "visible", borderBottom: `0.5px solid ${C.border}` }}>
      {/* swipe action backdrops */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", fontSize: 13, fontWeight: 600, pointerEvents: "none" }}>
        <span style={{ color: C.success, opacity: dx > 8 ? 1 : 0 }}>{done ? "Reopen" : "✓ Done"}</span>
        <span style={{ color: C.danger, opacity: dx < -8 ? 1 : 0 }}>Delete</span>
      </div>

      <div
        onClick={() => onOpen(task.id)}
        onMouseEnter={() => isDesktop && setHover(true)}
        onMouseLeave={() => isDesktop && setHover(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpen(task.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 2px",
          cursor: "pointer",
          background: C.bg,
          transform: dx !== 0 ? `translateX(${dx}px)` : "none",
          transition: swiping.current ? "none" : "transform 0.16s ease",
        }}
      >
        {isDesktop && hover && quickBtn(done ? "Reopen" : "Done", done ? C.textTertiary : C.success, () => onToggleDone(task.id))}
        {!hidePill && (
          <span onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex" }}>
            <PillSelect value={task.pill} column={task.column} onChange={onRecategorise} />
          </span>
        )}
        <span style={{ flex: 1, fontSize: 14.5, color: done ? C.textTertiary : C.text, textDecoration: done ? "line-through" : "none", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.text}
        </span>
        <ImportanceMark level={task.importance} />

        <span style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setDeferOpen((o) => !o)}
            title="Defer"
            style={{ background: "transparent", border: "none", padding: "2px", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, color: overdue ? C.danger : meta ? C.textTertiary : C.borderStrong, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}
          >
            {meta || (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>
            )}
          </button>
          {deferOpen && (
            <>
              <div onClick={() => setDeferOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 61, background: C.card, border: `0.5px solid ${C.borderStrong}`, borderRadius: 9, padding: 4, boxShadow: "0 6px 20px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", minWidth: 110 }}>
                {DEFERS.map(({ n, label }) => (
                  <button key={n} onClick={() => { onDefer(task.id, n); setDeferOpen(false); }} style={{ background: "transparent", border: "none", textAlign: "left", padding: "7px 10px", borderRadius: 6, fontSize: 13, color: C.text, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </span>

        {isDesktop && hover && quickBtn("Delete", C.textTertiary, () => onDelete(task.id))}
      </div>
    </div>
  );
}

function Column({ title, accent, column, tasks, sortBy, groupMode, groupOrder, today, isDesktop, onOpen, onRecategorise, onDefer, onToggleDone, onDelete, onReorderGroups, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [showAll, setShowAll] = useState(false);

  const sorted = [...tasks].sort(CMP[sortBy]);
  const renderRow = (t) => (
    <TaskRow key={t.id} task={t} hidePill={groupMode === "label"} isDesktop={isDesktop} onOpen={onOpen} onRecategorise={(pill) => onRecategorise(t.id, pill)} onDefer={onDefer} onToggleDone={onToggleDone} onDelete={onDelete} />
  );

  let body;
  if (groupMode === "due" || groupMode === "label") {
    const groups = {};
    let natural;
    let headerFor;
    if (groupMode === "due") {
      for (const t of sorted) (groups[dueBucket(t, today)] ||= []).push(t);
      natural = DUE_ORDER.filter((k) => groups[k]?.length);
      headerFor = (k) => <span style={{ fontSize: 11, fontWeight: 600, color: k === "Overdue" ? C.danger : C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</span>;
    } else {
      // Default group order: Admin leads the personal column.
      const order = column === "personal" ? ["Admin", "Money", "Health", "Home"] : WORK_PILLS;
      for (const t of sorted) (groups[t.pill] ||= []).push(t);
      natural = [...order.filter((p) => groups[p]), ...Object.keys(groups).filter((p) => !order.includes(p))];
      headerFor = (k) => <Pill name={k} size="sm" />;
    }
    const keys = reconcile(groupOrder?.[`${groupMode}:${column}`], natural);
    const move = (k, dir) => {
      const i = keys.indexOf(k);
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= keys.length) return;
      const next = [...keys];
      [next[i], next[j]] = [next[j], next[i]];
      onReorderGroups(column, groupMode, next);
    };
    body = keys.map((k, idx) => (
      <div key={k} style={{ marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
          {headerFor(k)}
          <span style={{ flex: 1 }} />
          <ReorderArrow dir="up" disabled={idx === 0} onClick={() => move(k, "up")} />
          <ReorderArrow dir="down" disabled={idx === keys.length - 1} onClick={() => move(k, "down")} />
        </div>
        {groups[k].map(renderRow)}
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

// Tasks view — Work | Personal columns with sort, grouping (due / category) +
// reorderable groups, list limits, importance, click-to-defer, and quick
// complete / delete (swipe on mobile). Spec §4.
export default function TasksView({ tasks, decisionsActive, isDesktop, sortBy = "importance", groupMode = "none", groupOrder = {}, onOpen, onRecategorise, onAdd, onDefer, onToggleDone, onDelete, onReorderGroups }) {
  const today = todayISO();
  const open = tasks.filter((t) => t.status !== "done");
  const visible = decisionsActive ? open.filter((t) => t.isDecision) : open;

  const col = (title, accent, column, list) => (
    <Column title={title} accent={accent} column={column} tasks={list} sortBy={sortBy} groupMode={groupMode} groupOrder={groupOrder} today={today} isDesktop={isDesktop} onOpen={onOpen} onRecategorise={onRecategorise} onDefer={onDefer} onToggleDone={onToggleDone} onDelete={onDelete} onReorderGroups={onReorderGroups} onAdd={(text) => onAdd(column, text)} />
  );

  return (
    <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: isDesktop ? 36 : 24, alignItems: "flex-start" }}>
      {col("Work", ACCENT.work, "work", visible.filter((t) => t.column === "work"))}
      {isDesktop && <div style={{ width: 0.5, alignSelf: "stretch", background: C.border }} />}
      {col("Personal", ACCENT.personal, "personal", visible.filter((t) => t.column === "personal"))}
    </div>
  );
}
