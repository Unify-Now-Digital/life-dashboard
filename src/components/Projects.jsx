import React from "react";
import { C, tint } from "../lib/tokens";

const PROJECT_META = [
  { key: "work", label: "Work", color: "#534AB7" },
  { key: "health", label: "Health", color: "#3B6D11" },
  { key: "finance", label: "Finance", color: "#185FA5" },
  { key: "travel", label: "Travel", color: "#0F6E56" },
  { key: "learning", label: "Learning", color: "#854F0B" },
  { key: "journal", label: "Journal", color: "#791F1F" },
  { key: "relationships", label: "Relationships", color: "#3C3489" },
  { key: "charity", label: "Charity", color: "#0C447C" },
];

// Walk a path (array of keys) into state, replacing the leaf value via updater fn.
const setIn = (obj, path, updater) => {
  if (path.length === 0) return updater(obj);
  const [head, ...rest] = path;
  return Array.isArray(obj)
    ? obj.map((v, i) => (i === head ? setIn(v, rest, updater) : v))
    : { ...obj, [head]: setIn(obj?.[head], rest, updater) };
};

// Goal-list handler factory. `pathArr` points at the goals array
// (e.g. ["projects","health","goals"]).
export function makeGoalHandlers(setState, pathArr) {
  const update = (updater) => setState((s) => setIn(s, pathArr, updater));
  return {
    onAddGoal: () =>
      update((goals = []) => [
        ...goals,
        { id: `g-${Date.now().toString(36)}`, label: "New goal", target: null, priorities: [] },
      ]),
    onUpdateGoal: (gid, patch) =>
      update((goals = []) => goals.map((g) => (g.id === gid ? { ...g, ...patch } : g))),
    onRemoveGoal: (gid) => update((goals = []) => goals.filter((g) => g.id !== gid)),
    onAddPriority: (gid) =>
      update((goals = []) =>
        goals.map((g) =>
          g.id !== gid
            ? g
            : {
                ...g,
                priorities: [
                  ...(g.priorities || []),
                  { id: `p-${Date.now().toString(36)}`, label: "", done: false, starred: false, starredAt: null, doneAt: null, notes: "" },
                ],
              }
        )
      ),
    onUpdatePriority: (gid, pid, patch) =>
      update((goals = []) =>
        goals.map((g) =>
          g.id !== gid
            ? g
            : {
                ...g,
                priorities: (g.priorities || []).map((p) => (p.id === pid ? { ...p, ...patch } : p)),
              }
        )
      ),
    onRemovePriority: (gid, pid) =>
      update((goals = []) =>
        goals.map((g) =>
          g.id !== gid ? g : { ...g, priorities: (g.priorities || []).filter((p) => p.id !== pid) }
        )
      ),
  };
}

// ---- delta renderers per project ------------------------------------------

function Sparkline({ values, color, width = 64, height = 16 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} aria-hidden="true" style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color || C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function deltaBlock({ value, sub, accent, sparkline }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            color: accent || C.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 1 }}>{sub}</div>
        )}
      </div>
      {sparkline}
    </div>
  );
}

function deltaHealth(state, meta) {
  const w = state.projects?.health?.markers?.weight || [];
  if (w.length === 0) return deltaBlock({ value: "—", sub: "no weight logged" });
  const last = w[w.length - 1].kg;
  const prev = w.length > 1 ? w[w.length - 2].kg : null;
  const diff = prev != null ? last - prev : null;
  const arrow = diff == null ? "" : diff < 0 ? "↓" : diff > 0 ? "↑" : "·";
  const diffStr = diff == null ? "" : `${arrow}${Math.abs(diff).toFixed(1)}`;
  const series = w.slice(-7).map((r) => r.kg);
  return deltaBlock({
    value: `${last.toFixed(1)} kg ${diffStr}`,
    sub: `${w.length} entries · last 7d`,
    accent: diff == null ? C.text : diff < 0 ? C.success : C.danger,
    sparkline: <Sparkline values={series} color={meta.color} />,
  });
}

function deltaFinance(state, meta) {
  const f = state.projects?.finance || {};
  const sav = (f.savings || []).reduce((a, b) => a + (b.balance?.eur || 0), 0);
  const inv = (f.investments || []).reduce((a, b) => a + (b.value?.eur || 0), 0);
  const debt = (f.debts || []).reduce((a, b) => a + (b.amount?.eur || 0), 0);
  const net = sav + inv - debt;
  const fmt = (n) => `€${Math.round(n).toLocaleString()}`;
  return deltaBlock({
    value: fmt(net),
    sub: `${fmt(sav + inv)} assets · ${fmt(debt)} debt`,
  });
}

function deltaTravel(state) {
  const trips = state.projects?.travel?.trips || [];
  const today = new Date(new Date().toDateString());
  const next = [...trips]
    .filter((t) => t.start)
    .sort((a, b) => a.start.localeCompare(b.start))
    .find((t) => new Date(t.start) >= today);
  if (!next) return deltaBlock({ value: "—", sub: "no trips planned" });
  const days = Math.max(0, Math.ceil((new Date(next.start) - today) / 86400000));
  const checklist = next.checklist || {};
  const total = Object.keys(checklist).length;
  const done = Object.values(checklist).filter(Boolean).length;
  return deltaBlock({
    value: `${days}d → ${next.name}`,
    sub: total > 0 ? `checklist ${done}/${total}` : null,
    accent: total > 0 && done < total ? C.danger : C.text,
  });
}

