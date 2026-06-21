// Small date helpers for task due dates + the urgency `meta` label.

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Add `n` days to an ISO date (or to today when null), returning ISO.
export function addDays(iso, n) {
  const base = iso ? new Date(iso + "T00:00:00") : new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + n);
  return base.toISOString().slice(0, 10);
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Relative urgency label shown on a task row: overdue / today / weekday / "Nd".
export function metaFromDue(iso) {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 6) return DOW[d.getDay()];
  return `${diff}d`;
}
