// Snapshot-style currency conversion.
// We store amounts in their native currency PLUS a EUR snapshot taken at the
// moment of entry, plus the rate used. Live FX after entry is intentionally
// not done — the dashboard is for tracking, not accounting.
//
// Frankfurter is a free no-key public ECB-rate proxy:
//   https://api.frankfurter.dev/v1/latest?from=GBP&to=EUR

const cache = new Map(); // ccy -> { rate, asOf }
const RATE_TTL_MS = 1000 * 60 * 60; // 1h

export const fmt = (m) => {
  if (!m || typeof m !== "object") return "—";
  const sym = { EUR: "€", GBP: "£", USD: "$", CHF: "CHF " }[m.ccy] || `${m.ccy} `;
  return `${sym}${(m.amount || 0).toLocaleString()}`;
};

async function fetchRate(ccy) {
  if (ccy === "EUR") return { rate: 1, asOf: new Date().toISOString().slice(0, 10) };
  const cached = cache.get(ccy);
  if (cached && Date.now() - cached.fetchedAt < RATE_TTL_MS) return cached;
  try {
    const r = await fetch(`https://api.frankfurter.dev/v1/latest?from=${ccy}&to=EUR`);
    if (!r.ok) throw new Error("rate fetch failed");
    const json = await r.json();
    const entry = { rate: json.rates.EUR, asOf: json.date, fetchedAt: Date.now() };
    cache.set(ccy, entry);
    return entry;
  } catch {
    // Offline / blocked — fall back to a sensible static rate so entry still works.
    const fallback = { GBP: 1.173, USD: 0.92, CHF: 1.05 }[ccy] || 1;
    return { rate: fallback, asOf: new Date().toISOString().slice(0, 10), fetchedAt: 0 };
  }
}

export async function toMoney(amount, ccy) {
  const num = parseFloat(amount) || 0;
  const { rate, asOf } = await fetchRate(ccy);
  return {
    amount: num,
    ccy,
    eur: Math.round(num * rate * 100) / 100,
    rate,
    asOf,
  };
}

// Synchronous variant for places where awaiting an FX call is awkward.
// Uses the cached or fallback rate; OK for UI placeholders that get refreshed
// next time the user edits.
export function toMoneySync(amount, ccy) {
  const num = parseFloat(amount) || 0;
  const cached = cache.get(ccy);
  const rate = ccy === "EUR" ? 1 : cached?.rate ?? ({ GBP: 1.173, USD: 0.92, CHF: 1.05 }[ccy] || 1);
  return {
    amount: num,
    ccy,
    eur: Math.round(num * rate * 100) / 100,
    rate,
    asOf: new Date().toISOString().slice(0, 10),
  };
}
