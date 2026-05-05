import React, { useState, useEffect, useRef } from "react";
import { styles, QUOTES, C, BIZ_COLORS, AVATAR_KEYS } from "./lib/tokens";
import { defaultState, nextId } from "./lib/defaultState";

import Header from "./components/Header.jsx";
import Spanish from "./components/Spanish.jsx";
import NorthStar from "./components/NorthStar.jsx";
import Habits from "./components/Habits.jsx";
import Priorities from "./components/Priorities.jsx";
import StickyHabits from "./components/StickyHabits.jsx";
import Goals from "./components/Goals.jsx";
import Upcoming from "./components/Upcoming.jsx";
import Trends from "./components/Trends.jsx";
import Metrics from "./components/Metrics.jsx";
import Drilldowns from "./components/Drilldowns.jsx";
import Reflection from "./components/Reflection.jsx";
import UndoToast from "./components/UndoToast.jsx";

// Track viewport so we can switch to two-column layout above ~860px wide
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
  const [state, setState] = useState(defaultState);
  const isDesktop = useIsDesktop();

  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - start) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  const [undo, setUndo] = useState(null);
  const undoTimerRef = useRef(null);
  useEffect(
    () => () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    },
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

  // Update an item by id within a nested list path
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

  const togglePriority = (i) =>
    setState((s) => {
      const next = [...s.priorities];
      next[i] = { ...next[i], done: !next[i].done };
      return { ...s, priorities: next };
    });

  const changePriority = (i, text) =>
    setState((s) => {
      const next = [...s.priorities];
      next[i] = { ...next[i], text };
      return { ...s, priorities: next };
    });

  // Habit confirmation: answer is "yes" | "no" | "clear"
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

  const setJournal = (text) => setState((s) => ({ ...s, journal: text }));
  const setNorthStar = (text) => setState((s) => ({ ...s, northStar: text }));

  const goalHandlers = {
    onUpdate: (id, field, value) => updateItemInList(["goals"], id, field, value),
    onAdd: () =>
      setState((s) => ({
        ...s,
        goals: [
          ...s.goals,
          {
            id: `g${nextId(s.goals.map((g) => ({ id: typeof g.id === "string" ? parseInt(g.id.replace(/\D/g, "")) || 0 : g.id })))}`,
            label: "New goal",
            current: 0,
            target: 100,
          },
        ],
      })),
    onRemove: removeWithUndo(
      (s) => s.goals,
      (s, g) => ({ ...s, goals: g }),
      "Goal removed"
    ),
  };

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

  const drilldownHandlers = {
    businesses: {
      onUpdate: (id, field, value) => updateItemInList(["drilldowns", "businesses"], id, field, value),
      onAdd: () =>
        setState((s) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            businesses: [
              ...s.drilldowns.businesses,
              {
                id: nextId(s.drilldowns.businesses),
                name: "New",
                color: BIZ_COLORS[s.drilldowns.businesses.length % BIZ_COLORS.length],
                value: "—",
                meta: "—",
              },
            ],
          },
        })),
      onRemove: removeWithUndo(
        (s) => s.drilldowns.businesses,
        (s, b) => ({ ...s, drilldowns: { ...s.drilldowns, businesses: b } }),
        "Business removed"
      ),
    },
    finances: {
      onUpdate: (key, value) =>
        setState((s) => ({
          ...s,
          drilldowns: { ...s.drilldowns, finances: { ...s.drilldowns.finances, [key]: value } },
        })),
      onUpdateIncome: (id, field, value) =>
        updateItemInList(["drilldowns", "finances", "incomeBreakdown"], id, field, value),
      onAddIncome: () =>
        setState((s) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            finances: {
              ...s.drilldowns.finances,
              incomeBreakdown: [
                ...(s.drilldowns.finances.incomeBreakdown || []),
                {
                  id: nextId(s.drilldowns.finances.incomeBreakdown || []),
                  label: "New income",
                  amount: 0,
                },
              ],
            },
          },
        })),
      onRemoveIncome: removeWithUndo(
        (s) => s.drilldowns.finances.incomeBreakdown || [],
        (s, list) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            finances: { ...s.drilldowns.finances, incomeBreakdown: list },
          },
        }),
        "Income row removed"
      ),
      onUpdateExpense: (id, field, value) =>
        updateItemInList(["drilldowns", "finances", "expenseBreakdown"], id, field, value),
      onAddExpense: () =>
        setState((s) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            finances: {
              ...s.drilldowns.finances,
              expenseBreakdown: [
                ...(s.drilldowns.finances.expenseBreakdown || []),
                {
                  id: nextId(s.drilldowns.finances.expenseBreakdown || []),
                  label: "New expense",
                  amount: 0,
                },
              ],
            },
          },
        })),
      onRemoveExpense: removeWithUndo(
        (s) => s.drilldowns.finances.expenseBreakdown || [],
        (s, list) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            finances: { ...s.drilldowns.finances, expenseBreakdown: list },
          },
        }),
        "Expense row removed"
      ),
    },
    travel: {
      onUpdateStat: (key, value) =>
        setState((s) => ({
          ...s,
          drilldowns: { ...s.drilldowns, travel: { ...s.drilldowns.travel, [key]: value } },
        })),
      onUpdateTrip: (id, field, value) => updateItemInList(["drilldowns", "travel", "trips"], id, field, value),
      onAddTrip: () =>
        setState((s) => {
          const start = new Date();
          start.setDate(start.getDate() + 30);
          const end = new Date(start);
          end.setDate(end.getDate() + 7);
          const iso = (d) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return {
            ...s,
            drilldowns: {
              ...s.drilldowns,
              travel: {
                ...s.drilldowns.travel,
                trips: [
                  ...s.drilldowns.travel.trips,
                  {
                    id: nextId(s.drilldowns.travel.trips),
                    name: "New trip",
                    start: iso(start),
                    end: iso(end),
                  },
                ],
              },
            },
          };
        }),
      onRemoveTrip: removeWithUndo(
        (s) => s.drilldowns.travel.trips,
        (s, t) => ({
          ...s,
          drilldowns: { ...s.drilldowns, travel: { ...s.drilldowns.travel, trips: t } },
        }),
        "Trip removed"
      ),
    },
    relationships: {
      onUpdate: (id, field, value) => updateItemInList(["drilldowns", "relationships"], id, field, value),
      onAdd: () =>
        setState((s) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            relationships: [
              ...s.drilldowns.relationships,
              {
                id: nextId(s.drilldowns.relationships),
                name: "New person",
                initials: "NP",
                color: AVATAR_KEYS[s.drilldowns.relationships.length % AVATAR_KEYS.length],
                last: "—",
                action: "tap to set",
                stale: false,
              },
            ],
          },
        })),
      onRemove: removeWithUndo(
        (s) => s.drilldowns.relationships,
        (s, r) => ({ ...s, drilldowns: { ...s.drilldowns, relationships: r } }),
        "Person removed"
      ),
    },
    reading: {
      onUpdate: (id, field, value) => updateItemInList(["drilldowns", "reading"], id, field, value),
      onAdd: (kind) =>
        setState((s) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            reading: [
              ...s.drilldowns.reading,
              kind === "podcast"
                ? { id: nextId(s.drilldowns.reading), title: "New podcast", author: "Podcast", progress: null, sub: "" }
                : { id: nextId(s.drilldowns.reading), title: "New book", author: "Author", progress: 0, sub: "ch. 1" },
            ],
          },
        })),
      onRemove: removeWithUndo(
        (s) => s.drilldowns.reading,
        (s, r) => ({ ...s, drilldowns: { ...s.drilldowns, reading: r } }),
        "Reading item removed"
      ),
    },
    spanish: {
      onCyclePhrase: () =>
        setState((s) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            spanish: {
              ...s.drilldowns.spanish,
              phraseIndex: (s.drilldowns.spanish.phraseIndex + 1) % s.drilldowns.spanish.phrases.length,
            },
          },
        })),
      // Leitner: "good" promotes the bucket and advances; "hard" stays; "again" resets to 0.
      // The chunk index always advances so you don't see the same one twice.
      onRateChunk: (id, rating) =>
        setState((s) => {
          const sp = s.drilldowns.spanish;
          const chunks = sp.chunks.map((c) => {
            if (c.id !== id) return c;
            if (rating === "good") return { ...c, bucket: Math.min(c.bucket + 1, 5), lastSeen: Date.now() };
            if (rating === "hard") return { ...c, lastSeen: Date.now() };
            return { ...c, bucket: 0, lastSeen: Date.now() };
          });
          return {
            ...s,
            drilldowns: {
              ...s.drilldowns,
              spanish: { ...sp, chunks, chunkIndex: (sp.chunkIndex + 1) % sp.chunks.length },
            },
          };
        }),
      // results: [{ id, allRight, anyAttempted }]. Bump correctPasses on full correctness;
      // reset on any mistake. Untouched verbs (anyAttempted=false) keep their state.
      onCheckVerbBatch: (results) =>
        setState((s) => {
          const sp = s.drilldowns.spanish;
          const byId = Object.fromEntries(results.map((r) => [r.id, r]));
          const verbs = sp.verbs.map((v) => {
            const r = byId[v.id];
            if (!r || !r.anyAttempted) return v;
            if (r.allRight) return { ...v, correctPasses: v.correctPasses + 1 };
            return { ...v, correctPasses: 0 };
          });
          return { ...s, drilldowns: { ...s.drilldowns, spanish: { ...sp, verbs } } };
        }),
    },
  };

  // ---- Render -----------------------------------------------------------
  // On mobile: single column, sections stack in order.
  // On desktop: two columns side by side. Drill-downs + reflection span full width below.

  const leftColumn = (
    <div style={styles.stack}>
      <Priorities priorities={state.priorities} onToggle={togglePriority} onChange={changePriority} />
      <Goals goals={state.goals} {...goalHandlers} />
      <Trends trends={state.trends} />
    </div>
  );

  const rightColumn = (
    <div style={styles.stack}>
      <Upcoming items={state.upcoming} {...upcomingHandlers} />
      <Metrics
        m={state.metrics}
        onUpdate={updateMetric}
        drilldowns={state.drilldowns}
        handlers={drilldownHandlers}
      />
      <Reflection value={state.journal} onChange={setJournal} />
    </div>
  );

  // Full-width sections that pin to the top of the page on every viewport.
  // Order: Spanish (active drill), North Star (vision), Habits (status).
  const topStack = (
    <div style={{ ...styles.stack, marginBottom: 20 }}>
      <Spanish data={state.drilldowns.spanish} {...drilldownHandlers.spanish} />
      <NorthStar value={state.northStar} onChange={setNorthStar} />
      <Habits habitLog={state.habitLog} habitNoLog={state.habitNoLog} />
    </div>
  );

  return (
    <div style={styles.page}>
      <Header today={today} dayOfYear={dayOfYear} quote={quote} />

      {topStack}

      {isDesktop ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              alignItems: "start",
            }}
          >
            {leftColumn}
            {rightColumn}
          </div>
          {/* Full-width drill-downs below */}
          <div style={{ marginTop: 20 }}>
            <Drilldowns data={state.drilldowns} handlers={drilldownHandlers} />
          </div>
        </>
      ) : (
        <div style={styles.stack}>
          <Priorities priorities={state.priorities} onToggle={togglePriority} onChange={changePriority} />
          <Goals goals={state.goals} {...goalHandlers} />
          <Upcoming items={state.upcoming} {...upcomingHandlers} />
          <Trends trends={state.trends} />
          <Metrics
            m={state.metrics}
            onUpdate={updateMetric}
            drilldowns={state.drilldowns}
            handlers={drilldownHandlers}
          />
          <Drilldowns data={state.drilldowns} handlers={drilldownHandlers} />
          <Reflection value={state.journal} onChange={setJournal} />
        </div>
      )}

      {/* Floating habit ring bar — fixed at bottom on all viewports */}
      <StickyHabits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />

      {undo && <UndoToast label={undo.label} onUndo={undo.onUndo} />}
    </div>
  );
}
