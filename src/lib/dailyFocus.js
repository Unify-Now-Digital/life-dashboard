// Daily focus ranking engine (V2 focus-first shell).
//
// Pure functions only — no state mutation, no fetching. Combines active
// habits and open tasks into one severity-scored list and picks the top 3
// to headline the day, tiered by rank and colour-banded by absolute
// severity (the two are independent: colour never changes with rank, see
// CLAUDE.md "Daily focus" section).
//
// Severity ranges are designed to land in the same rough 0–110 band for
// both kinds so a mixed sort is meaningful:
//   habit severity = 100 − 28-day run-rate (habitStats.js), capped at 65
//                     if the habit has never once been logged (see
//                     NEVER_LOGGED_SEVERITY_CAP) — "worth starting" reads
//                     differently from "actively failing," even though the
//                     raw run-rate math can't otherwise tell them apart.
//   task  severity = min(daysOverdue, 4) × 10
//                     + (priority ? 30 : 0)
//                     + (isDecision ? 20 : 0)
//                     + (dueToday && !overdue ? 15 : 0)
// A true severity tie (rare once the cap above is in place) is broken by
// staleness — days since last log (habits) or days overdue (tasks) — not
// by priority a second time (already baked into severity) or array order.

import { habitStats } from "./habitStats.js";
import { streakFor, isoDate } from "./habits.js";

export const SEVERITY_BAND = { RED: 70, AMBER: 40 };
export const GHOST_STREAK_THRESHOLD = 3;
// A habit with zero logs ever (never a yes, never a no) reads as "worth
// starting," not "actively failing" — the raw 100-runRate formula can't
// tell those apart (both score 100), which on a fresh habit crowded out a
// genuinely overdue+priority task on nothing but array-order luck. Capping
// at 65 keeps it visible and amber rather than red; a single real "no"
// answer is enough to let its true severity through uncapped.
const NEVER_LOGGED_SEVERITY_CAP = 65;
const TOP_N = 3;
const OVERFLOW_N = 2;

export function bandFor(severity) {
  if (severity >= SEVERITY_BAND.RED) return "red";
  if (severity >= SEVERITY_BAND.AMBER) return "amber";
  return "neutral";
}

// Days between two local-midnight dates (positive = `due` is in the past).
// Mirrors taskDates.js's metaFromDue convention: local midnight on both
// sides, Math.round to absorb any sub-day DST drift.
function daysOverdue(dueISO, today) {
  if (!dueISO) return { overdue: 0, dueToday: false };
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d = new Date(dueISO + "T00:00:00");
  const diff = Math.round((base - d) / 86400000);
  return { overdue: Math.max(0, diff), dueToday: diff === 0 };
}

export function taskSeverity(task, today = new Date()) {
  const { overdue, dueToday } = daysOverdue(task.due, today);
  const overdueScore = Math.min(overdue, 4) * 10;
  const priorityScore = task.priority ? 30 : 0;
  const decisionScore = task.isDecision ? 20 : 0;
  const dueTodayScore = dueToday ? 15 : 0;
  return { severity: overdueScore + priorityScore + decisionScore + dueTodayScore, overdue, dueToday };
}

export function habitSeverity(habit, habitLog, habitNoLog, today = new Date()) {
  const stats = habitStats(habit.key, habitLog, habitNoLog, habit, today);
  const neverLogged = !(habitLog[habit.key]?.length) && !(habitNoLog[habit.key]?.length);
  const rawSeverity = 100 - stats.runRate;
  const severity = neverLogged ? Math.min(rawSeverity, NEVER_LOGGED_SEVERITY_CAP) : rawSeverity;
  return { severity, neverLogged, ...stats };
}

// Days since the most recent log entry (yes or no) for a habit — the
// tiebreak signal for section 2: whoever's been neglected longest wins a
// true severity tie, a rule a user can actually reconstruct. A habit with
// no log at all is treated as maximally stale (Infinity), since there's no
// "last touched" date to measure from.
function habitStaleness(habitKey, habitLog, habitNoLog, today) {
  const dates = [...(habitLog[habitKey] || []), ...(habitNoLog[habitKey] || [])];
  if (!dates.length) return Infinity;
  let latest = dates[0];
  for (const d of dates) if (d > latest) latest = d;
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d = new Date(latest + "T00:00:00");
  return Math.round((base - d) / 86400000);
}

function taskStatLine(overdue, dueToday, isDecision) {
  if (overdue > 0) return `Overdue ${overdue}d`;
  if (dueToday) return "Due today";
  if (isDecision) return "Decision pending";
  return "Priority";
}

// Builds the ranked focus list: { items, overflow, decay }.
//   items:    top 3, richest first, each carrying `rank` (1-3) and `tier`
//             (1 = hero, 2/3 = the two smaller cards)
//   overflow: the next 2 (for the "X and Y narrowly missed the cut" note)
//   decay:    today's elapsed-day fraction, for the hero's urgency bar
export function buildDailyFocus(state, today = new Date()) {
  const habits = (state.habits || []).filter((h) => h.active !== false);
  const tasks = (state.tasks || []).filter((t) => t.status !== "done");
  const habitLog = state.habitLog || {};
  const habitNoLog = state.habitNoLog || {};

  const candidates = [];

  for (const habit of habits) {
    const { severity, hits, targetOccurrences, runRate } = habitSeverity(habit, habitLog, habitNoLog, today);
    const streak = streakFor(habit.key, habitLog, habitNoLog, today);
    candidates.push({
      kind: "habit",
      key: habit.key,
      label: habit.label,
      severity,
      band: bandFor(severity),
      ringPercent: runRate,
      statLine: `${hits}/${targetOccurrences} this month`,
      commitment: habit.commitment || null,
      streak,
      lossPreview: streak >= GHOST_STREAK_THRESHOLD,
      staleness: habitStaleness(habit.key, habitLog, habitNoLog, today),
      habit,
    });
  }

  for (const task of tasks) {
    const { severity, overdue, dueToday } = taskSeverity(task, today);
    if (severity <= 0) continue; // untagged, undated tasks don't compete for focus
    candidates.push({
      kind: "task",
      key: task.id,
      label: task.text,
      severity,
      band: bandFor(severity),
      ringPercent: null,
      statLine: taskStatLine(overdue, dueToday, task.isDecision),
      staleness: overdue,
      task,
    });
  }

  // Severity decides the ranking; staleness only arbitrates a true tie —
  // whoever's gone longest without attention wins, not array order.
  candidates.sort((a, b) => b.severity - a.severity || b.staleness - a.staleness);

  const items = candidates.slice(0, TOP_N).map((c, i) => ({ ...c, rank: i + 1, tier: i + 1 }));
  const overflow = candidates.slice(TOP_N, TOP_N + OVERFLOW_N);

  const hoursElapsed = today.getHours() + today.getMinutes() / 60;
  const fraction = Math.min(1, Math.max(0, hoursElapsed / 24));
  const hoursLeft = Math.max(0, Math.round(24 - hoursElapsed));

  return {
    items,
    overflow,
    decay: { fraction, hoursLeft },
    todayISO: isoDate(today),
  };
}
