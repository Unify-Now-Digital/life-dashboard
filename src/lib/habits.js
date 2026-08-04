// Date utilities and streak logic for the habit ring system.
// Habits are confirmed retrospectively: each morning you tick what you did "yesterday".

export function isoDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isoYesterday(today = new Date()) {
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}

// Returns "yes" | "no" | "unanswered" for a given habit on a given ISO date
export function statusFor(habit, dateISO, habitLog, habitNoLog) {
  if (habitLog[habit]?.includes(dateISO)) return "yes";
  if (habitNoLog[habit]?.includes(dateISO)) return "no";
  return "unanswered";
}

// Streak = number of consecutive YES days ending at the most recent answered day.
// Walks backwards from yesterday. Stops on the first NO or the first unanswered day
// that is NOT yesterday (yesterday being unanswered shouldn't break a streak yet).
export function streakFor(habit, habitLog, habitNoLog, today = new Date()) {
  const yesISO = isoYesterday(today);
  const yesStatus = statusFor(habit, yesISO, habitLog, habitNoLog);

  // If yesterday is unanswered, look at the day before to compute current streak.
  // Streak is "what's locked in already".
  let cursor = new Date(today);
  cursor.setDate(cursor.getDate() - 1); // start at yesterday
  if (yesStatus === "unanswered") {
    cursor.setDate(cursor.getDate() - 1); // shift to day-before-yesterday
  }

  let streak = 0;
  while (true) {
    const d = isoDate(cursor);
    const s = statusFor(habit, d, habitLog, habitNoLog);
    if (s === "yes") {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// True if there's at least one unanswered day from yesterday backwards through the
// last 7 days (we don't pester forever about ancient history).
export function hasUnanswered(habit, habitLog, habitNoLog) {
  const yesISO = isoYesterday();
  return statusFor(habit, yesISO, habitLog, habitNoLog) === "unanswered";
}

// Goal length used to size the visual ring fill. Default: 30-day cycle.
export const STREAK_GOAL = 30;

// Slug for a new habit's `key` — every habitLog/habitNoLog entry, the
// dailyFocus ranking, and the assistant's log_habit tool all key off this,
// so it has to be stable and unique. Collides against every existing key
// (active or archived) so a reused/retired key's old log history is never
// silently inherited by a new habit of the same name.
export function slugifyHabitKey(label, existingKeys = []) {
  const base = (label || "habit").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "habit";
  const taken = new Set(existingKeys);
  let key = base;
  let i = 2;
  while (taken.has(key)) key = `${base}_${i++}`;
  return key;
}

// Returns the last `days` statuses for a habit, oldest first, ending at yesterday.
export function historyFor(habit, habitLog, habitNoLog, days = 7) {
  const out = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - days); // start `days` ago
  for (let i = 0; i < days; i++) {
    cursor.setDate(cursor.getDate() + 1);
    out.push({
      date: isoDate(cursor),
      status: statusFor(habit, isoDate(cursor), habitLog, habitNoLog),
    });
  }
  return out;
}
