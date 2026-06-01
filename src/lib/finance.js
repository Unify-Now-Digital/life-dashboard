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

// Every month that has any finance data (revenue month or account snapshot
// month), ascending — the shared x-axis for the combined chart.
export function financeMonths(finance) {
  const set = new Set();
  for (const r of finance?.revenue || []) for (const h of r.history || []) if (h.month) set.add(h.month);
  for (const a of finance?.accounts || []) for (const h of a.history || []) if (h.date) set.add(h.date.slice(0, 7));
  return [...set].sort();
}

// Total of a balance type as of the end of a given month (carries forward the
// last snapshot on/before it).
export function balanceTotalAsOf(finance, type, month) {
  const asOf = `${month}-31`;
  return (finance?.accounts || [])
    .filter((a) => a.type === type)
    .reduce((s, a) => s + valueAsOf(a.history, "date", asOf), 0);
}

// EUR of the latest history entry on/before `asOf`, or null if there is none.
function eurAsOf(history, key, asOf) {
  let best = null;
  for (const h of history || []) {
    if ((h[key] || "") <= asOf && (!best || (h[key] || "") >= (best[key] || ""))) best = h;
  }
  return best ? best.eur || 0 : null;
}

// Balance total of a type as of the end of `month`, or null if no account of
// that type has any snapshot on/before it (so the chart leaves it blank rather
// than drawing a misleading zero).
export function balanceAtMonth(finance, type, month) {
  const asOf = `${month}-31`;
  const accts = (finance?.accounts || []).filter((a) => a.type === type);
  let any = false;
  let sum = 0;
  for (const a of accts) {
    const v = eurAsOf(a.history, "date", asOf);
    if (v != null) {
      any = true;
      sum += v;
    }
  }
  return any ? sum : null;
}

// Revenue total keyed by month.
export function revenueByMonth(finance) {
  const map = {};
  for (const p of revenueSeries(finance)) map[p.month] = p.eur;
  return map;
}

// Current net worth (latest snapshot of every account).
export function currentNetWorth(finance) {
  const accounts = finance?.accounts || [];
  return accounts.reduce(
    (sum, a) => sum + (a.type === "debt" ? -1 : 1) * latestEur(a.history, "date"),
    0
  );
}
