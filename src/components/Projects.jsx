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
  const h = state.projects?.health || {};
  // v4 stores weight at health.weight; older blobs may still have it under
  // markers.weight before migration runs.
  const w = h.weight || h.markers?.weight || [];
  if (w.length === 0) return deltaBlock({ value: "—", sub: "no weight logged" });
  // Sort ascending by date to be safe — entries can land out of order.
  const sorted = [...w].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const last = sorted[sorted.length - 1].kg;
  // Weekly Δ — closest entry on or before 7 days ago.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffISO = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
  const ref = [...sorted].reverse().find((r) => (r.date || "") <= cutoffISO) || sorted[0];
  const diff = ref && ref.date !== sorted[sorted.length - 1].date ? +(last - ref.kg).toFixed(1) : null;
  const arrow = diff == null ? "" : diff < 0 ? "↓" : diff > 0 ? "↑" : "·";
  const diffStr = diff == null ? "" : `${arrow}${Math.abs(diff).toFixed(1)} / wk`;
  const series = sorted.slice(-7).map((r) => r.kg);
  // Optional waist line — show if available.
  const waist = (h.waist || []).slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const waistLast = waist[waist.length - 1]?.cm;
  const waistLine = waistLast != null ? ` · waist ${waistLast} cm` : "";
  return deltaBlock({
    value: `${last.toFixed(1)} kg ${diffStr}`.trim(),
    sub: `${w.length} entries${waistLine}`,
    accent: diff == null ? C.text : diff < 0 ? C.success : C.danger,
    sparkline: <Sparkline values={series} color={meta.color} />,
  });
}

// Defensive: handles new plain-EUR-number shape AND legacy money-object shape.
const moneyEur = (item) => {
  const v = item?.amount ?? item?.balance ?? item?.value;
  if (typeof v === "number") return v;
  if (v && typeof v === "object") return v.eur ?? v.amount ?? 0;
  return 0;
};

function deltaFinance(state, meta) {
  const f = state.projects?.finance || {};
  const sav = (f.savings || []).reduce((a, b) => a + moneyEur(b), 0);
  const inv = (f.investments || []).reduce((a, b) => a + moneyEur(b), 0);
  const debt = (f.debts || []).reduce((a, b) => a + moneyEur(b), 0);
  const net = sav + inv - debt;
  const fmt = (n) => `${n < 0 ? "-" : ""}€${Math.abs(Math.round(n)).toLocaleString()}`;

  // Sparkline of last 7 weekly net-worth snapshots — visualises net position
  // over time, per the "vs net position" requirement.
  const history = (f.netWorthHistory || []).slice(-7).map((p) => p.eur);
  const series = history.length >= 2 ? history : [net, net];

  // Revenue Δ vs last month from revenueHistory.
  const rev = f.revenueHistory || [];
  const cur = rev.length > 0 ? rev[rev.length - 1].eur : null;
  const prev = rev.length > 1 ? rev[rev.length - 2].eur : null;
  const revDelta = cur != null && prev != null ? cur - prev : null;
  const arrow = revDelta == null ? "" : revDelta > 0 ? "↑" : revDelta < 0 ? "↓" : "·";
  const revLine =
    cur != null
      ? `rev ${fmt(cur)}/mo${revDelta != null ? ` ${arrow}${fmt(Math.abs(revDelta))}` : ""}`
      : `${fmt(sav + inv)} assets · ${fmt(debt)} debt`;

  return deltaBlock({
    value: fmt(net),
    sub: revLine,
    accent: revDelta == null ? C.text : revDelta > 0 ? C.success : C.danger,
    sparkline: <Sparkline values={series} color={meta.color} />,
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
  return deltaBlock({
    value: `${days}d → ${next.name}`,
    sub: next.sub || null,
  });
}

function deltaWork(state) {
  const biz = state.projects?.work?.businesses || [];
  if (biz.length === 0) return deltaBlock({ value: "—", sub: "no businesses" });
  // First incomplete todo across businesses, in business order. No financial
  // figures — we surface the top actionable task instead.
  for (const b of biz) {
    const todo = (b.todos || []).find((t) => !t.done);
    if (todo && (todo.title || "").trim()) {
      return deltaBlock({
        value: todo.title,
        sub: b.name,
      });
    }
  }
  return deltaBlock({
    value: `${biz.length} businesses`,
    sub: "all tasks done",
  });
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
        padding: "8px 10px",
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

// ---- floating mobile pill ------------------------------------------------

function FloatingPill({ meta, isOpen, onClick }) {
  const bg = isOpen ? meta.color : tint(meta.color, 0.18);
  const fg = isOpen ? "#fff" : meta.color;
  return (
    <button
      onClick={onClick}
      title={meta.label}
      aria-label={meta.label}
      style={{
        background: bg,
        color: fg,
        border: `0.5px solid ${tint(meta.color, 0.55)}`,
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        minWidth: 48,
        minHeight: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isOpen ? "#fff" : meta.color,
          flexShrink: 0,
        }}
      />
      {meta.label}
    </button>
  );
}

// ---- rail / row / float --------------------------------------------------

export default function Projects({ state, openOverride, setOpenOverride, layout = "rail" }) {
  const open = openOverride;
  const setOpen = setOpenOverride;

  if (layout === "float") {
    // Mobile: compact pills floating on the bottom-right, stacked upward.
    // Reverse iteration so PROJECT_META[0] (Work) sits at the bottom — the
    // most reachable spot for a thumb. column-reverse handles the visual flip.
    const onTap = (key) => {
      setOpen(open === key ? null : key);
      // Scroll to the drilldown so the user sees the result immediately.
      setTimeout(() => {
        const drill = document.getElementById("project-drilldown-anchor");
        if (drill) drill.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 30);
    };
    return (
      <div
        style={{
          position: "fixed",
          right: 8,
          bottom: 120, // sits clear of StickyHabits and home-indicator safe area
          display: "flex",
          flexDirection: "column-reverse",
          gap: 5,
          zIndex: 40,
          pointerEvents: "auto",
        }}
      >
        {PROJECT_META.map((m) => (
          <FloatingPill key={m.key} meta={m} isOpen={open === m.key} onClick={() => onTap(m.key)} />
        ))}
      </div>
    );
  }

  const isRow = layout === "row";
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
