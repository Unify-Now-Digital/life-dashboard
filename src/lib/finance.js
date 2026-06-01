// Finance derivations — net worth + revenue trends computed from per-line
// history, so the rollups can never drift from the lines that make them up.
// All amounts are EUR numbers.

// Latest snapshot value of a history array, by its date/month key.
export function latestEur(history, key) {
  if (!Array.isArray(history) || history.length === 0) return 0;
  let best = history[0];
  for (const h of history) if ((h[key] || "") >= (best[key] || "")) best = h;
  return best.eur || 0;
}

// Value of a history series as it stood on/before a given date/month key.
function valueAsOf(history, key, asOf) {
  let best = null;
  for (const h of (history || [])) {
    if ((h[key] || "") <= asOf && (!best || (h[key] || "") >= (best[key] || ""))) best = h;
  }
  return best ? best.eur || 0 : 0;
}

// Net worth over time: one point per distinct snapshot date across all
// accounts. Net = savings + investments − debts, each taken as its latest
// value on/before that date. Returns [{ date, eur }] ascending.
export function netWorthSeries(finance) {
  const accounts = finance?.accounts || [];
  const dates = new Set();
  for (const a of accounts) for (const h of a.history || []) if (h.date) dates.add(h.date);
  const sorted = [...dates].sort();
  return sorted.map((date) => {
    let eur = 0;
    for (const a of accounts) {
      const v = valueAsOf(a.history, "date", date);
      eur += a.type === "debt" ? -v : v;
    }
    return { date, eur };
  });
}

// Total revenue per month: sum across sources of each source's figure for
// that month. Returns [{ month, eur }] ascending.
export function revenueSeries(finance) {
  const revenue = finance?.revenue || [];
  const months = new Set();
  for (const r of revenue) for (const h of r.history || []) if (h.month) months.add(h.month);
  const sorted = [...months].sort();
  return sorted.map((month) => {
    let eur = 0;
    for (const r of revenue) {
      const hit = (r.history || []).find((h) => h.month === month);
      if (hit) eur += hit.eur || 0;
    }
    return { month, eur };
  });
}

// Total of one balance category (saving|investment|debt) over time: one point
// per distinct snapshot date, each summing that type's accounts as-of the date.
// Returns [{ label /* date */, eur }] ascending.
export function balanceSeries(finance, type) {
  const accts = (finance?.accounts || []).filter((a) => a.type === type);
  const dates = new Set();
  for (const a of accts) for (const h of a.history || []) if (h.date) dates.add(h.date);
  return [...dates].sort().map((date) => ({
    label: date,
    eur: accts.reduce((s, a) => s + valueAsOf(a.history, "date", date), 0),
  }));
}

// Current net worth (latest snapshot of every account).
export function currentNetWorth(finance) {
  const accounts = finance?.accounts || [];
  return accounts.reduce(
    (sum, a) => sum + (a.type === "debt" ? -1 : 1) * latestEur(a.history, "date"),
    0
  );
}
