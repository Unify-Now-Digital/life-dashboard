import React, { useState, useEffect, useRef } from "react";
import { styles, QUOTES } from "./lib/tokens";
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
import Projects from "./components/Projects.jsx";
import ProjectDrilldown from "./components/ProjectDrilldown.jsx";

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

  const mainColumn = (
    <div style={styles.stack}>
      <TopThree
        state={state}
        onOpenProject={setOpenProject}
        onTogglePriority={togglePriorityDone}
        onUnstar={unstar}
      />
      <Calendar state={state} onOpenProject={setOpenProject} />
      <Habits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
      <GoalsRollup state={state} onOpenProject={setOpenProject} />
    </div>
  );

  const rightRail = (
    <aside
      style={{
        position: isDesktop ? "sticky" : "static",
        top: 24,
        alignSelf: "start",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxHeight: isDesktop ? "calc(100vh - 48px)" : undefined,
        overflowY: isDesktop ? "auto" : "visible",
        paddingRight: 2,
      }}
    >
      <NorthStar value={state.northStar} onChange={setNorthStar} compact />
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
      <div style={{ marginTop: 4 }}>
        <Projects
          state={state}
          openOverride={openProject}
          setOpenOverride={setOpenProject}
          layout="row"
        />
      </div>
      <TopThree
        state={state}
        onOpenProject={setOpenProject}
        onTogglePriority={togglePriorityDone}
        onUnstar={unstar}
      />
      <Calendar state={state} onOpenProject={setOpenProject} />
      <Habits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
      <GoalsRollup state={state} onOpenProject={setOpenProject} />
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

        {openProject && (
          <div style={{ marginTop: 20 }}>
            <ProjectDrilldown
              state={state}
              setState={setState}
              projectKey={openProject}
              onClose={closeDrilldown}
            />
          </div>
        )}

        <StickyHabits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
        {undo && <UndoToast label={undo.label} onUndo={undo.onUndo} />}
      </div>
    </AuthGate>
  );
}
