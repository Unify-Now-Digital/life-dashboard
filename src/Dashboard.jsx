import React, { useState, useEffect } from "react";
import { C, ACCENT, styles, QUOTES } from "./lib/tokens";
import { defaultState } from "./lib/defaultState";
import { loadFromCache, loadFromCloud, saveState, flushQueue, rollDaily } from "./lib/storage";
import { isSupabaseEnabled } from "./lib/supabase";
import { isSpanishHost } from "./lib/host.js";
import { getTheme, setTheme as persistTheme } from "./lib/theme.js";
import { addDays, metaFromDue } from "./lib/taskDates.js";
import { loadWisdom } from "./lib/wisdom.js";

import Header from "./components/Header.jsx";
import AuthGate from "./components/AuthGate.jsx";
import LocalLock from "./components/LocalLock.jsx";
import SpanishButton from "./components/SpanishButton.jsx";
import SpanishPractice from "./components/SpanishPractice.jsx";
import LearningProject from "./components/projects/LearningProject.jsx";
import UndoToast from "./components/UndoToast.jsx";
import { makeGoalHandlers } from "./components/Projects.jsx";

import Segmented from "./components/v2/Segmented.jsx";
import ThemeToggle from "./components/v2/ThemeToggle.jsx";
import PrioritiesBar from "./components/v2/PrioritiesBar.jsx";
import TasksView from "./components/v2/TasksView.jsx";
import TaskFocus from "./components/v2/TaskFocus.jsx";
import FinanceLens from "./components/v2/FinanceLens.jsx";
import HabitFooter from "./components/v2/HabitFooter.jsx";

const LEARNING_META = { key: "learning", label: "Learning", color: "#854F0B" };

function useViewport() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  return { width, isDesktop: width >= 760, isCompact: width < 560 };
}

