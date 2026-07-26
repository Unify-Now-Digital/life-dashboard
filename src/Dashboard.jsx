import React, { useState, useEffect, useRef } from "react";
import { C, ACCENT, styles, QUOTES } from "./lib/tokens";
import { defaultState } from "./lib/defaultState";
import { loadFromCache, loadFromCloud, saveState, flushQueue, rollDaily } from "./lib/storage";
import { isSupabaseEnabled } from "./lib/supabase";
import { isSpanishHost, mainHref } from "./lib/host.js";
import { getTheme, setTheme as persistTheme } from "./lib/theme.js";
import { addDays, metaFromDue } from "./lib/taskDates.js";
import { loadWisdom } from "./lib/wisdom.js";
import { streamChat } from "./lib/chatStream.js";
import { buildAssistantContext } from "./lib/assistantContext.js";
import { isoDate } from "./lib/habits.js";

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

  // ---- Assistant ------------------------------------------------------------
  const MAX_ASSISTANT_MESSAGES = 40;
  const MAX_TOOL_ROUNDS = 4;
  const undoTimerRef = useRef(null);

  const appendAssistantMessage = (msg) =>
    setState((s) => {
      const messages = [...(s.assistant?.messages || []), msg].slice(-MAX_ASSISTANT_MESSAGES);
      return { ...s, assistant: { ...(s.assistant || {}), messages } };
    });

  // Merges only the slices the tool executors touch into the *latest* state —
  // never overwrites wholesale, so it can't clobber a concurrently-appended
  // chat message or any other in-flight edit.
  const commitToolState = (working) =>
    setState((s) => ({ ...s, tasks: working.tasks, habitLog: working.habitLog, habitNoLog: working.habitNoLog }));

  const showUndo = (label, onUndo) => {
    clearTimeout(undoTimerRef.current);
    setUndo({ label, onUndo: () => { setUndo(null); onUndo(); } });
    undoTimerRef.current = setTimeout(() => setUndo(null), 6000);
  };

  // Pure: (workingState, call) -> { state, toolResult, undo? }. Never touches
  // React state directly, so several calls in one turn can chain against a
  // local working copy before a single commit.
  const applyToolCall = (working, call) => {
    const { name, input } = call;

    if (name === "set_task_done") {
      const { task_id, done } = input || {};
      const task = (working.tasks || []).find((t) => t.id === task_id);
      if (!task) return { state: working, toolResult: { ok: false, message: `No task with id "${task_id}" found.` } };
      const prevStatus = task.status;
      const nextState = {
        ...working,
        tasks: working.tasks.map((t) => (t.id === task_id ? { ...t, status: done ? "done" : "open" } : t)),
      };
      return {
        state: nextState,
        toolResult: { ok: true, message: `${done ? "Marked" : "Reopened"} "${task.text}" ${done ? "done" : "open"}.` },
        undo: {
          label: `${done ? "Marked" : "Reopened"} "${task.text}"`,
          onUndo: () => updateTask(task_id, { status: prevStatus }),
        },
      };
    }

    if (name === "add_task") {
      const { text, column, priority, due } = input || {};
      if (!text || (column !== "work" && column !== "personal")) {
        return { state: working, toolResult: { ok: false, message: 'add_task needs "text" and "column" (work or personal).' } };
      }
      const id = "tsk_" + Date.now() + "_" + call.id.slice(-8);
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
        notes: "",
      };
      const nextState = { ...working, tasks: [...(working.tasks || []), task] };
      return {
        state: nextState,
        toolResult: { ok: true, message: `Added "${text}" to ${column}.` },
        undo: { label: `Added "${text}"`, onUndo: () => deleteTask(id) },
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
      };
    }

    return { state: working, toolResult: { ok: false, message: `Unknown tool "${name}".` } };
  };

  // Reply text streams into a ref (not persisted state) so tokens don't
  // trigger the debounced cloud save; only the finished reply is committed.
  const finalizeAssistantLoop = (appliedActions) => {
    setAssistantStreaming(false);
    assistantAbortRef.current = null;
    pendingResolveRef.current = null;
    const streamed = assistantBufferRef.current.trim();
    assistantBufferRef.current = "";
    setAssistantStreamText("");
    // A real mutation must never end the turn with zero visible trace — if
    // the model never narrated (round cap, or a tool-only final round), fall
    // back to a plain summary of what was applied.
    const finalText = streamed || appliedActions.join(" ");
    if (finalText) {
      appendAssistantMessage({ id: "msg_" + Date.now(), role: "assistant", text: finalText, createdAt: new Date().toISOString() });
    }
  };

  const pendingResolveRef = useRef(null);
  const stopRequestedRef = useRef(false);

  const runAssistantLoop = async (initialMessages, contextSnapshot, startState) => {
    let working = startState;
    let messages = initialMessages;
    const appliedActions = [];

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

      // Anthropic requires the full assistant turn (text + every tool_use
      // block) echoed back, followed by one user turn with every matching
      // tool_result — never split across messages.
      const assistantBlocks = [];
      const streamedText = assistantBufferRef.current.trim();
      if (streamedText) assistantBlocks.push({ type: "text", text: streamedText });
      assistantBufferRef.current = "";
      setAssistantStreamText("");

      const toolResultBlocks = [];
      for (const call of toolCalls) {
        assistantBlocks.push({ type: "tool_use", id: call.id, name: call.name, input: call.input || {} });
        if (call.error) {
          toolResultBlocks.push({ type: "tool_result", tool_use_id: call.id, content: call.error, is_error: true });
          continue;
        }
        const { state: nextWorking, toolResult, undo } = applyToolCall(working, call);
        working = nextWorking;
        if (toolResult.ok) {
          appliedActions.push(toolResult.message);
          if (undo) showUndo(undo.label, undo.onUndo);
        }
        toolResultBlocks.push({
          type: "tool_result",
          tool_use_id: call.id,
          content: toolResult.message,
          ...(toolResult.ok ? {} : { is_error: true }),
        });
      }

      commitToolState(working);
      messages = [...messages, { role: "assistant", content: assistantBlocks }, { role: "user", content: toolResultBlocks }];
    }

    finalizeAssistantLoop(appliedActions);
  };

  const sendAssistantMessage = (text) => {
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

    runAssistantLoop(history, contextSnapshot, state);
  };

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

        <SpanishButton practice={state.projects?.learning?.spanish?.practice} />

        <AssistantButton onClick={() => setAssistantOpen(true)} isCompact={isCompact} />
        <AssistantPanel
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          messages={state.assistant?.messages || []}
          streamingText={assistantStreamText}
          isStreaming={assistantStreaming}
          error={assistantError}
          onSend={sendAssistantMessage}
          onStop={stopAssistant}
          isCompact={isCompact}
        />

        {undo && <UndoToast label={undo.label} onUndo={undo.onUndo} />}
      </AuthGate>
    </LocalLock>
  );
}
