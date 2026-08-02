// Pure, deterministic stats for the assistant's weekly review — see
// get_weekly_review_data in Dashboard.jsx. Everything here is plain
// arithmetic over existing state (tasks/habitLog/finance.transactions); the
// assistant only ever narrates what these functions already computed and
// gated. It never invents which pattern to report.
//
// Cross-domain "correlations" are co-occurrence counts, not a statistical
// correlation coefficient — with only a handful of weeks of data, a real
// coefficient would be more precise-looking than the data actually
// supports. Two hard gates keep this honest:
//   - minWeeks: need enough off-track weeks before ANY pattern is allowed to
//     surface — with 2 data points, "2 for 2" sounds compelling and means
//     nothing.
//   - minEffect vs baseRate: the co-occurrence rate has to clearly beat how
//     often that category runs high in general, not just match it.

import { isoDate } from "./habits.js";
import { categorise, CATEGORY_LABELS, EXCLUDED_FROM_SPEND, INCOME_CATEGORIES } from "./categorise.js";
import { weeklyTargetFor } from "./habitStats.js";

const MS_DAY = 86400000;
const LOOKBACK_WEEKS = 12;
const MIN_QUALIFYING_WEEKS = 4;
const MIN_EFFECT = 0.75; // co-occurrence rate required among qualifying weeks
const MIN_EDGE_OVER_BASE_RATE = 0.25; // effect must beat the base rate by at least this much
const ABOVE_AVERAGE_MARGIN = 1.1; // 10% above a category's own trailing average counts as "above"
const OFF_TRACK_HIT_RATE = 0.5; // habit week counts as "off-track" below this fraction of target
const STALE_PRIORITY_DAYS = 14;

