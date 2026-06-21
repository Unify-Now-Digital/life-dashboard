// Habit footer stats (V2 spec §6, version C). Three time-horizons per habit:
//   1. rolling 7-day dots (hit / miss / unanswered, today = outline)
//   2. 28-day run-rate vs target occurrences (weeklyTarget × 4), capped 100%
//   3. 28-day sparkline: a 7-day rolling completion rate (22 points)
//
// Reads from the existing top-level habitLog / habitNoLog arrays (ISO YES/NO
// dates per habit key) rather than the spec's per-habit `log` object, so the
// retrospective confirmation model is preserved. Per Arin's call, the footer
// lets you log today OR yesterday (today's dot is tappable, not just past days).

import { isoDate } from "./habits.js";

const MS_DAY = 86400000;

// weeklyTarget for a habit definition: target hits per `period` days, scaled to
// a 7-day week. Falls back to 7 (daily) when undefined.
export function weeklyTargetFor(habit) {
  if (!habit) return 7;
  if (typeof habit.weeklyTarget === "number") return habit.weeklyTarget;
  const target = habit.target ?? 7;
  const period = habit.period ?? 7;
  return Math.round((target / period) * 7);
}

export function habitStats(habitKey, habitLog = {}, habitNoLog = {}, habit = null, today = new Date()) {
  const yes = new Set(habitLog[habitKey] || []);
  const no = new Set(habitNoLog[habitKey] || []);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const back = (n) => new Date(base.getTime() - n * MS_DAY);
  const hit = (d) => yes.has(isoDate(d));

  // 1. rolling 7-day dots (oldest → today)
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const d = back(i);
    const iso = isoDate(d);
    dots.push({
      dateISO: iso,
      status: yes.has(iso) ? "yes" : no.has(iso) ? "no" : "unanswered",
      today: i === 0,
    });
  }

  // 2. 28-day run-rate vs target occurrences
  let hits = 0;
  for (let i = 0; i < 28; i++) if (hit(back(i))) hits++;
  const weeklyTarget = weeklyTargetFor(habit);
  const targetOccurrences = Math.max(1, weeklyTarget * 4);
  const runRate = Math.min(100, Math.round((hits / targetOccurrences) * 100));

  // 3. 28-day sparkline: 7-day rolling completion rate (22 points)
  const spark = [];
  for (let i = 27; i >= 6; i--) {
    let w = 0;
    for (let j = 0; j < 7; j++) if (hit(back(i - j))) w++;
    spark.push(w / 7);
  }

  return { dots, hits, targetOccurrences, runRate, spark, weeklyTarget };
}
