import React, { useState, useEffect, useRef } from "react";
import { C, ACCENT, styles, QUOTES, tint } from "./lib/tokens";
import { defaultState } from "./lib/defaultState";
import { loadFromCache, loadFromCloud, saveState, flushQueue, rollDaily, landOnFocus } from "./lib/storage";
import { isSupabaseEnabled } from "./lib/supabase";
import { isSpanishHost, mainHref } from "./lib/host.js";
import { getTheme, setTheme as persistTheme } from "./lib/theme.js";
import { addDays, metaFromDue } from "./lib/taskDates.js";
import { loadWisdom } from "./lib/wisdom.js";
import { streamChat } from "./lib/chatStream.js";
import { buildAssistantContext } from "./lib/assistantContext.js";
import { isoDate } from "./lib/habits.js";
import { financeStats } from "./lib/financeStats.js";
import { FINANCE_SEED } from "./lib/financeSeed.js";
import { categorise, CATEGORY_LABELS } from "./lib/categorise.js";
import { prettyMerchant } from "./lib/merchants.js";
import { buildWeeklyReviewData, isReviewReady } from "./lib/weeklyReview.js";
import { ASSISTANT_CAPABILITIES, ASSISTANT_CHANGELOG, ASSISTANT_LIMITATIONS } from "./lib/assistantInfo.js";

import Header from "./components/Header.jsx";
import AuthGate from "./components/AuthGate.jsx";
import LocalLock from "./components/LocalLock.jsx";
import SpanishButton from "./components/SpanishButton.jsx";
import AssistantButton from "./components/v2/AssistantButton.jsx";
import AssistantPanel from "./components/v2/AssistantPanel.jsx";
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
import DailyFocusView from "./components/v2/DailyFocusView.jsx";

const LEARNING_META = { key: "learning", label: "Learning", color: "#854F0B" };

