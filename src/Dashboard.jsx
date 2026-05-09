import React, { useState, useEffect, useRef } from "react";
import { C, styles, QUOTES } from "./lib/tokens";
import { defaultState } from "./lib/defaultState";
import { loadFromCache, loadFromCloud, saveState, flushQueue } from "./lib/storage";

import Header from "./components/Header.jsx";
import NorthStar from "./components/NorthStar.jsx";
import Habits from "./components/Habits.jsx";
import StickyHabits from "./components/StickyHabits.jsx";
import UndoToast from "./components/UndoToast.jsx";
import AuthGate from "./components/AuthGate.jsx";
import TopThree from "./components/TopThree.jsx";
import GoalsRollup from "./components/GoalsRollup.jsx";
import Calendar from "./components/Calendar.jsx";
import Projects, { PROJECT_META } from "./components/Projects.jsx";
import ProjectDrilldown from "./components/ProjectDrilldown.jsx";
import JumpNav from "./components/JumpNav.jsx";

// Projects that get always-rendered collapsible sections in the main column,
// in display order (beneath Habits). Tapping their rail card / floating pill
// expands the corresponding section; everything else uses the on-demand
// drilldown panel.
//
// Each entry sets the section's default open/closed state independently —
// Work and Finance start expanded so the subcards show without an extra tap.
const SECTIONS = [
  { key: "work", defaultOpen: true },
  { key: "finance", defaultOpen: true },
  { key: "health", defaultOpen: false },
];
const SECTION_KEYS = SECTIONS.map((s) => s.key);