export default function Dashboard() {
  const [state, setStateRaw] = useState(() => rollDaily(loadFromCache() || defaultState));
  const { isDesktop, isCompact } = useViewport();

  const [theme, setThemeState] = useState(getTheme);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    persistTheme(next); // localStorage cache + apply to <html> for this device
    setState((s) => ({ ...s, ui: { ...(s.ui || {}), theme: next } })); // sync cross-device
  };

  const [decisionsActive, setDecisionsActive] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const [phrases, setPhrases] = useState([]);
  const [qIndex, setQIndex] = useState(0);

  // Load rotating wisdom phrases from Supabase; seed the daily one by day-of-year.
  useEffect(() => {
    loadWisdom().then((list) => {
      setPhrases(list || []);
      const pool = (list || []).filter((p) => p.rotation !== false);
      if (pool.length) {
        const now = new Date();
        const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        setQIndex(doy % pool.length);
      }
    });
  }, []);
  const [spanishMode, setSpanishMode] = useState("calma");
  const [undo, setUndo] = useState(null);

  useEffect(() => {
    let alive = true;
    loadFromCloud().then((cloud) => {
      if (!alive) return;
      if (cloud) {
        const rolled = rollDaily(cloud);
        setStateRaw(rolled);
        if (rolled !== cloud) saveState(rolled);
      } else {
        saveState(state);
      }
    });
    flushQueue();
    const onFocus = () => flushQueue();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const setState = (updater) => {
    setStateRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  };

  // Adopt the synced theme when cloud state arrives (so the preference follows
  // the account onto a new device). Local toggles keep state.ui.theme in step,
  // so this only fires when a different device/session set it.
  useEffect(() => {
    const t = state.ui?.theme;
    if ((t === "light" || t === "dark") && t !== theme) {
      setThemeState(t);
      persistTheme(t);
    }
  }, [state.ui?.theme]);

  // ---- Habits -------------------------------------------------------------
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

  // ---- Tasks --------------------------------------------------------------
  const tasks = state.tasks || [];
  const view = state.ui?.view || "tasks";
  const setView = (v) => setState((s) => ({ ...s, ui: { ...(s.ui || {}), view: v } }));
  // Task layout (sort + grouping) — persisted so it sticks across loads/devices.
  const sortBy = state.ui?.sortBy || "due";
  const setSortBy = (v) => setState((s) => ({ ...s, ui: { ...(s.ui || {}), sortBy: v } }));
  const groupMode = state.ui?.groupMode || "label";
  const setGroupMode = (v) => setState((s) => ({ ...s, ui: { ...(s.ui || {}), groupMode: v } }));

  const updateTask = (id, patch) =>
    setState((s) => ({ ...s, tasks: (s.tasks || []).map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const deleteTask = (id) => setState((s) => ({ ...s, tasks: (s.tasks || []).filter((t) => t.id !== id) }));
  const toggleDone = (id) =>
    setState((s) => ({ ...s, tasks: (s.tasks || []).map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "open" : "done" } : t)) }));
  const reorderGroups = (column, mode, keys) =>
    setState((s) => ({ ...s, ui: { ...(s.ui || {}), groupOrder: { ...(s.ui?.groupOrder || {}), [`${mode}:${column}`]: keys } } }));
  const addTask = (column, text) =>
    setState((s) => ({
      ...s,
      tasks: [
        ...(s.tasks || []),
        {
          id: "tsk_" + Date.now(),
          text,
          column,
          pill: column === "personal" ? "Admin" : "CM",
          priority: false,
          isDecision: false,
          importance: 1,
          due: null,
          meta: null,
          status: "open",
          createdAt: new Date().toISOString(),
          notes: "",
        },
      ],
    }));
  const recategorise = (id, pill) => updateTask(id, { pill });
  // Quick-defer: push the due date by n days (from current due or today) and
  // refresh the urgency label.
  const deferTask = (id, n) =>
    setState((s) => ({
      ...s,
      tasks: (s.tasks || []).map((t) => {
        if (t.id !== id) return t;
        const due = addDays(t.due, n);
        return { ...t, due, meta: metaFromDue(due) };
      }),
    }));

  const addPriority = () => {
    const id = "tsk_" + Date.now();
    setState((s) => ({
      ...s,
      tasks: [
        ...(s.tasks || []),
        {
          id,
          text: "New priority",
          column: "work",
          pill: "CM",
          priority: true,
          isDecision: false,
          importance: 2,
          due: null,
          meta: null,
          status: "open",
          createdAt: new Date().toISOString(),
          notes: "",
        },
      ],
    }));
    setFocusId(id);
  };

  const priorities = tasks.filter((t) => t.priority && t.status !== "done");
  const decisionsCount = tasks.filter((t) => t.isDecision && t.status !== "done").length;
  const focusTask = tasks.find((t) => t.id === focusId) || null;

  // ---- Finance ------------------------------------------------------------
  const importTransactions = (txns, range) =>
    setState((s) => ({
      ...s,
      finance: { ...(s.finance || {}), transactions: txns, range, importedAt: new Date().toISOString() },
    }));
  const clearTransactions = () =>
    setState((s) => ({ ...s, finance: { ...(s.finance || {}), transactions: [], importedAt: null } }));

  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - start) / 86400000);

  // Header wisdom phrase: from Supabase when available, else the static QUOTES.
  const wisdomPool = phrases.filter((p) => p.rotation !== false);
  const wisdom = wisdomPool.length
    ? { text: wisdomPool[qIndex % wisdomPool.length].text, category: wisdomPool[qIndex % wisdomPool.length].category }
    : { text: QUOTES[dayOfYear % QUOTES.length].replace(/^["“]|["”]$/g, ""), category: null };
  const rotateWisdom = () => {
    if (wisdomPool.length) setQIndex((i) => (i + 1) % wisdomPool.length);
  };
  const unifyHidden = !!state.ui?.unifyTrendHidden;
  const toggleUnify = () => setState((s) => ({ ...s, ui: { ...(s.ui || {}), unifyTrendHidden: !s.ui?.unifyTrendHidden } }));

  const localOnlyBanner = !isSupabaseEnabled() ? (
    <div
      style={{
        background: "#FDF6E3",
        border: "0.5px solid #E6D9A8",
        color: "#7A5C00",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        marginBottom: 12,
      }}
    >
      Local only — changes are saved on this device but <strong>not backed up</strong>. Set the Supabase env vars to sync across devices.
    </div>
  ) : null;

  // ---- Spanish subdomain (unchanged) -------------------------------------
  if (isSpanishHost()) {
    return (
      <LocalLock>
        <AuthGate>
          {spanishMode === "calma" ? (
            <SpanishPractice state={state} setState={setState} onMore={() => setSpanishMode("more")} localOnlyBanner={localOnlyBanner} />
          ) : (
            <div style={styles.page}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <button
                  onClick={() => setSpanishMode("calma")}
                  style={{ background: "transparent", border: `0.5px solid ${C.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, color: C.accent, cursor: "pointer", fontFamily: "inherit" }}
                >
                  ‹ Práctica
                </button>
              </div>
              {localOnlyBanner}
              <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
                <LearningProject state={state} setState={setState} meta={LEARNING_META} goalHandlers={makeGoalHandlers(setState, ["projects", "learning", "goals"])} />
              </div>
              {undo && <UndoToast label={undo.label} onUndo={undo.onUndo} />}
            </div>
          )}
        </AuthGate>
      </LocalLock>
    );
  }

  // ---- Main V2 shell ------------------------------------------------------
  return (
    <LocalLock>
      <AuthGate>
        <div style={{ ...styles.page, paddingBottom: isDesktop ? 190 : 270 }}>
          <Header today={today} dayOfYear={dayOfYear} wisdom={wisdom} onRotate={rotateWisdom} unifyHidden={unifyHidden} onToggleUnify={toggleUnify} />

          {localOnlyBanner}

          <PrioritiesBar
            priorities={priorities}
            decisionsCount={decisionsCount}
            decisionsActive={decisionsActive}
            onToggleDecisions={() => setDecisionsActive((d) => !d)}
            onOpenTask={(id) => setFocusId(id)}
            onAddPriority={addPriority}
            compact={isCompact}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, rowGap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            {/* Left: task sort / group controls (Tasks view only) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minHeight: 30 }}>
              {view === "tasks" && (
                <>
                  <Segmented
                    options={[{ value: "importance", label: "Priority" }, { value: "due", label: "Due" }, { value: "added", label: "Added" }]}
                    value={sortBy}
                    onChange={setSortBy}
                    accent={C.accent}
                    size="sm"
                  />
                  <Segmented
                    options={[{ value: "none", label: "Flat" }, { value: "due", label: "Due" }, { value: "label", label: "Category" }]}
                    value={groupMode}
                    onChange={setGroupMode}
                    accent={C.accent}
                    size="sm"
                  />
                </>
              )}
            </div>
            {/* Right: view tabs + theme */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Segmented
                options={[{ value: "tasks", label: "Tasks" }, { value: "finance", label: "Finance" }]}
                value={view}
                onChange={setView}
                accent={C.accent}
              />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>

          {view === "tasks" ? (
            <TasksView
              tasks={tasks}
              decisionsActive={decisionsActive}
              isDesktop={isDesktop}
              sortBy={sortBy}
              groupMode={groupMode}
              groupOrder={state.ui?.groupOrder || {}}
              onOpen={(id) => setFocusId(id)}
              onRecategorise={recategorise}
              onAdd={addTask}
              onDefer={deferTask}
              onToggleDone={toggleDone}
              onDelete={deleteTask}
              onReorderGroups={reorderGroups}
            />
          ) : (
            <FinanceLens finance={state.finance} onImport={importTransactions} onClear={clearTransactions} />
          )}
        </div>

        <HabitFooter habits={state.habits} habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} isDesktop={isDesktop} />

        <TaskFocus
          task={focusTask}
          onClose={() => setFocusId(null)}
          onUpdate={(patch) => updateTask(focusId, patch)}
          onDelete={() => deleteTask(focusId)}
          onDefer={(n) => deferTask(focusId, n)}
        />

        <SpanishButton />
      </AuthGate>
    </LocalLock>
  );
}