function useViewport() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [height, setHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 900);
  useEffect(() => {
    const onResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  // isCompact also gates the floating buttons' footprint (icon-only vs. full
  // card) — width alone missed a real case: a phone rotated to landscape
  // (e.g. 844×390) is plenty wide but has little height, so the full-size
  // Spanish button had nowhere to go but on top of content. A short viewport
  // counts as compact regardless of width.
  return { width, isDesktop: width >= 760, isCompact: width < 560 || height < 500 };
}

export default function Dashboard() {
  const [state, setStateRaw] = useState(() => landOnFocus(rollDaily(loadFromCache() || defaultState)));
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
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantStreaming, setAssistantStreaming] = useState(false);
  const [assistantStreamText, setAssistantStreamText] = useState("");
  const [assistantError, setAssistantError] = useState(null);
  const assistantAbortRef = useRef(null);
  const assistantBufferRef = useRef("");
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
        const rolled = landOnFocus(rollDaily(cloud));
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
  // What Arin is holding himself to on a habit — surfaced verbatim in the
  // daily focus hero sentence (dailyNudge.js). Editable inline from there.
  const updateHabitCommitment = (key, commitment) =>
    setState((s) => ({ ...s, habits: (s.habits || []).map((h) => (h.key === key ? { ...h, commitment } : h)) }));
  // Mirrors a task's priority flag — see dailyFocus.js: a starred habit skips
  // the never-logged severity cap and gets a flat bonus, so it competes for
  // the top-3 slot on its own terms instead of only via a poor run-rate.
  const toggleHabitPriority = (key) =>
    setState((s) => ({ ...s, habits: (s.habits || []).map((h) => (h.key === key ? { ...h, priority: !h.priority } : h)) }));

  // ---- Tasks --------------------------------------------------------------
  const tasks = state.tasks || [];
  // 'focus' (the default landing screen) | 'tasks' | 'finance' | 'habits'.
  const view = state.ui?.view || "focus";
  const setView = (v) => setState((s) => ({ ...s, ui: { ...(s.ui || {}), view: v } }));
  // Task layout (sort + grouping) — persisted so it sticks across loads/devices.
  const sortBy = state.ui?.sortBy || "due";
  const setSortBy = (v) => setState((s) => ({ ...s, ui: { ...(s.ui || {}), sortBy: v } }));
  const groupMode = state.ui?.groupMode || "label";
  const setGroupMode = (v) => setState((s) => ({ ...s, ui: { ...(s.ui || {}), groupMode: v } }));

  // Whenever a patch flips `status`, stamp/clear `completedAt` alongside it —
  // the weekly review's task summary depends on knowing *when* a task was
  // actually completed, not just its current state.
  const withCompletedAt = (task, patch) =>
    "status" in patch ? { ...patch, completedAt: patch.status === "done" ? new Date().toISOString() : null } : patch;
  const updateTask = (id, patch) =>
    setState((s) => ({ ...s, tasks: (s.tasks || []).map((t) => (t.id === id ? { ...t, ...withCompletedAt(t, patch) } : t)) }));
  const deleteTask = (id) => setState((s) => ({ ...s, tasks: (s.tasks || []).filter((t) => t.id !== id) }));
  // UI-triggered deletes (TasksView row swipe/quick-action, TaskFocus trash
  // icon) get an undo toast, same as every AI-assistant mutation — deleting
  // a task shouldn't be the one action in the app with zero recovery path.
  // `deleteTask` itself stays undo-free since it's also used as the *target*
  // of another undo (add_task's own undo handler) — wrapping it there would
  // stack a second toast on top of the first.
  const deleteTaskWithUndo = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    deleteTask(id);
    showUndo(`Deleted "${task.text}"`, () => setState((s) => ({ ...s, tasks: [...(s.tasks || []), task] })));
  };
  const toggleDone = (id) =>
    setState((s) => ({
      ...s,
      tasks: (s.tasks || []).map((t) => {
        if (t.id !== id) return t;
        const status = t.status === "done" ? "open" : "done";
        return { ...t, status, completedAt: status === "done" ? new Date().toISOString() : null };
      }),
    }));
  const reorderGroups = (column, mode, keys) =>
    setState((s) => ({ ...s, ui: { ...(s.ui || {}), groupOrder: { ...(s.ui?.groupOrder || {}), [`${mode}:${column}`]: keys } } }));
  const addTask = (column, text, extra = {}) =>
    setState((s) => ({
      ...s,
      tasks: [
        ...(s.tasks || []),
        {
          id: extra.id || "tsk_" + Date.now(),
          text,
          column,
          pill: column === "personal" ? "Admin" : "CM",
          priority: !!extra.priority,
          isDecision: false,
          importance: 1,
          due: extra.due ?? null,
          meta: null,
          status: "open",
          createdAt: new Date().toISOString(),
          completedAt: null,
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
          completedAt: null,
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

  // ---- Assistant ------------------------------------------------------------
  const MAX_ASSISTANT_MESSAGES = 40;
  const MAX_TOOL_ROUNDS = 4;
  const undoTimerRef = useRef(null);

  const appendAssistantMessage = (msg) =>
    setState((s) => {
      const messages = [...(s.assistant?.messages || []), msg].slice(-MAX_ASSISTANT_MESSAGES);
      return { ...s, assistant: { ...(s.assistant || {}), messages } };
    });
  const forgetMemory = (id) =>
    setState((s) => ({ ...s, assistant: { ...(s.assistant || {}), memory: (s.assistant?.memory || []).filter((m) => m.id !== id) } }));

  // Applies one round's worth of tool-call patches against the *latest*
  // state by id/key — same pattern as updateTask/addTask/confirmHabit —
  // never by replacing the tasks/habitLog/habitNoLog slices wholesale.
  // That distinction matters here specifically: a wholesale replace would
  // silently discard any edit Arin made by hand in the UI while a
  // multi-round tool loop was still in flight.
  const MEMORY_CAP = 30;

  const commitPatches = (patches) =>
    setState((s) => {
      let tasks = s.tasks || [];
      let habitLog = s.habitLog || {};
      let habitNoLog = s.habitNoLog || {};
      let assistant = s.assistant || {};
      const statusById = new Map();
      const added = [];
      const memoryAdds = [];
      let reviewWeekConsumed = null;
      for (const p of patches) {
        if (p.type === "task_status") statusById.set(p.taskId, p.status);
        else if (p.type === "task_add") added.push(p.task);
        else if (p.type === "habit_log") {
          const yes = (habitLog[p.key] || []).filter((d) => d !== p.dateISO);
          const no = (habitNoLog[p.key] || []).filter((d) => d !== p.dateISO);
          if (p.answer === "yes") yes.push(p.dateISO);
          if (p.answer === "no") no.push(p.dateISO);
          habitLog = { ...habitLog, [p.key]: yes };
          habitNoLog = { ...habitNoLog, [p.key]: no };
        } else if (p.type === "memory_add") memoryAdds.push(p.entry);
        else if (p.type === "review_consumed") reviewWeekConsumed = p.week;
      }
      // Append added tasks *before* applying status patches — a same-turn
      // "add X, then mark X done" produces a task_add patch and a
      // task_status patch for the same (not-yet-existing) id in one batch;
      // applying status first would map over a task list that doesn't
      // contain X yet and silently drop the status flip.
      if (added.length) tasks = [...tasks, ...added];
      if (statusById.size) {
        tasks = tasks.map((t) => {
          if (!statusById.has(t.id)) return t;
          const status = statusById.get(t.id);
          return { ...t, status, completedAt: status === "done" ? new Date().toISOString() : null };
        });
      }
      if (memoryAdds.length) {
        const memory = [...(assistant.memory || []), ...memoryAdds].slice(-MEMORY_CAP);
        assistant = { ...assistant, memory };
      }
      if (reviewWeekConsumed) assistant = { ...assistant, lastReviewWeek: reviewWeekConsumed };
      return { ...s, tasks, habitLog, habitNoLog, assistant };
    });

  const showUndo = (label, onUndo) => {
    clearTimeout(undoTimerRef.current);
    setUndo({ label, onUndo: () => { setUndo(null); onUndo(); } });
    undoTimerRef.current = setTimeout(() => setUndo(null), 6000);
  };

  // Pure: (workingState, call) -> { state, toolResult, undo?, patch? }.
  // Never touches React state directly. `state` (the working copy) exists
  // only so several calls *within one turn* can see each other's writes —
  // e.g. add_task then reference the task it just created. The actual
  // commit to React state happens separately via `patch`, applied against
  // the *latest* state by id/key (see commitPatches) — never by replacing
  // working.tasks/habitLog/habitNoLog wholesale, which would silently
  // clobber an unrelated edit Arin made in the UI while the loop was
  // in flight.
  const applyToolCall = (working, call) => {
    const { name, input } = call;

    if (name === "set_task_done") {
      const { task_id, done } = input || {};
      const task = (working.tasks || []).find((t) => t.id === task_id);
      if (!task) return { state: working, toolResult: { ok: false, message: `No task with id "${task_id}" found.` } };
      const prevStatus = task.status;
      const status = done ? "done" : "open";
      const completedAt = status === "done" ? new Date().toISOString() : null;
      const nextState = {
        ...working,
        tasks: working.tasks.map((t) => (t.id === task_id ? { ...t, status, completedAt } : t)),
      };
      return {
        state: nextState,
        toolResult: { ok: true, message: `${done ? "Marked" : "Reopened"} "${task.text}" ${done ? "done" : "open"}.` },
        undo: {
          label: `${done ? "Marked" : "Reopened"} "${task.text}"`,
          onUndo: () => updateTask(task_id, { status: prevStatus }),
        },
        patch: { type: "task_status", taskId: task_id, status },
      };
    }

    if (name === "add_task") {
      const { text, column, priority, due } = input || {};
      if (!text || (column !== "work" && column !== "personal")) {
        return { state: working, toolResult: { ok: false, message: 'add_task needs "text" and "column" (work or personal).' } };
      }
      // call.id (the Anthropic tool_use id) is already globally unique —
      // no need to also mix in Date.now().
      const id = "tsk_" + call.id;
      const task = {
        id,
        text,
        column,
        pill: column === "personal" ? "Admin" : "CM",
        priority: !!priority,
        isDecision: false,
        importance: 1,
        due: due ?? null,
        meta: null,
        status: "open",
        createdAt: new Date().toISOString(),
        completedAt: null,
        notes: "",
      };
      const nextState = { ...working, tasks: [...(working.tasks || []), task] };
      return {
        state: nextState,
        // Echo the id back so a later tool call *this same turn* (e.g.
        // "add X, then mark X done") can reference it.
        toolResult: { ok: true, message: `Added "${text}" to ${column} (id: ${id}).` },
        undo: { label: `Added "${text}"`, onUndo: () => deleteTask(id) },
        patch: { type: "task_add", task },
      };
    }

    if (name === "log_habit") {
      const { habit_key, answer, date } = input || {};
      const habit = (working.habits || []).find((h) => h.key === habit_key);
      if (!habit) return { state: working, toolResult: { ok: false, message: `No habit with key "${habit_key}" found.` } };
      if (answer !== "yes" && answer !== "no") {
        return { state: working, toolResult: { ok: false, message: 'log_habit answer must be "yes" or "no".' } };
      }
      const dateISO = date || isoDate(new Date());
      const habitLog = working.habitLog || {};
      const habitNoLog = working.habitNoLog || {};
      const prevAnswer = (habitLog[habit_key] || []).includes(dateISO)
        ? "yes"
        : (habitNoLog[habit_key] || []).includes(dateISO)
          ? "no"
          : null;
      const yes = (habitLog[habit_key] || []).filter((d) => d !== dateISO);
      const no = (habitNoLog[habit_key] || []).filter((d) => d !== dateISO);
      if (answer === "yes") yes.push(dateISO);
      if (answer === "no") no.push(dateISO);
      const nextState = {
        ...working,
        habitLog: { ...habitLog, [habit_key]: yes },
        habitNoLog: { ...habitNoLog, [habit_key]: no },
      };
      return {
        state: nextState,
        toolResult: { ok: true, message: `Logged ${habit.label} as ${answer} for ${dateISO}.` },
        undo: {
          label: `Logged ${habit.label} as ${answer}`,
          // confirmHabit clears both logs for any answer outside yes/no —
          // exactly "reset to unlogged".
          onUndo: () => confirmHabit(habit_key, dateISO, prevAnswer || "clear"),
        },
        patch: { type: "habit_log", key: habit_key, dateISO, answer },
      };
    }

    // ---- Read-only data tools (no mutation, no undo) ---------------------
    // Each returns JSON as the tool_result content — cheap for the model to
    // parse, and the system prompt tells it never to paste raw JSON back to
    // Arin. Every result is capped so a single call can't dump the whole
    // dataset even in a worst-case prompt-injection scenario.

    if (name === "get_finance_breakdown") {
      const { start, end, category } = input || {};
      const finance = working.finance || {};
      const txns = finance.transactions || [];
      const seeded = txns.length === 0;
      const summary = seeded
        ? FINANCE_SEED
        : financeStats(
            txns.filter((t) => (!start || t.date >= start) && (!end || t.date <= end)),
            { start: start || finance.range?.start, end: end || finance.range?.end },
            finance.overrides
          );
      let categories = summary.categories || [];
      if (category) categories = categories.filter((c) => c.key === category);
      const payload = {
        seeded,
        range: summary.range,
        stats: summary.stats,
        categories: categories.slice(0, 10).map((c) => ({
          key: c.key,
          label: c.label,
          total: c.total,
          perMonth: c.perMonth,
          count: c.count,
          topMerchants: (c.merchants || []).slice(0, 3).map((m) => ({ name: m.name, total: m.total, count: m.count })),
        })),
      };
      return { state: working, toolResult: { ok: true, message: JSON.stringify(payload) } };
    }

    if (name === "search_transactions") {
      const { query, start, end, limit } = input || {};
      const txns = working.finance?.transactions || [];
      if (!txns.length) {
        return {
          state: working,
          toolResult: {
            ok: true,
            message: JSON.stringify({ note: "No CSV imported yet — only aggregate seeded data is available via get_finance_breakdown.", results: [] }),
          },
        };
      }
      const q = (query || "").toLowerCase();
      const cap = Math.min(Math.max(1, limit || 20), 20);
      const overrides = working.finance?.overrides;
      const results = txns
        .filter((t) => t.direction === "out")
        .filter((t) => !q || (t.desc || "").toLowerCase().includes(q))
        .filter((t) => (!start || t.date >= start) && (!end || t.date <= end))
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, cap)
        .map((t) => {
          const cat = categorise(t, overrides).category;
          return { date: t.date, merchant: prettyMerchant(t.desc), amount: Math.abs(t.amount), category: CATEGORY_LABELS[cat] || cat };
        });
      return { state: working, toolResult: { ok: true, message: JSON.stringify({ count: results.length, results }) } };
    }

    if (name === "get_habit_history") {
      const { habit_key, days } = input || {};
      const habit = (working.habits || []).find((h) => h.key === habit_key);
      if (!habit) return { state: working, toolResult: { ok: false, message: `No habit with key "${habit_key}" found.` } };
      const n = Math.min(Math.max(1, days || 28), 90);
      const yes = new Set(working.habitLog?.[habit_key] || []);
      const no = new Set(working.habitNoLog?.[habit_key] || []);
      const today = new Date();
      const log = [];
      let hits = 0;
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const iso = isoDate(d);
        const status = yes.has(iso) ? "yes" : no.has(iso) ? "no" : "unanswered";
        if (status === "yes") hits++;
        log.push({ date: iso, status });
      }
      const weeklyTarget = habit.weeklyTarget ?? Math.round(((habit.target ?? 7) / (habit.period ?? 7)) * 7);
      const payload = { habit: habit.label, days: n, hits, weeklyTarget, log };
      return { state: working, toolResult: { ok: true, message: JSON.stringify(payload) } };
    }

    if (name === "list_tasks") {
      const { column, status, pill, limit } = input || {};
      const cap = Math.min(Math.max(1, limit || 30), 50);
      const tasks = (working.tasks || [])
        .filter((t) => !column || t.column === column)
        .filter((t) => !status || t.status === status)
        .filter((t) => !pill || t.pill === pill)
        .slice(0, cap)
        .map((t) => ({ id: t.id, text: t.text, column: t.column, pill: t.pill, status: t.status, due: t.due, priority: t.priority, isDecision: t.isDecision }));
      return { state: working, toolResult: { ok: true, message: JSON.stringify({ count: tasks.length, tasks }) } };
    }

    if (name === "remember") {
      const { text } = input || {};
      if (!text || !text.trim()) {
        return { state: working, toolResult: { ok: false, message: "remember needs non-empty text." } };
      }
      const entry = { id: "mem_" + call.id, text: text.trim(), createdAt: new Date().toISOString() };
      const nextState = { ...working, assistant: { ...working.assistant, memory: [...(working.assistant?.memory || []), entry] } };
      return {
        state: nextState,
        toolResult: { ok: true, message: `Remembered: "${entry.text}"` },
        undo: { label: `Remembered "${entry.text}"`, onUndo: () => forgetMemory(entry.id) },
        patch: { type: "memory_add", entry },
      };
    }

    if (name === "get_weekly_review_data") {
      const data = buildWeeklyReviewData(working);
      // No undo — reading the review isn't a reversible action. It still
      // carries a patch (marking the week reviewed) so the badge doesn't
      // reappear for a week we've already surfaced, whether or not the
      // model goes on to narrate it well.
      return {
        state: working,
        toolResult: { ok: true, message: JSON.stringify(data) },
        patch: { type: "review_consumed", week: data.week },
      };
    }

    if (name === "get_assistant_info") {
      const { topic } = input || {};
      const payload =
        topic === "capabilities"
          ? { capabilities: ASSISTANT_CAPABILITIES }
          : topic === "changelog"
            ? { changelog: ASSISTANT_CHANGELOG }
            : topic === "limitations"
              ? { limitations: ASSISTANT_LIMITATIONS }
              : { capabilities: ASSISTANT_CAPABILITIES, changelog: ASSISTANT_CHANGELOG, limitations: ASSISTANT_LIMITATIONS };
      return { state: working, toolResult: { ok: true, message: JSON.stringify(payload) } };
    }

    return { state: working, toolResult: { ok: false, message: `Unknown tool "${name}".` } };
  };

  // Reply text streams into a ref (not persisted state) so tokens don't
  // trigger the debounced cloud save; only the finished reply is committed.
  const finalizeAssistantLoop = (appliedActions, madeAnyToolCall, pendingReviewWeek) => {
    setAssistantStreaming(false);
    assistantAbortRef.current = null;
    pendingResolveRef.current = null;
    const streamed = assistantBufferRef.current.trim();
    assistantBufferRef.current = "";
    setAssistantStreamText("");
    // A turn that actually did something must never end with zero visible
    // trace — if the model never narrated (round cap hit, or the final
    // round was tool-only), fall back to a plain summary of what was
    // applied, or — if it was reads only — a generic acknowledgement so
    // Arin isn't left staring at a chat that silently ate his message.
    const finalText = streamed || appliedActions.join(" ") || (madeAnyToolCall ? "Got that — let me know if you'd like more detail." : "");
    if (finalText) {
      appendAssistantMessage({ id: "msg_" + Date.now(), role: "assistant", text: finalText, createdAt: new Date().toISOString() });
    }
    // Only mark the week reviewed once the model actually narrated something
    // (`streamed`, not the generic fallback) — if it spent the whole round
    // budget on tool calls and never got to summarize, the badge should stay
    // up so Arin gets a real shot at seeing it next time, instead of the
    // review silently vanishing with only "Got that" to show for it.
    if (pendingReviewWeek && streamed) {
      commitPatches([{ type: "review_consumed", week: pendingReviewWeek }]);
    }
  };

  const pendingResolveRef = useRef(null);
  const stopRequestedRef = useRef(false);

  // Cheap, transparent routing: most messages are simple lookups/actions and
  // stay on the fast/cheap tier; anything that smells like it needs real
  // synthesis (forecasting, comparisons, "why", planning) or the weekly
  // review gets the smarter tier. A keyword heuristic, not a classifier
  // call — easy to see why a message routed where it did, no extra
  // round-trip cost to decide.
  const SMART_TIER_PATTERN = /\b(forecast|compare|why|analy[sz]e|plan|correlat|trend|budget|review)\b/i;
  const pickTier = (text) => (SMART_TIER_PATTERN.test(text) ? "smart" : "fast");

  const runAssistantLoop = async (initialMessages, contextSnapshot, startState, tier) => {
    let working = startState;
    let messages = initialMessages;
    const appliedActions = [];
    let madeAnyToolCall = false;
    let pendingReviewWeek = null; // set once get_weekly_review_data runs; committed in finalizeAssistantLoop, gated on real narration

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      if (stopRequestedRef.current) break;

      const controller = new AbortController();
      assistantAbortRef.current = controller;

      const outcome = await new Promise((resolve) => {
        pendingResolveRef.current = resolve;
        const toolCalls = [];
        streamChat({
          messages,
          context: contextSnapshot,
          tier,
          signal: controller.signal,
          onDelta: (chunk) => {
            assistantBufferRef.current += chunk;
            setAssistantStreamText(assistantBufferRef.current);
          },
          onToolCall: (call) => toolCalls.push(call),
          onDone: ({ stopReason }) => resolve({ stopReason, toolCalls }),
          onError: (err) => resolve({ error: err }),
        });
      });
      pendingResolveRef.current = null;

      if (outcome.error) {
        setAssistantError(outcome.error.message || "Something went wrong.");
        break;
      }
      if (stopRequestedRef.current) break;

      const { stopReason, toolCalls } = outcome;
      if (stopReason !== "tool_use" || !toolCalls.length) break;
      madeAnyToolCall = true;

      // Anthropic requires the full assistant turn (text + every tool_use
      // block) echoed back, followed by one user turn with every matching
      // tool_result — never split across messages.
      const assistantBlocks = [];
      const streamedText = assistantBufferRef.current.trim();
      if (streamedText) assistantBlocks.push({ type: "text", text: streamedText });
      assistantBufferRef.current = "";
      setAssistantStreamText("");

      const toolResultBlocks = [];
      const roundPatches = [];
      const roundUndos = [];
      for (const call of toolCalls) {
        assistantBlocks.push({ type: "tool_use", id: call.id, name: call.name, input: call.input || {} });
        if (call.error) {
          toolResultBlocks.push({ type: "tool_result", tool_use_id: call.id, content: call.error, is_error: true });
          continue;
        }
        const { state: nextWorking, toolResult, undo, patch } = applyToolCall(working, call);
        working = nextWorking;
        if (toolResult.ok) {
          // Patches always commit, whether or not the call has an undo.
          // review_consumed is the one exception — it's held back to
          // finalizeAssistantLoop, which only commits it once real
          // narration actually shipped (see there for why). Only
          // mutations *with* an undo (the write tools) go into the
          // fallback narration; a read tool's raw JSON isn't fit to show.
          if (patch?.type === "review_consumed") pendingReviewWeek = patch.week;
          else if (patch) roundPatches.push(patch);
          if (undo) {
            appliedActions.push(toolResult.message);
            roundUndos.push(undo);
          }
        }
        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: call.id,
          content: toolResult.message,
          ...(toolResult.ok ? {} : { is_error: true }),
        });
      }

      if (roundPatches.length) commitPatches(roundPatches);

      // One toast per round, not one per action — showing a second toast
      // immediately after the first (both synchronous, same round) would
      // silently replace it before Arin ever saw it or could undo it.
      if (roundUndos.length === 1) {
        showUndo(roundUndos[0].label, roundUndos[0].onUndo);
      } else if (roundUndos.length > 1) {
        showUndo(`Applied ${roundUndos.length} changes`, () => {
          for (let i = roundUndos.length - 1; i >= 0; i--) roundUndos[i].onUndo();
        });
      }

      messages = [...messages, { role: "assistant", content: assistantBlocks }, { role: "user", content: toolResultBlocks }];
    }

    finalizeAssistantLoop(appliedActions, madeAnyToolCall, pendingReviewWeek);
  };

  const sendAssistantMessage = (text, { tier } = {}) => {
    const userMsg = { id: "msg_" + Date.now(), role: "user", text, createdAt: new Date().toISOString() };
    const history = [...(state.assistant?.messages || []), userMsg]
      .slice(-MAX_ASSISTANT_MESSAGES)
      .map((m) => ({ role: m.role, content: m.text }));
    const contextSnapshot = buildAssistantContext(state);

    appendAssistantMessage(userMsg);
    setAssistantError(null);
    setAssistantStreaming(true);
    setAssistantStreamText("");
    assistantBufferRef.current = "";
    stopRequestedRef.current = false;

    runAssistantLoop(history, contextSnapshot, state, tier || pickTier(text));
  };

  // Weekly review always gets the smarter tier — it's exactly the kind of
  // multi-source synthesis (task/habit/finance + any gated correlation)
  // pickTier's heuristic is meant to catch, forced rather than guessed.
  const sendWeeklyReview = () => sendAssistantMessage("Give me my weekly review.", { tier: "smart" });

  const stopAssistant = () => {
    stopRequestedRef.current = true;
    assistantAbortRef.current?.abort();
    const resolve = pendingResolveRef.current;
    pendingResolveRef.current = null;
    if (resolve) resolve({ stopReason: "aborted" });
  };

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
        // ACCENT.priorities is a literal hex (reads correctly in both
        // modes, unlike a hardcoded neutral bg/text pair) — tinted for the
        // background, full-strength for the border/emphasis.
        background: tint(ACCENT.priorities, 0.12),
        border: `0.5px solid ${ACCENT.priorities}`,
        color: C.text,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        marginBottom: 12,
      }}
    >
      Local only — changes are saved on this device but <strong style={{ color: ACCENT.priorities }}>not backed up</strong>. Set the Supabase env vars to sync across devices.
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <a
                  href={mainHref()}
                  title="Volver al panel"
                  style={{ fontSize: 12, color: C.textTertiary, textDecoration: "none", fontFamily: "inherit", padding: "4px 2px" }}
                >
                  ‹ Panel
                </a>
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
  // 'focus' is the hub: it renders alone, full-width, nothing else fighting
  // for attention. Every other screen gets a lightweight top bar — a back
  // link to focus plus lateral tabs, so Tasks/Finance/Habits stay one tap
  // from each other without detouring through focus every time.
  return (
    <LocalLock>
      <AuthGate>
        <div style={{ ...styles.page, paddingBottom: "calc(120px + env(safe-area-inset-bottom))" }}>
          <Header today={today} dayOfYear={dayOfYear} wisdom={wisdom} onRotate={rotateWisdom} unifyHidden={unifyHidden} onToggleUnify={toggleUnify} compact={view === "focus"} />

          {localOnlyBanner}

          <div style={{ display: "flex", alignItems: "center", justifyContent: view === "focus" ? "flex-end" : "space-between", gap: 12, rowGap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            {view !== "focus" && (
              <button
                onClick={() => setView("focus")}
                style={{ background: "none", border: "none", padding: "4px 2px", fontSize: 12.5, color: C.textSecondary, cursor: "pointer", fontFamily: "inherit" }}
              >
                {"‹ Focus"}
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {view !== "focus" && (
                <Segmented
                  options={[{ value: "tasks", label: "Tasks" }, { value: "finance", label: "Finance" }, { value: "habits", label: "Habits" }]}
                  value={view}
                  onChange={setView}
                  accent={C.accent}
                />
              )}
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>

          {view === "focus" && (
            <DailyFocusView
              state={state}
              onNavigate={setView}
              onOpenTask={(id) => setFocusId(id)}
              onLogHabit={(key, answer) => confirmHabit(key, isoDate(new Date()), answer)}
              onEditCommitment={updateHabitCommitment}
            />
          )}

          {view === "tasks" && (
            <>
              <PrioritiesBar
                priorities={priorities}
                decisionsCount={decisionsCount}
                decisionsActive={decisionsActive}
                onToggleDecisions={() => setDecisionsActive((d) => !d)}
                onOpenTask={(id) => setFocusId(id)}
                onAddPriority={addPriority}
                compact={isCompact}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
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
              </div>

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
                onDelete={deleteTaskWithUndo}
                onReorderGroups={reorderGroups}
              />
            </>
          )}

          {view === "finance" && (
            <FinanceLens finance={state.finance} onImport={importTransactions} onClear={clearTransactions} />
          )}

          {view === "habits" && (
            <HabitFooter habits={state.habits} habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} onTogglePriority={toggleHabitPriority} isDesktop={isDesktop} docked={false} />
          )}
        </div>

        <TaskFocus
          task={focusTask}
          onClose={() => setFocusId(null)}
          onUpdate={(patch) => updateTask(focusId, patch)}
          onDelete={() => deleteTaskWithUndo(focusId)}
          onDefer={(n) => deferTask(focusId, n)}
        />

        <SpanishButton practice={state.projects?.learning?.spanish?.practice} compact={isCompact} />

        <AssistantButton
          onClick={() => setAssistantOpen(true)}
          reviewReady={isReviewReady(state.assistant?.lastReviewWeek, state)}
          onReviewClick={() => {
            setAssistantOpen(true);
            sendWeeklyReview();
          }}
        />
        <AssistantPanel
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          messages={state.assistant?.messages || []}
          streamingText={assistantStreamText}
          isStreaming={assistantStreaming}
          error={assistantError}
          onSend={sendAssistantMessage}
          onStop={stopAssistant}
          onOpenTask={(taskId) => {
            // A chip from an older persisted chat message can outlive the
            // task it points to (deleted since). Fail quietly rather than
            // closing the panel for nothing.
            if (!(state.tasks || []).some((t) => t.id === taskId)) return;
            // TaskFocus's overlay (z-index 200) sits *below* the assistant
            // panel's (210) — opening it underneath would be invisible, so
            // close the panel first.
            setAssistantOpen(false);
            setFocusId(taskId);
          }}
          isCompact={isCompact}
        />

        {undo && <UndoToast label={undo.label} onUndo={undo.onUndo} />}
      </AuthGate>
    </LocalLock>
  );
}
