import React, { useState } from "react";
import { C, styles } from "../lib/tokens";
import HealthProject from "./projects/HealthProject.jsx";
import FinanceProject from "./projects/FinanceProject.jsx";
import TravelProject from "./projects/TravelProject.jsx";
import WorkProject from "./projects/WorkProject.jsx";
import LearningProject from "./projects/LearningProject.jsx";
import JournalProject from "./projects/JournalProject.jsx";
import RelationshipsProject from "./projects/RelationshipsProject.jsx";
import CharityProject from "./projects/CharityProject.jsx";
import { nextId } from "../lib/defaultState";

const PROJECT_META = [
  { key: "health", label: "Health", color: "#3B6D11" },
  { key: "finance", label: "Finance", color: "#185FA5" },
  { key: "travel", label: "Travel", color: "#0F6E56" },
  { key: "work", label: "Work", color: "#534AB7" },
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

function Tile({ meta, onClick, count, sub }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.bg,
        border: `0.5px solid ${C.border}`,
        borderRadius: 8,
        padding: 14,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.bgSecondary)}
      onMouseLeave={(e) => (e.currentTarget.style.background = C.bg)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{meta.label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 500, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>{count}</div>
      <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4 }}>{sub}</div>
    </button>
  );
}

function summary(projectKey, state) {
  const p = state.projects?.[projectKey] || {};
  switch (projectKey) {
    case "health": {
      const w = p.markers?.weight || [];
      const last = w[w.length - 1];
      return { count: last ? `${last.kg}kg` : "—", sub: `${(p.lifts || []).length} lifts tracked` };
    }
    case "finance": {
      const debts = p.debts?.length || 0;
      const sav = p.savings?.length || 0;
      return { count: debts, sub: debts === 1 ? "open debt" : `open debts · ${sav} savings accounts` };
    }
    case "travel": {
      const trips = p.trips || [];
      const next = [...trips].filter((t) => t.start).sort((a, b) => a.start.localeCompare(b.start))[0];
      return { count: trips.length, sub: next ? `next: ${next.name}` : "no trips planned" };
    }
    case "work": {
      const biz = p.businesses || [];
      return { count: biz.length, sub: biz.map((b) => b.name.split(" ")[0]).join(" · ") };
    }
    case "learning": {
      const r = (p.reading || []).length;
      const ph = p.spanish?.phrases?.length || 0;
      return { count: r, sub: `reading · ${ph} ES phrases` };
    }
    case "journal": {
      const e = (p.entries || []).length;
      return { count: e, sub: e === 1 ? "entry logged" : "entries logged" };
    }
    case "relationships": {
      const c = p.contacts || [];
      const overdue = c.filter((x) => x.stale).length;
      return { count: overdue, sub: "people overdue" };
    }
    case "charity": {
      return { count: (p.goals || []).length, sub: "goals" };
    }
    default:
      return { count: "—", sub: "" };
  }
}

export default function Projects({ state, setState, openOverride, setOpenOverride }) {
  const [openLocal, setOpenLocal] = useState(null);
  const open = openOverride ?? openLocal;
  const setOpen = setOpenOverride ?? setOpenLocal;

  const renderProject = (key) => {
    const meta = PROJECT_META.find((m) => m.key === key);
    const close = () => setOpen(null);
    const baseGoalHandlers = makeGoalHandlers(setState, ["projects", key, "goals"]);
    const props = { state, setState, meta, onClose: close, goalHandlers: baseGoalHandlers, makeGoalHandlers: (path) => makeGoalHandlers(setState, path), nextId };
    switch (key) {
      case "health":        return <HealthProject {...props} />;
      case "finance":       return <FinanceProject {...props} />;
      case "travel":        return <TravelProject {...props} />;
      case "work":          return <WorkProject {...props} />;
      case "learning":      return <LearningProject {...props} />;
      case "journal":       return <JournalProject {...props} />;
      case "relationships": return <RelationshipsProject {...props} />;
      case "charity":       return <CharityProject {...props} />;
      default:              return null;
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        Projects
        <span style={styles.sectionSub}>tap to open</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {PROJECT_META.map((m) => {
          const { count, sub } = summary(m.key, state);
          return <Tile key={m.key} meta={m} count={count} sub={sub} onClick={() => setOpen(m.key)} />;
        })}
      </div>
      {open && (
        <div style={{ paddingTop: 16, marginTop: 14, borderTop: `0.5px solid ${C.border}` }}>
          {renderProject(open)}
        </div>
      )}
    </div>
  );
}

export { PROJECT_META };