function deltaWork(state) {
  const biz = state.projects?.work?.businesses || [];
  if (biz.length === 0) return deltaBlock({ value: "—", sub: "no businesses" });
  return (
    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
      {biz.map((b) => {
        const goals = b.goals || [];
        const totalP = goals.reduce((acc, g) => acc + (g.priorities?.length || 0), 0);
        const doneP = goals.reduce(
          (acc, g) => acc + (g.priorities?.filter((p) => p.done).length || 0),
          0
        );
        const denominator = goals.reduce((acc, g) => acc + (g.target ?? (g.priorities?.length || 0)), 0) || totalP;
        const pct = denominator > 0 ? Math.min(100, Math.round((doneP / denominator) * 100)) : null;
        return (
          <div
            key={b.id}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
          >
            <span style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {b.name}
            </span>
            <span style={{ fontSize: 12, color: C.textSecondary, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              {pct != null ? `${pct}%` : b.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function deltaLearning(state) {
  const l = state.projects?.learning || {};
  const esPhrases = l.spanish?.phrases?.length || 0;
  const trPhrases = l.turkish?.phrases?.length || 0;
  const seenES = (l.spanish?.phrasesSeen || []).length;
  return deltaBlock({
    value: `ES ${esPhrases} · TR ${trPhrases}`,
    sub: seenES > 0 ? `${seenES} phrases seen` : "tap to study",
  });
}

function deltaJournal(state) {
  const j = state.projects?.journal || {};
  const entries = j.entries || [];
  const last = entries[0];
  const lastLabel = last
    ? `last ${last.date}`
    : j.weekly && j.weekly.length > 0
    ? "weekly review pending"
    : "no entries yet";
  return deltaBlock({
    value: `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`,
    sub: lastLabel,
  });
}

function deltaRelationships(state) {
  const c = state.projects?.relationships?.contacts || [];
  const overdue = c.filter((x) => x.stale).length;
  const accent = overdue > 0 ? C.danger : C.text;
  return deltaBlock({
    value: `${overdue} overdue`,
    sub: c.map((x) => x.name.split(" ")[0]).join(" · "),
    accent,
  });
}

function deltaCharity(state) {
  const goals = state.projects?.charity?.goals || [];
  return deltaBlock({
    value: goals.length > 0 ? `${goals.length} goals` : "—",
    sub: goals.length === 0 ? "set a cause" : null,
  });
}

const DELTA_BY_KEY = {
  health: deltaHealth,
  finance: deltaFinance,
  travel: deltaTravel,
  work: deltaWork,
  learning: deltaLearning,
  journal: deltaJournal,
  relationships: deltaRelationships,
  charity: deltaCharity,
};

// ---- card -----------------------------------------------------------------

function Card({ meta, onClick, children, isOpen }) {
  // Soft per-project tint. Slightly stronger when the card is the open one.
  const bgRest = tint(meta.color, 0.04);
  const bgHover = tint(meta.color, 0.08);
  const bgOpen = tint(meta.color, 0.10);
  const borderRest = tint(meta.color, 0.22);
  const borderOpen = tint(meta.color, 0.55);
  return (
    <button
      onClick={onClick}
      aria-pressed={isOpen}
      style={{
        background: isOpen ? bgOpen : bgRest,
        border: `0.5px solid ${isOpen ? borderOpen : borderRest}`,
        borderLeft: `2px solid ${meta.color}`,
        borderRadius: 8,
        padding: "12px 14px",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "background 0.15s, border-color 0.15s",
        display: "block",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        if (!isOpen) e.currentTarget.style.background = bgHover;
      }}
      onMouseLeave={(e) => {
        if (!isOpen) e.currentTarget.style.background = bgRest;
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: meta.color,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, letterSpacing: "0.02em" }}>
          {meta.label}
        </span>
      </div>
      {children}
    </button>
  );
}

// ---- rail ----------------------------------------------------------------

export default function Projects({ state, openOverride, setOpenOverride, layout = "rail" }) {
  const open = openOverride;
  const setOpen = setOpenOverride;
  const isRow = layout === "row"; // mobile: horizontal scroll-snap
  return (
    <div
      style={{
        display: isRow ? "grid" : "flex",
        flexDirection: isRow ? undefined : "column",
        gridAutoFlow: isRow ? "column" : undefined,
        gridAutoColumns: isRow ? "min(220px, 70%)" : undefined,
        gap: 10,
        overflowX: isRow ? "auto" : "visible",
        scrollSnapType: isRow ? "x mandatory" : undefined,
        paddingBottom: isRow ? 4 : 0,
      }}
    >
      {PROJECT_META.map((m) => {
        const renderer = DELTA_BY_KEY[m.key];
        return (
          <div
            key={m.key}
            style={{
              scrollSnapAlign: isRow ? "start" : undefined,
            }}
          >
            <Card meta={m} onClick={() => setOpen(m.key)} isOpen={open === m.key}>
              {renderer ? renderer(state, m) : null}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

export { PROJECT_META };
