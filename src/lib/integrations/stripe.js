// Stripe — multi-account. Feeds drilldowns.businesses (per-account MTD revenue) and
// rolls up into drilldowns.finances.income.
//
// Real wiring (when ready):
//   - One restricted API key per business (Sears Melvin, Churchill, BODDY, Unify Digital).
//   - Keys live server-side. The client only ever knows an opaque `accountKey` reference
//     that the server resolves to the real `sk_live_...`.
//   - Per account, hit:
//       GET /v1/balance                       → available + pending
//       GET /v1/charges?created[gte]=<MTD>    → MTD revenue, count, last 5 enquiries
//   - Map per-account result onto the matching drilldowns.businesses[].value/meta.
//   - Sum across accounts into drilldowns.finances.income (currency-converted at sync time).

export const id = "stripe";
export const label = "Stripe";
export const feeds = "businesses, finances";
export const description = "Per-business revenue across multiple accounts";

export async function connect(_accountId) {
  throw new Error("Stripe: provide a restricted-key for this account on the server.");
}

export async function disconnect(_accountId) {}

// Returns { ok, data, error }. data shape (when implemented):
//   { mtdRevenue: number, currency: string, charges: number, lastEnquiryAt: string }
export async function sync(_accountId, _opts = {}) {
  return { ok: false, error: "stub", data: null };
}
