// Unify Digital income — sourced from issued invoices (GBP), not the Revolut
// account, because only partial / lagged Unify payments ever landed in the
// statement. Per Arin: ignore the CSV's "unify digital" payments and use these
// invoice amounts for a clearer income picture.
//
// Keyed by the WORK month (YYYY-MM); amounts are GBP from each invoice.
// GBP_EUR is the assumed conversion rate — adjust to your booking rate.

export const GBP_EUR = 1.17;

export const UNIFY_INVOICES_GBP = {
  "2025-01": 3647.04, // Rev-Ops
  "2025-06": 5499.04,
  "2025-10": 4024.22,
  "2025-11": 5142.53,
  "2025-12": 4070.03,
  "2026-01": 5529.97,
  "2026-02": 4955.02,
  "2026-03": 6501.86,
  "2026-04": 8349.92,
  "2026-05": 5685.19,
};

// The last `n` Unify invoice months, ascending — [{ month, gbp }]. Drives the
// rolling header sparkline.
export function unifyTrend(n = 6) {
  const months = Object.keys(UNIFY_INVOICES_GBP).sort();
  return months.slice(-n).map((m) => ({ month: m, gbp: UNIFY_INVOICES_GBP[m] }));
}

// Average Unify invoice (EUR) per month across the work-months that fall within
// [start, end]. Used as the Unify component of the Income stat card.
export function unifyEurPerMonth(start, end) {
  const s = (start || "").slice(0, 7);
  const e = (end || "").slice(0, 7);
  const months = Object.keys(UNIFY_INVOICES_GBP).filter((m) => (!s || m >= s) && (!e || m <= e));
  if (!months.length) return 0;
  const avgGbp = months.reduce((a, m) => a + UNIFY_INVOICES_GBP[m], 0) / months.length;
  return Math.round(avgGbp * GBP_EUR);
}
