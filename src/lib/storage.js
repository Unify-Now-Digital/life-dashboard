// Persistence layer.
//
// Source of truth: Supabase row keyed on the authed user_id, in a single
// jsonb column. localStorage is a write-through cache so the dashboard
// boots instantly offline.
//
// Strategy:
//   loadState() — try localStorage cache first (instant paint), then race
//                 a Supabase fetch and reconcile if newer.
//   saveState() — debounced write to both layers. Failed cloud writes queue
//                 in localStorage and replay on next focus.
//
// If Supabase env vars aren't set the cloud layer is skipped entirely —
// dashboard runs as a local-only PWA.

import { defaultState, SCHEMA_VERSION } from "./defaultState";
import { supabase, isSupabaseEnabled } from "./supabase";

const LS_KEY = "lifeDashboard:v2";
const LS_QUEUE_KEY = "lifeDashboard:queue";

// ----- migration -----------------------------------------------------------
// Always additive. Renames break. Old keys are tolerated alongside new ones.
export function migrate(raw) {
  if (!raw || typeof raw !== "object") return defaultState;
  let s = { ...raw };
  const v = s.schemaVersion || 1;

  if (v < 2) s = migrateV1toV2(s);

  // Ensure every key from defaultState exists, additively.
  s = mergeDefaults(s, defaultState);
  s.schemaVersion = SCHEMA_VERSION;
  return s;
}

function mergeDefaults(target, defaults) {
  if (Array.isArray(defaults)) return target ?? defaults;
  if (defaults && typeof defaults === "object") {
    const out = { ...defaults, ...(target || {}) };
    for (const k of Object.keys(defaults)) {
      if (defaults[k] && typeof defaults[k] === "object" && !Array.isArray(defaults[k])) {
        out[k] = mergeDefaults(target?.[k], defaults[k]);
      }
    }
    return out;
  }
  return target ?? defaults;
}

function migrateV1toV2(s) {
  const out = {
    ...defaultState,
    schemaVersion: 2,
    todayDate: s.todayDate || null,
    northStar: s.northStar ?? defaultState.northStar,
    habitLog: s.habitLog ?? defaultState.habitLog,
    habitNoLog: s.habitNoLog ?? defaultState.habitNoLog,
    upcoming: s.upcoming ?? defaultState.upcoming,
    metrics: { ...defaultState.metrics, ...(s.metrics || {}) },
    routines: s.routines ?? [],
  };

  // Carry drilldown content over to projects.* — same shape, new home.
  const dd = s.drilldowns || {};
  out.projects = { ...defaultState.projects };
  if (dd.businesses) {
    out.projects.work = {
      ...out.projects.work,
      businesses: dd.businesses.map((b) => ({ ...b, key: b.key || slug(b.name), goals: b.goals || [] })),
    };
  }
  if (dd.travel) {
    out.projects.travel = {
      ...out.projects.travel,
      trips: dd.travel.trips || out.projects.travel.trips,
    };
  }
  if (dd.relationships) {
    out.projects.relationships = { ...out.projects.relationships, contacts: dd.relationships };
  }
  if (dd.reading) {
    out.projects.learning = { ...out.projects.learning, reading: dd.reading };
  }
  if (dd.spanish) {
    out.projects.learning = { ...out.projects.learning, spanish: dd.spanish };
  }

  // Old top-level journal string → first journal entry, if non-empty.
  if (typeof s.journal === "string" && s.journal.trim()) {
    out.projects.journal = {
      ...out.projects.journal,
      entries: [
        { id: 1, date: new Date().toISOString().slice(0, 10), text: s.journal, isPrivate: false },
        ...(out.projects.journal.entries || []),
      ],
    };
  }

  // Old goals (current/target progress) — preserved on projects.work as
  // qualitative goals so they aren't lost.
  if (Array.isArray(s.goals) && s.goals.length) {
    const carried = s.goals.map((g) => ({
      id: g.id || `legacy-${Math.random().toString(36).slice(2, 7)}`,
      label: g.label,
      target: g.target ?? null,
      priorities: [],
    }));
    out.projects.work = {
      ...out.projects.work,
      goals: [...(out.projects.work.goals || []), ...carried],
    };
  }

  return out;
}

const slug = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

// ----- load ----------------------------------------------------------------
export function loadFromCache() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function loadFromCloud() {
  if (!isSupabaseEnabled()) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("dashboard_state")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return migrate(data.state);
}

// ----- save ----------------------------------------------------------------
let pendingTimer = null;

export function saveState(state) {
  // Write-through localStorage first — instant + offline-safe.
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // QuotaExceeded — ignore; cloud will still receive it.
  }
  // Debounce cloud writes; rapid edits coalesce.
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => writeCloud(state), 400);
}

async function writeCloud(state) {
  if (!isSupabaseEnabled()) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    queueWrite(state);
    return;
  }
  const { error } = await supabase
    .from("dashboard_state")
    .upsert({ user_id: user.id, state, updated_at: new Date().toISOString() });
  if (error) queueWrite(state);
}

function queueWrite(state) {
  try {
    localStorage.setItem(LS_QUEUE_KEY, JSON.stringify({ state, queuedAt: Date.now() }));
  } catch {
    // ignore
  }
}

export async function flushQueue() {
  if (!isSupabaseEnabled()) return;
  const raw = localStorage.getItem(LS_QUEUE_KEY);
  if (!raw) return;
  try {
    const { state } = JSON.parse(raw);
    await writeCloud(state);
    localStorage.removeItem(LS_QUEUE_KEY);
  } catch {
    // ignore
  }
}