function MainSection({ projectKey, defaultOpen, openProject, setOpenProject, state, setState }) {
  const meta = PROJECT_META.find((m) => m.key === projectKey);
  // Local open state (so each section has its own life) seeded by defaultOpen.
  // Tapping a rail card / floating pill sets openProject = projectKey, which
  // is treated as a force-open signal — but local toggle remains the source
  // of truth thereafter so users can collapse expanded-by-default sections.
  const [localOpen, setLocalOpen] = React.useState(defaultOpen);
  const railSignal = openProject === projectKey;
  // Sync: when the rail flips this section to open, mirror that locally.
  React.useEffect(() => {
    if (railSignal) setLocalOpen(true);
  }, [railSignal]);

  const isOpen = localOpen;
  const toggle = () => {
    setLocalOpen((v) => !v);
    if (openProject === projectKey) setOpenProject(null);
  };

  return (
    <div style={styles.card}>
      <button
        onClick={toggle}
        aria-expanded={isOpen}
        style={{
          ...styles.sectionH,
          margin: 0,
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "inherit",
          color: "inherit",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: meta?.color || C.accent,
            }}
          />
          {meta?.label || projectKey}
        </span>
        <span
          aria-hidden="true"
          style={{
            fontSize: 11,
            color: C.textTertiary,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            display: "inline-block",
          }}
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${C.border}` }}>
          <ProjectDrilldown
            projectKey={projectKey}
            state={state}
            setState={setState}
            onClose={() => setLocalOpen(false)}
            embedded
          />
        </div>
      )}
    </div>
  );
}

function useIsDesktop(breakpoint = 860) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isDesktop;
}

export default function Dashboard() {
  const [state, setStateRaw] = useState(() => loadFromCache() || defaultState);
  const isDesktop = useIsDesktop();
  // Drilldown closed by default so the dashboard fits one viewport. Tap any
  // project card to expand it beneath Top 3; only one can be open at a time.
  const [openProject, setOpenProject] = useState(null);

  // Hydrate from cloud once on mount, reconcile if newer.
  useEffect(() => {
    let alive = true;
    loadFromCloud().then((cloud) => {
      if (alive && cloud) setStateRaw(cloud);
    });
    flushQueue();
    const onFocus = () => flushQueue();
    window.addEventListener("focus", onFocus);
    return () => { alive = false; window.removeEventListener("focus", onFocus); };
  }, []);

  // Wrap setState so every change persists.
  const setState = (updater) => {
    setStateRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  };

  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - start) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  const [undo, setUndo] = useState(null);
  const undoTimerRef = useRef(null);
  useEffect(
    () => () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); },
    []
  );

  const enqueueUndo = (entry) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndo(null), 5000);
    setUndo(entry);
  };

  const confirmHabit = (habit, dateISO, answer) =>
    setState((s) => {
      const yes = (s.habitLog[habit] || []).filter((d) => d !== dateISO);
      const no = (s.habitNoLog[habit] || []).filter((d) => d !== dateISO);
      if (answer === "yes") yes.push(dateISO);
      if (answer === "no") no.push(dateISO);
      return {
        ...s,
        habitLog: { ...s.habitLog, [habit]: yes },
        habitNoLog: { ...s.habitNoLog, [habit]: no },
      };
    });

  const setNorthStar = (text) => setState((s) => ({ ...s, northStar: text }));

  // ---- Top 3 helpers ------------------------------------------------------
  const patchPriority = (projectKey, priorityId, patch) => {
    setState((s) => {
      const next = JSON.parse(JSON.stringify(s));
      if (projectKey.startsWith("work:")) {
        const bizKey = projectKey.split(":")[1];
        const biz = next.projects.work.businesses.find((b) => b.key === bizKey);
        if (biz) {
          for (const g of biz.goals || []) {
            const pi = (g.priorities || []).findIndex((p) => p.id === priorityId);
            if (pi >= 0) g.priorities[pi] = { ...g.priorities[pi], ...patch };
          }
        }
      } else {
        const proj = next.projects[projectKey];
        if (proj) {
          for (const g of proj.goals || []) {
            const pi = (g.priorities || []).findIndex((p) => p.id === priorityId);
            if (pi >= 0) g.priorities[pi] = { ...g.priorities[pi], ...patch };
          }
        }
      }
      return next;
    });
  };
  const togglePriorityDone = (projectKey, priorityId, today) =>
    setState((s) => {
      const cur = (function findCurrent() {
        const route = projectKey.startsWith("work:")
          ? s.projects.work.businesses.find((b) => b.key === projectKey.split(":")[1])?.goals || []
          : (s.projects[projectKey]?.goals || []);
        for (const g of route) for (const p of g.priorities || []) if (p.id === priorityId) return p;
        return null;
      })();
      if (!cur) return s;
      const willBeDone = !cur.done;
      const next = JSON.parse(JSON.stringify(s));
      const arr = projectKey.startsWith("work:")
        ? next.projects.work.businesses.find((b) => b.key === projectKey.split(":")[1])?.goals || []
        : (next.projects[projectKey]?.goals || []);
      for (const g of arr)
        for (let i = 0; i < (g.priorities || []).length; i++)
          if (g.priorities[i].id === priorityId) {
            g.priorities[i] = { ...g.priorities[i], done: willBeDone, doneAt: willBeDone ? today : null, starred: willBeDone ? false : g.priorities[i].starred };
          }
      return next;
    });
  const unstar = (projectKey, priorityId) => patchPriority(projectKey, priorityId, { starred: false, starredAt: null });

  // ---- Render -------------------------------------------------------------

  const closeDrilldown = () => setOpenProject(null);

  // Only render the on-demand drilldown for projects that DON'T have a
  // permanent collapsible section in the main column.
  const drilldownPanel =
    openProject && !SECTION_KEYS.includes(openProject) ? (
      <div id="project-drilldown-anchor">
        <ProjectDrilldown
          state={state}
          setState={setState}
          projectKey={openProject}
          onClose={closeDrilldown}
        />
      </div>
    ) : null;

  const mainSections = SECTIONS.map((s) => (
    <MainSection
      key={s.key}
      projectKey={s.key}
      defaultOpen={s.defaultOpen}
      openProject={openProject}
      setOpenProject={setOpenProject}
      state={state}
      setState={setState}
    />
  ));

  const mainColumn = (
    <div style={styles.stack}>
      <TopThree
        state={state}
        onOpenProject={setOpenProject}
        onTogglePriority={togglePriorityDone}
        onUnstar={unstar}
      />
      <Habits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
      {mainSections}
      {drilldownPanel}
      <Calendar state={state} onOpenProject={setOpenProject} />
    </div>
  );

  const rightRail = (
    <aside
      style={{
        // Let the rail flow naturally — it scrolls with the page once it
        // exceeds the viewport, so all 8 cards (incl. Learning at the bottom)
        // remain reachable.
        alignSelf: "start",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <NorthStar value={state.northStar} onChange={setNorthStar} compact />
      <GoalsRollup state={state} onOpenProject={setOpenProject} />
      <Projects
        state={state}
        openOverride={openProject}
        setOpenOverride={setOpenProject}
        layout="rail"
      />
    </aside>
  );

  const mobileLayout = (
    <div style={styles.stack}>
      <NorthStar value={state.northStar} onChange={setNorthStar} compact />
      <GoalsRollup state={state} onOpenProject={setOpenProject} />
      <TopThree
        state={state}
        onOpenProject={setOpenProject}
        onTogglePriority={togglePriorityDone}
        onUnstar={unstar}
      />
      <Habits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
      {mainSections}
      {drilldownPanel}
      <Calendar state={state} onOpenProject={setOpenProject} />
      <Projects
        state={state}
        openOverride={openProject}
        setOpenOverride={setOpenProject}
        layout="float"
      />
    </div>
  );

  return (
    <AuthGate>
      <div style={styles.page}>
        <Header today={today} dayOfYear={dayOfYear} quote={quote} />

        {isDesktop ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 280px",
              gap: 20,
              alignItems: "start",
            }}
          >
            {mainColumn}
            {rightRail}
          </div>
        ) : (
          mobileLayout
        )}

        <StickyHabits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
        {isDesktop && <JumpNav />}
        {undo && <UndoToast label={undo.label} onUndo={undo.onUndo} />}
      </div>
    </AuthGate>
  );
}
