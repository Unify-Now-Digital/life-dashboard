// Revolut — feeds drilldowns.finances (income, spending, breakdowns)
//
// Real wiring (when ready):
//   - Revolut Business API (https://developer.revolut.com/docs/business)
//   - OAuth 2.0 with JWT client assertion (signed with your private key)
//   - Endpoints: GET /accounts, GET /transactions?from=...&to=...
//   - Aggregate transactions by counterparty/category → incomeBreakdown / expenseBreakdown
//   - Secrets must live server-side; never expose the private key in this client bundle

export const id = "revolut";
export const label = "Revolut";
export const feeds = "finances";
export const description = "Account balance and transactions";

export async function connect() {
  throw new Error("Revolut: OAuth flow not wired. Add client_id + private key on the server.");
}

export async function disconnect() {
  // TODO: revoke refresh token
}

// Returns { ok, data, error }. data shape (when implemented):
//   { income: number, spending: number, incomeBreakdown: [...], expenseBreakdown: [...] }
export async function sync(_opts = {}) {
  return { ok: false, error: "stub", data: null };
}
