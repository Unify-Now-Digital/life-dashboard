import React, { useState } from "react";
import { styles, QUOTES, C, BIZ_COLORS, AVATAR_KEYS } from "./lib/tokens";
import { defaultState, nextId } from "./lib/defaultState";

import Header from "./components/Header.jsx";
import Priorities from "./components/Priorities.jsx";
import Streaks from "./components/Streaks.jsx";
import Goals from "./components/Goals.jsx";
import Upcoming from "./components/Upcoming.jsx";
import Trends from "./components/Trends.jsx";
import Metrics from "./components/Metrics.jsx";
import Drilldowns from "./components/Drilldowns.jsx";
import NorthStar from "./components/NorthStar.jsx";
import Reflection from "./components/Reflection.jsx";

export default function Dashboard() {
  const [state, setState] = useState(defaultState);

  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - start) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

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

  const tickHabit = (key) =>
    setState((s) => {
      const wasLogged = s.habitsLoggedToday[key];
      const newLogged = { ...s.habitsLoggedToday, [key]: !wasLogged };
      const newStreaks = { ...s.habitStreaks };
      if (wasLogged) newStreaks[key] = Math.max(0, newStreaks[key] - 1);
      else newStreaks[key] = newStreaks[key] + 1;
      return { ...s, habitsLoggedToday: newLogged, habitStreaks: newStreaks };
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
    onRemove: (id) => setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
  };

  const upcomingHandlers = {
    onUpdate: (id, field, value) => updateItemInList(["upcoming"], id, field, value),
    onAdd: () =>
      setState((s) => ({
        ...s,
        upcoming: [...s.upcoming, { id: nextId(s.upcoming), date: "—", text: "New item", cat: "Personal" }],
      })),
    onRemove: (id) => setState((s) => ({ ...s, upcoming: s.upcoming.filter((u) => u.id !== id) })),
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
      onRemove: (id) =>
        setState((s) => ({
          ...s,
          drilldowns: { ...s.drilldowns, businesses: s.drilldowns.businesses.filter((b) => b.id !== id) },
        })),
    },
    finances: {
      onUpdate: (key, value) =>
        setState((s) => ({
          ...s,
          drilldowns: { ...s.drilldowns, finances: { ...s.drilldowns.finances, [key]: value } },
        })),
    },
    travel: {
      onUpdateStat: (key, value) =>
        setState((s) => ({
          ...s,
          drilldowns: { ...s.drilldowns, travel: { ...s.drilldowns.travel, [key]: value } },
        })),
      onUpdateTrip: (id, field, value) => updateItemInList(["drilldowns", "travel", "trips"], id, field, value),
      onAddTrip: () =>
        setState((s) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            travel: {
              ...s.drilldowns.travel,
              trips: [
                ...s.drilldowns.travel.trips,
                { id: nextId(s.drilldowns.travel.trips), name: "New trip", sub: "dates · nights", days: 0 },
              ],
            },
          },
        })),
      onRemoveTrip: (id) =>
        setState((s) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            travel: { ...s.drilldowns.travel, trips: s.drilldowns.travel.trips.filter((t) => t.id !== id) },
          },
        })),
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
      onRemove: (id) =>
        setState((s) => ({
          ...s,
          drilldowns: {
            ...s.drilldowns,
            relationships: s.drilldowns.relationships.filter((r) => r.id !== id),
          },
        })),
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
      onRemove: (id) =>
        setState((s) => ({
          ...s,
          drilldowns: { ...s.drilldowns, reading: s.drilldowns.reading.filter((r) => r.id !== id) },
        })),
    },
  };

  return (
    <div style={styles.page}>
      <Header today={today} dayOfYear={dayOfYear} quote={quote} />
      <div style={styles.stack}>
        <Priorities priorities={state.priorities} onToggle={togglePriority} onChange={changePriority} />
        <Streaks streaks={state.habitStreaks} logged={state.habitsLoggedToday} onTick={tickHabit} />
        <Goals goals={state.goals} {...goalHandlers} />
        <Upcoming items={state.upcoming} {...upcomingHandlers} />
        <Trends trends={state.trends} />
        <Metrics m={state.metrics} onUpdate={updateMetric} />
        <Drilldowns data={state.drilldowns} handlers={drilldownHandlers} />
        <NorthStar text={state.northStar} onChange={setNorthStar} />
        <Reflection value={state.journal} onChange={setJournal} />
      </div>
    </div>
  );
}
