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
  if (v < 3) s = migrateV2toV3(s);
  if (v < 4) s = migrateV3toV4(s);

  // Ensure every key from defaultState exists, additively.
  s = mergeDefaults(s, defaultState);
  s.schemaVersion = SCHEMA_VERSION;

  // One-time refresh: replace the legacy north-star copy if it still matches
  // the pre-2027 default. Editable by user, so any custom value is preserved.
  const LEGACY_NORTH_STAR =
    "Build Sears Melvin into the UK's most trusted memorial mason while running a healthy, multilingual, well-travelled life from Barcelona.";
  if (s.northStar === LEGACY_NORTH_STAR) {
    s.northStar = defaultState.northStar;
  }

  // Run regardless of source version: drop food images older than 30 days so
  // localStorage stays under quota. Macros + text + date all stay forever;
  // only the base64 image data gets cleared.
  if (s.projects?.health?.food?.length) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffISO = cutoff.toISOString().slice(0, 10);
    s.projects.health.food = s.projects.health.food.map((entry) =>
      entry.images?.length && entry.date < cutoffISO
        ? { ...entry, images: [] }
        : entry
    );
  }

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

// v2 → v3: Finance simplification.
// - monthlyRevenue: object { ud, sm, boddy, personalTraining } → array of
//   { id, name, amount } in EUR.
// - debts/savings/investments: any { amount: {amount,ccy,eur,...} } money
//   snapshots → plain EUR numbers as `amount`.
// - savings.balance / investments.value → unified `amount` field.
function migrateV2toV3(s) {
  const out = JSON.parse(JSON.stringify(s));
  const fin = out.projects?.finance;
  if (!fin) return out;

  // Money snapshot → plain EUR number.
  const toEur = (v) => {
    if (typeof v === "number") return v;
    if (v && typeof v === "object") return v.eur ?? v.amount ?? 0;
    return 0;
  };

  if (Array.isArray(fin.debts)) {
    fin.debts = fin.debts.map((d) => ({
      id: d.id,
      name: d.name ?? d.label ?? "Debt",
      amount: toEur(d.amount),
    }));
  }
  if (Array.isArray(fin.savings)) {
    fin.savings = fin.savings.map((sv) => ({
      id: sv.id,
      name: sv.name ?? sv.account ?? "Account",
      amount: toEur(sv.balance ?? sv.amount),
    }));
  }
  if (Array.isArray(fin.investments)) {
    fin.investments = fin.investments.map((iv) => ({
      id: iv.id,
      name: iv.name ?? iv.account ?? "Account",
      amount: toEur(iv.value ?? iv.amount),
    }));
  }

  // monthlyRevenue: object → array, preserving labels.
  if (fin.monthlyRevenue && !Array.isArray(fin.monthlyRevenue)) {
    const labels = {
      ud: "Unify Digital",
      sm: "Sears Melvin",
      boddy: "BODDY",
      personalTraining: "Personal training",
    };
    const next = [];
    let i = 1;
    for (const [k, v] of Object.entries(fin.monthlyRevenue)) {
      let amount = 0;
      if (v && typeof v === "object") {
        if ("manualOverride" in v && v.manualOverride != null) amount = toEur(v.manualOverride);
        else if ("amount" in v) amount = toEur(v.amount);
      } else if (typeof v === "number") {
        amount = v;
      }
      next.push({ id: i++, name: labels[k] || k, amount });
    }
    fin.monthlyRevenue = next;
  }

  // Drop fields that no longer have UI; schema cleanliness.
  delete fin.taxTimeline;
  delete fin.displaySettings;

  // Work businesses: reorder to (unify, searsMelvin, churchill, boddy) and
  // refresh name/value/meta IF they still match the v2 defaults (i.e. user
  // has not customised them). User-added businesses with non-standard keys
  // are preserved at the end. Also ensures a `todos: []` array exists.
  const work = out.projects?.work;
  if (work?.businesses) {
    const v2Defaults = {
      searsMelvin: { name: "Sears Melvin", value: "£3,240", meta: "2 orders · 5 enquiries" },
      churchill: { name: "Churchill", value: "£18,420", meta: "14 orders · 6 permits pending" },
      boddy: { name: "BODDY", value: "CHF 84k", meta: "12 deals · 3 close this week" },
      unify: { name: "Unify Digital", value: "Mason App", meta: "65% to launch" },
    };
    const v3Updates = {
      unify: { name: "Unify Digital", value: "£8,343", meta: "Mason App · 65% to launch" },
      searsMelvin: { name: "Sears Melvin", value: "0 orders", meta: "5 enquiries" },
      churchill: { name: "Churchill Memorials", value: "£5,800", meta: "14 orders · 6 permits pending" },
      boddy: { name: "BODDY", value: "Support team", meta: "12 deals · 3 close this week" },
    };
    const matchesOld = (b) => {
      const old = v2Defaults[b.key];
      return old && b.name === old.name && b.value === old.value && b.meta === old.meta;
    };
    const updated = work.businesses.map((b) => {
      const next = v3Updates[b.key];
      const refreshed = next && matchesOld(b) ? { ...b, ...next } : b;
      return { ...refreshed, todos: refreshed.todos || [] };
    });
    const order = ["unify", "searsMelvin", "churchill", "boddy"];
    const known = order.map((k) => updated.find((b) => b.key === k)).filter(Boolean);
    const custom = updated.filter((b) => !order.includes(b.key));
    work.businesses = [...known, ...custom];
  }

  return out;
}

// v3 → v4: Health redesign.
// - Flatten `projects.health.markers.{weight,waist}` to top-level
//   `projects.health.{weight,waist}`.
// - Convert legacy waist `{date, value}` → `{date, cm}`.
// - Drop the unused `markers.{sleep,training}` and `lifts` arrays.
// - Ensure `food: []` and `targets: {...}` exist.
function migrateV3toV4(s) {
  const out = JSON.parse(JSON.stringify(s));
  const h = out.projects?.health;
  if (!h) return out;

  if (h.markers) {
    if (!h.weight && Array.isArray(h.markers.weight)) {
      h.weight = h.markers.weight;
    }
    if (!h.waist && Array.isArray(h.markers.waist)) {
      h.waist = h.markers.waist.map((row) => ({
        date: row.date,
        cm: typeof row.cm === "number" ? row.cm : (row.value ?? 0),
      }));
    }
    delete h.markers;
  }

  // Backfill any waist row that still uses {date, value} shape.
  if (Array.isArray(h.waist)) {
    h.waist = h.waist.map((row) =>
      row.cm == null && row.value != null
        ? { date: row.date, cm: row.value }
        : row
    );
  }

  if (!Array.isArray(h.food)) h.food = [];
  if (!h.targets || typeof h.targets !== "object") {
    h.targets = {
      weightKg: 78,
      waistCm: 85,
      calories: 2200,
      proteinG: 160,
      direction: "cut",
    };
  }

  // Drop fields the new component doesn't render. Schema cleanliness.
  delete h.lifts;

  return out;
}

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
