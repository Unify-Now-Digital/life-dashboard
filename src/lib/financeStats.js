// Finance aggregation. Given parsed + categorised transactions and a date
// range, produces the summary the FinanceLens renders: four run-rate stat
// cards, a deductible figure, and per-category aggregates (each with its top
// merchants and a monthly sparkline). All rates are derived from the actual
// span of the range, so the Monthly/Weekly toggle is just a field swap.

import { categorise, CATEGORY_LABELS, EXCLUDED_FROM_SPEND, INCOME_CATEGORIES, OVERRIDES } from "./categorise.js";
import { prettyMerchant, domainFor } from "./merchants.js";
import { unifyEurPerMonth } from "./unifyIncome.js";

const MS_DAY = 86400000;
export const DAN_OFFSET = 1250; // Dan's fixed monthly rent contribution.

const daysBetween = (start, end) => Math.max(1, (new Date(end) - new Date(start)) / MS_DAY);
const monthKey = (iso) => (iso || "").slice(0, 7);

// Every month in [start, end] inclusive, ascending — the sparkline x-axis.
function monthsInRange(start, end) {
  const out = [];
  const s = new Date(start);
  const e = new Date(end);
  let y = s.getFullYear();
  let m = s.getMonth();
  while (y < e.getFullYear() || (y === e.getFullYear() && m <= e.getMonth())) {
    out.push(`${y}-${String(m + 1).padStart(2, "0")}`);
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return out.length ? out : [monthKey(start)];
}

// Normalise a series of monthly totals to 0..1 for the polyline.
function normalise(values) {
  const max = Math.max(...values, 0);
  if (max <= 0) return values.map(() => 0);
  return values.map((v) => v / max);
}

export function financeStats(transactions, range, overrides = OVERRIDES) {
  const start = range?.start;
  const end = range?.end;
  const days = daysBetween(start, end);
  const months = monthsInRange(start, end);
  const perMonthOf = (total) => total / (days / 30.44);
  const perWeekOf = (total) => total / (days / 7);
  const perDayOf = (total) => total / days;

  // Bucket spend by category and by category→merchant; track monthly totals
  // for sparklines. Income and excluded transfers are handled separately.
  const cats = {}; // key → { total, count, business, byMonth:{}, merchants:{} }
  let income = 0;
  let rentGross = 0;
  let danOffset = 0;
  let excludedTotal = 0;
  let businessTotal = 0;

  const ensureCat = (key) => {
    if (!cats[key]) cats[key] = { total: 0, count: 0, deductible: 0, byMonth: {}, merchants: {} };
    return cats[key];
  };

  for (const tx of transactions || []) {
    const { category, business } = categorise(tx, overrides);
    const abs = Math.abs(tx.amount || 0);
    const mk = monthKey(tx.date);

    if (INCOME_CATEGORIES.has(category)) {
      if (tx.direction === "in") income += abs;
      continue;
    }
    if (category === "transfer_rent") {
      rentGross += abs;
      excludedTotal += abs;
      continue;
    }
    if (category === "rent_offset") {
      if (tx.direction === "in") danOffset += abs; // Dan's actual contribution
      excludedTotal += abs;
      continue;
    }
    if (EXCLUDED_FROM_SPEND.has(category)) {
      excludedTotal += abs;
      continue;
    }
    if (tx.direction !== "out") continue; // refunds / inbound — ignore for spend

    const c = ensureCat(category);
    c.total += abs;
    c.count += 1;
    c.byMonth[mk] = (c.byMonth[mk] || 0) + abs;
    if (business) {
      c.deductible += abs;
      businessTotal += abs;
    }

    const name = prettyMerchant(tx.merchant || tx.desc);
    if (!c.merchants[name]) c.merchants[name] = { name, total: 0, count: 0 };
    c.merchants[name].total += abs;
    c.merchants[name].count += 1;
  }

  const categories = Object.entries(cats)
    .map(([key, c]) => {
      const merchants = Object.values(c.merchants)
        .sort((a, b) => b.total - a.total)
        .map((m) => ({
          name: m.name,
          domain: domainFor(m.name),
          total: Math.round(m.total),
          count: m.count,
          perMonth: Math.round(perMonthOf(m.total)),
          perWeek: Math.round(perWeekOf(m.total)),
          perDay: +perDayOf(m.total).toFixed(1),
        }));
      return {
        key,
        label: CATEGORY_LABELS[key] || key,
        total: Math.round(c.total),
        count: c.count,
        perMonth: Math.round(perMonthOf(c.total)),
        perWeek: Math.round(perWeekOf(c.total)),
        perDay: +perDayOf(c.total).toFixed(1),
        deductible: Math.round(perMonthOf(c.deductible)),
        business: c.deductible > c.total / 2,
        spark: normalise(months.map((m) => c.byMonth[m] || 0)),
        merchants,
      };
    })
    .sort((a, b) => b.total - a.total);

  const cardSpendTotal = categories.reduce((s, c) => s + c.total, 0);
  const deductiblePerMonth = Math.round(perMonthOf(businessTotal));

  // Income = BODDY from the statement + Unify from invoices (GBP→EUR).
  const unifyPerMonth = unifyEurPerMonth(start, end);
  const incomePerMonth = Math.round(perMonthOf(income)) + unifyPerMonth;
  const cardSpendPerMonth = Math.round(perMonthOf(cardSpendTotal));
  const rentGrossPerMonth = Math.round(perMonthOf(rentGross));
  // Use Dan's actual contribution when present; fall back to the assumed flat.
  const danPerMonth = danOffset > 0 ? Math.round(perMonthOf(danOffset)) : DAN_OFFSET;
  const rentNetPerMonth = rentGrossPerMonth - danPerMonth;
  const netPerMonth = incomePerMonth - cardSpendPerMonth - rentNetPerMonth;

  const toWeek = (perMonth) => Math.round((perMonth * 12) / 52);

  return {
    range: { start, end, months, days },
    stats: {
      income: { perMonth: incomePerMonth, perWeek: toWeek(incomePerMonth), note: "BODDY + Unify (invoiced)" },
      cardSpend: { perMonth: cardSpendPerMonth, perWeek: toWeek(cardSpendPerMonth), note: "transfers excl." },
      rentNet: {
        perMonth: rentNetPerMonth,
        perWeek: toWeek(rentNetPerMonth),
        gross: rentGrossPerMonth,
        offset: danPerMonth,
        note: `€${rentGrossPerMonth.toLocaleString()} − €${danPerMonth.toLocaleString()} Dan`,
      },
      net: { perMonth: netPerMonth, perWeek: toWeek(netPerMonth), note: "before P2P paybacks" },
    },
    deductible: { perMonth: deductiblePerMonth, perWeek: toWeek(deductiblePerMonth) },
    excluded: { perMonth: Math.round(perMonthOf(excludedTotal)), total: Math.round(excludedTotal) },
    categories,
  };
}
