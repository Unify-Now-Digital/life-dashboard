// Registry of external service integrations.
// Each module exports: id, label, feeds, description, connect, disconnect, sync.
// Add new services here.

import * as revolut from "./revolut.js";
import * as appleHealth from "./appleHealth.js";
import * as calendar from "./calendar.js";
import * as stripe from "./stripe.js";

export const integrations = { revolut, appleHealth, calendar, stripe };

export function getIntegration(id) {
  return integrations[id];
}

// Single-account integrations live as { connected, lastSync } in state.integrations[id].
// Stripe is multi-account: state.integrations.stripe.accounts is an array of
// { id, label, connected, lastSync, accountKey }.
