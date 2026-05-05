// localStorage persistence + daily rollover.
//
// Daily rollover resets priorities (text + done) and the journal at the start
// of each day, so the dashboard always opens as a fresh canvas. Historical
// data (habitLog, habitNoLog, goals, drilldowns, integrations, northStar) is
// preserved.

import { defaultState } from "./defaultState.js";

const STORAGE_KEY = "life-dashboard-v1";

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function loadState() {
  if (typeof localStorage === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const saved = JSON.parse(raw);
    if (saved.schemaVersion !== defaultState.schemaVersion) return defaultState;
    // Shallow-merge so newly-added top-level fields (e.g. integrations) appear
    // in saves from before they existed.
    return { ...defaultState, ...saved };
  } catch {
    return defaultState;
  }
}

export function saveState(state) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private mode — silently skip.
  }
}

export function applyDailyRollover(state) {
  const today = todayISO();
  if (state.todayDate === today) return state;
  return {
    ...state,
    todayDate: today,
    priorities: state.priorities.map(() => ({ text: "", done: false })),
    journal: "",
  };
}
