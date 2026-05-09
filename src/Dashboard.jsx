import React, { useState, useEffect, useRef } from "react";
import { styles, QUOTES } from "./lib/tokens";
import { defaultState, nextId } from "./lib/defaultState";
import { loadFromCache, loadFromCloud, saveState, flushQueue } from "./lib/storage";

import Header from "./components/Header.jsx";
import NorthStar from "./components/NorthStar.jsx";
import Habits from "./components/Habits.jsx";
import StickyHabits from "./components/StickyHabits.jsx";
import Upcoming from "./components/Upcoming.jsx";
import Metrics from "./components/Metrics.jsx";
import UndoToast from "./components/UndoToast.jsx";
import AuthGate from "./components/AuthGate.jsx";
import TopThree from "./components/TopThree.jsx";
import GoalsRollup from "./components/GoalsRollup.jsx";
import Projects from "./components/Projects.jsx";

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

  const removeWithUndo = (getList, replaceList, label) => (id) => {
    const list = getList(state);
    const idx = list.findIndex((it) => it.id === id);
    if (idx < 0) return;
    const item = list[idx];
    setState((s) => replaceList(s, getList(s).filter((it) => it.id !== id)));
    enqueueUndo({
      label,
      onUndo: () => {
        setState((s) => {
          const cur = getList(s);
          return replaceList(s, [...cur.slice(0, idx), item, ...cur.slice(idx)]);
        });
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setUndo(null);
      },
    });
  };

  const updateItemInList = (path, id, field, value) => {
    setState((s) => {
      const newState = JSON.parse(JSON.stringify(s));
      let target = newState;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      const list = target[path[path.length - 1]];
      const idx = list.findIndex((it) => it.id === id);
      if (idx >= 0) list[idx] = { ...list[idx], [field]: value };
      return newState;
    });
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

  const upcomingHandlers = {
    onUpdate: (id, field, value) => updateItemInList(["upcoming"], id, field, value),
    onAdd: () =>
      setState((s) => ({
        ...s,
        upcoming: [...s.upcoming, { id: nextId(s.upcoming), date: "—", text: "New item", cat: "Personal" }],
      })),
    onRemove: removeWithUndo(
      (s) => s.upcoming,
      (s, u) => ({ ...s, upcoming: u }),
      "Upcoming item removed"
    ),
  };

  const updateMetric = (key, value) =>
    setState((s) => ({ ...s, metrics: { ...s.metrics, [key]: value } }));

  // ---- Top 3 helpers ------------------------------------------------------
  // Find a priority by (projectKey, priorityId) and apply a patch. projectKey
  // may be "work:churchill" for nested-business priorities.
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
      // Fresh read of current value
      const cur = (function findCurrent() {
        const route = projectKey.startsWith("work:")
          ? s.projects.work.businesses.find((b) => b.key === projectKey.split(":")[1])?.goals || []
          : (s.projects[projectKey]?.goals || []);
        for (const g of route) for (const p of g.priorities || []) if (p.id === priorityId) return p;
        return null;
      })();
      if (!cur) return s;
      const willBeDone = !cur.done;
      // Apply via patch; need synchronous-style return
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

  const topStack = (
    <div style={{ ...styles.stack, marginBottom: 20 }}>
      <NorthStar value={state.northStar} onChange={setNorthStar} />
      <Habits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
    </div>
  );

  const leftColumn = (
    <div style={styles.stack}>
      <TopThree
        state={state}
        onOpenProject={setOpenProject}
        onTogglePriority={togglePriorityDone}
        onUnstar={unstar}
      />
      <GoalsRollup state={state} onOpenProject={setOpenProject} />
    </div>
  );

  const rightColumn = (
    <div style={styles.stack}>
      <Upcoming items={state.upcoming} {...upcomingHandlers} />
      <Metrics m={state.metrics} onUpdate={updateMetric} state={state} />
    </div>
  );

  return (
    <AuthGate>
      <div style={styles.page}>
        <Header today={today} dayOfYear={dayOfYear} quote={quote} />

        {topStack}

        {isDesktop ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
              {leftColumn}
              {rightColumn}
            </div>
            <div style={{ marginTop: 20 }}>
              <Projects
                state={state}
                setState={setState}
                openOverride={openProject}
                setOpenOverride={setOpenProject}
              />
            </div>
          </>
        ) : (
          <div style={styles.stack}>
            <TopThree
              state={state}
              onOpenProject={setOpenProject}
              onTogglePriority={togglePriorityDone}
              onUnstar={unstar}
            />
            <GoalsRollup state={state} onOpenProject={setOpenProject} />
            <Upcoming items={state.upcoming} {...upcomingHandlers} />
            <Metrics m={state.metrics} onUpdate={updateMetric} state={state} />
            <Projects
              state={state}
              setState={setState}
              openOverride={openProject}
              setOpenOverride={setOpenProject}
            />
          </div>
        )}

        <StickyHabits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
        {undo && <UndoToast label={undo.label} onUndo={undo.onUndo} />}
      </div>
    </AuthGate>
  );
}