// "YYYY-MM-DD" -> local Date. Deliberately not `new Date(iso)` — that parses
// date-only strings as UTC midnight, which can land on the wrong local day
// depending on timezone offset.
function parseISO(iso) {
  const [y, m, d] = (iso || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sun .. 6 = Sat
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

export function weekKey(date) {
  return isoDate(mondayOf(date));
}

// The most recent *fully elapsed* week's Monday key, relative to `today`.
// The current in-progress week is never eligible for review.
export function lastCompletedWeekKey(today = new Date()) {
  const thisMonday = mondayOf(today);
  return isoDate(new Date(thisMonday.getTime() - 7 * MS_DAY));
}

export function isReviewReady(lastReviewWeek, today = new Date()) {
  return lastCompletedWeekKey(today) !== lastReviewWeek;
}

// The last `n` fully-elapsed weeks, oldest → newest, ending at
// lastCompletedWeekKey. Never includes the current in-progress week.
function recentWeekKeys(today, n) {
  const thisMonday = mondayOf(today);
  const keys = [];
  for (let i = n; i >= 1; i--) keys.push(isoDate(new Date(thisMonday.getTime() - i * 7 * MS_DAY)));
  return keys;
}

// Per-week hit count/rate for one habit, aligned to `weekKeys`.
function habitWeeklyBuckets(habit, habitLog, habitNoLog, weekKeys) {
  const yes = new Set(habitLog?.[habit.key] || []);
  const weeklyTarget = weeklyTargetFor(habit);
  return weekKeys.map((mondayKey) => {
    const monday = parseISO(mondayKey);
    let hits = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      if (yes.has(isoDate(d))) hits++;
    }
    return { week: mondayKey, hits, weeklyTarget, hitRate: weeklyTarget > 0 ? hits / weeklyTarget : 0 };
  });
}

function isRealSpend(category) {
  return !(
    INCOME_CATEGORIES.has(category) ||
    category === "transfer_rent" ||
    category === "rent_offset" ||
    EXCLUDED_FROM_SPEND.has(category)
  );
}

// { weekKey -> { categoryKey -> totalSpend } }, aligned to `weekKeys`.
// Excludes transfers/income the same way financeStats.js does, so this
// agrees with what the Finance lens actually calls "spend".
function financeWeeklyBuckets(transactions, overrides, weekKeys) {
  const byWeek = {};
  for (const wk of weekKeys) byWeek[wk] = {};
  const weekKeySet = new Set(weekKeys);

  for (const tx of transactions || []) {
    if (tx.direction !== "out") continue;
    const { category } = categorise(tx, overrides);
    if (!isRealSpend(category)) continue;
    const txDate = parseISO(tx.date);
    if (!txDate) continue;
    const wk = weekKey(txDate);
    if (!weekKeySet.has(wk)) continue;
    byWeek[wk][category] = (byWeek[wk][category] || 0) + Math.abs(tx.amount || 0);
  }
  return byWeek;
}

// Candidate habit×category patterns that clear both gates. [] most weeks —
// that's the expected, correct output, not a sign something's broken.
export function findCorrelations(
  habits,
  habitLog,
  habitNoLog,
  transactions,
  overrides,
  { weeks = LOOKBACK_WEEKS, minWeeks = MIN_QUALIFYING_WEEKS, minEffect = MIN_EFFECT, today = new Date() } = {}
) {
  if (!transactions || !transactions.length) return []; // no import → nothing to correlate against

  const weekKeys = recentWeekKeys(today, weeks);
  const financeBuckets = financeWeeklyBuckets(transactions, overrides, weekKeys);

  const categories = new Set();
  for (const wk of weekKeys) for (const cat of Object.keys(financeBuckets[wk] || {})) categories.add(cat);

  const categorySeries = {};
  for (const cat of categories) {
    const series = weekKeys.map((wk) => financeBuckets[wk]?.[cat] || 0);
    const avg = series.reduce((a, b) => a + b, 0) / series.length;
    categorySeries[cat] = { series, avg };
  }

  const results = [];
  for (const habit of (habits || []).filter((h) => h.active !== false)) {
    const buckets = habitWeeklyBuckets(habit, habitLog, habitNoLog, weekKeys);
    const offTrackWeeks = buckets.filter((w) => w.hitRate < OFF_TRACK_HIT_RATE).map((w) => w.week);
    if (offTrackWeeks.length < minWeeks) continue;

    for (const cat of categories) {
      const { series, avg } = categorySeries[cat];
      if (avg <= 0) continue;

      const aboveInOffTrack = offTrackWeeks.filter((wk) => {
        const idx = weekKeys.indexOf(wk);
        return series[idx] >= avg * ABOVE_AVERAGE_MARGIN;
      }).length;
      const effect = aboveInOffTrack / offTrackWeeks.length;
      if (effect < minEffect) continue;

      const baseRate = series.filter((v) => v >= avg * ABOVE_AVERAGE_MARGIN).length / series.length;
      if (effect - baseRate < MIN_EDGE_OVER_BASE_RATE) continue; // must clearly beat the base rate, not just match it

      results.push({
        habitKey: habit.key,
        habitLabel: habit.label,
        category: cat,
        categoryLabel: CATEGORY_LABELS[cat] || cat,
        offTrackWeeks: offTrackWeeks.length,
        aboveInOffTrack,
        effectPct: Math.round(effect * 100),
        baseRatePct: Math.round(baseRate * 100),
      });
    }
  }
  return results;
}

function taskWeeklySummary(tasks, reviewWeek, today) {
  const monday = parseISO(reviewWeek);
  const sunday = new Date(monday.getTime() + 6 * MS_DAY);
  const startISO = isoDate(monday);
  const endISO = isoDate(sunday);

  const completed = (tasks || []).filter(
    (t) => t.completedAt && t.completedAt.slice(0, 10) >= startISO && t.completedAt.slice(0, 10) <= endISO
  );

  // Stale priorities as of *today* (not scoped to the reviewed week) —
  // what's actionable right now is more useful than what was stale a week
  // ago.
  const staleCutoff = isoDate(new Date(today.getTime() - STALE_PRIORITY_DAYS * MS_DAY));
  const stalePriority = (tasks || []).filter(
    (t) => t.status !== "done" && (t.priority || t.isDecision) && t.createdAt && t.createdAt.slice(0, 10) < staleCutoff
  );

  return {
    completedCount: completed.length,
    completed: completed.slice(0, 10).map((t) => ({ id: t.id, text: t.text })),
    stalePriorityCount: stalePriority.length,
    stalePriority: stalePriority.slice(0, 10).map((t) => ({ id: t.id, text: t.text })),
  };
}

// The single entry point the get_weekly_review_data tool calls.
export function buildWeeklyReviewData(state, { today = new Date() } = {}) {
  const reviewWeek = lastCompletedWeekKey(today);
  const habits = (state.habits || []).filter((h) => h.active !== false);

  const habitSummary = habits.map((h) => {
    const [bucket] = habitWeeklyBuckets(h, state.habitLog, state.habitNoLog, [reviewWeek]);
    return { key: h.key, label: h.label, hits: bucket.hits, weeklyTarget: bucket.weeklyTarget, hitRatePct: Math.round(bucket.hitRate * 100) };
  });

  const txns = state.finance?.transactions || [];
  let financeSummary = null;
  if (txns.length) {
    const weekKeys = recentWeekKeys(today, LOOKBACK_WEEKS);
    const buckets = financeWeeklyBuckets(txns, state.finance?.overrides, weekKeys);
    const thisWeek = buckets[reviewWeek] || {};
    financeSummary = Object.entries(thisWeek)
      .map(([cat, total]) => {
        const series = weekKeys.map((wk) => buckets[wk]?.[cat] || 0);
        const avg = series.reduce((a, b) => a + b, 0) / series.length;
        return { category: cat, label: CATEGORY_LABELS[cat] || cat, total: Math.round(total), weeklyAverage: Math.round(avg) };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }

  return {
    week: reviewWeek,
    tasks: taskWeeklySummary(state.tasks, reviewWeek, today),
    habits: habitSummary,
    finance: financeSummary, // null when no CSV has ever been imported
    correlations: findCorrelations(habits, state.habitLog, state.habitNoLog, txns, state.finance?.overrides, { today }),
  };
}
