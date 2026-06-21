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
  if (v < 5) s = migrateV4toV5(s);
  if (v < 6) s = migrateV5toV6(s);
  if (v < 7) s = migrateV6toV7(s);
  if (v < 8) s = migrateV7toV8(s);
  if (v < 9) s = migrateV8toV9(s);

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

// v4 → v5: schema finalisation pass.
// - Remove unused `metrics` and `routines` (habits now data-defined; the
//   `habits` definitions array is backfilled by mergeDefaults).
// - Work: drop per-business `value`.
// - Health: drop stored food `images` (photo→macro estimation still works,
//   the photo just isn't persisted).
// - Finance: fold debts/savings/investments → `accounts` (each with a 1-entry
//   history) and monthlyRevenue → `revenue` (tagged by project, with history).
//   The netWorthHistory / revenueHistory rollups are kept as-is.
// - Travel: drop trip `sub`/`days` and the `recommender` slot; sublet income
//   money-object → plain EUR number.
// - Journal: rename entry image `dataUrl` → `url`; wrap `topOfMind` strings as
//   `{ id, text }`.
// - Relationships: parse legacy `last` string → `lastContact` (ISO) +
//   `channel`; drop `stale`; default `cadenceDays`.
function migrateV4toV5(s) {
  const out = JSON.parse(JSON.stringify(s));
  const todayISO = new Date().toISOString().slice(0, 10);
  const currentMonth = todayISO.slice(0, 7);

  // Always-EUR coercion, tolerating legacy money snapshots.
  const toEur = (v) => {
    if (typeof v === "number") return v;
    if (v && typeof v === "object") return v.eur ?? v.amount ?? 0;
    return parseFloat(v) || 0;
  };

  delete out.metrics;
  delete out.routines;

  // ----- Work: drop per-business value -----
  if (out.projects?.work?.businesses) {
    out.projects.work.businesses = out.projects.work.businesses.map((b) => {
      const { value, ...rest } = b;
      return rest;
    });
  }

  // ----- Health: drop stored food images -----
  const food = out.projects?.health?.food;
  if (Array.isArray(food)) {
    out.projects.health.food = food.map((e) => {
      const { images, ...rest } = e;
      return rest;
    });
  }

  // ----- Finance: accounts + revenue -----
  const fin = out.projects?.finance;
  if (fin && !Array.isArray(fin.accounts)) {
    const snapDate =
      fin.netWorthHistory?.[fin.netWorthHistory.length - 1]?.date || todayISO;
    const accounts = [];
    let aid = 1;
    const carry = (list, type) => {
      for (const it of list || []) {
        accounts.push({
          id: aid++,
          name: it.name ?? it.account ?? it.label ?? "Account",
          type,
          history: [{ date: snapDate, eur: toEur(it.amount ?? it.balance ?? it.value) }],
        });
      }
    };
    carry(fin.savings, "saving");
    carry(fin.investments, "investment");
    carry(fin.debts, "debt");
    fin.accounts = accounts;

    const snapMonth =
      fin.revenueHistory?.[fin.revenueHistory.length - 1]?.month || currentMonth;
    const projectFor = (name) =>
      ({
        "Unify Digital": "unify",
        "Sears Melvin": "searsMelvin",
        BODDY: "boddy",
        Churchill: "churchill",
        "Churchill Memorials": "churchill",
      }[name] ?? null);
    fin.revenue = (fin.monthlyRevenue || []).map((r, i) => ({
      id: r.id ?? i + 1,
      name: r.name ?? "Revenue",
      project: projectFor(r.name),
      history: [{ month: snapMonth, eur: toEur(r.amount) }],
    }));

    delete fin.savings;
    delete fin.investments;
    delete fin.debts;
    delete fin.monthlyRevenue;
  }

  // ----- Travel -----
  const travel = out.projects?.travel;
  if (travel) {
    if (Array.isArray(travel.trips)) {
      travel.trips = travel.trips.map((t) => {
        const { sub, days, ...rest } = t;
        return rest;
      });
    }
    if (Array.isArray(travel.sublets)) {
      travel.sublets = travel.sublets.map((sl) => ({
        ...sl,
        income: toEur(sl.income),
      }));
    }
    delete travel.recommender;
  }

  // ----- Journal -----
  const journal = out.projects?.journal;
  if (journal) {
    if (Array.isArray(journal.entries)) {
      journal.entries = journal.entries.map((e) =>
        Array.isArray(e.images)
          ? {
              ...e,
              images: e.images.map((img) => ({
                id: img.id,
                url: img.url ?? img.dataUrl ?? "",
              })),
            }
          : e
      );
    }
    if (Array.isArray(journal.topOfMind)) {
      journal.topOfMind = journal.topOfMind.map((t, i) =>
        typeof t === "string" ? { id: i + 1, text: t } : t
      );
    }
  }

  // ----- Relationships -----
  const rel = out.projects?.relationships;
  if (rel && Array.isArray(rel.contacts)) {
    rel.contacts = rel.contacts.map((c) => {
      if (c.lastContact !== undefined) return c; // already v5
      const { last, stale, ...rest } = c;
      let channel = "";
      let daysAgo = null;
      if (typeof last === "string") {
        const parts = last.split("·").map((p) => p.trim());
        const recency = parts[0] || "";
        channel = parts[1] || "";
        if (/today/i.test(recency)) daysAgo = 0;
        else if (/yesterday/i.test(recency)) daysAgo = 1;
        else {
          const m = recency.match(/(\d+)\s*day/i);
          if (m) daysAgo = parseInt(m[1], 10);
        }
      }
      let lastContact = null;
      if (daysAgo != null) {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        lastContact = d.toISOString().slice(0, 10);
      }
      return { ...rest, lastContact, channel, cadenceDays: 7 };
    });
  }

  // ----- Upcoming: best-effort date → ISO -----
  if (Array.isArray(out.upcoming)) {
    out.upcoming = out.upcoming.map((u) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(u.date || "")) return u;
      const dayMatch = String(u.date || "").match(/(\d{1,2})/);
      if (dayMatch) {
        const day = String(parseInt(dayMatch[1], 10)).padStart(2, "0");
        return { ...u, date: `${currentMonth}-${day}` };
      }
      return { ...u, date: null };
    });
  }

  return out;
}

// v5 → v6: drop the stored finance rollups. netWorthHistory / revenueHistory
// are now derived from the per-line account/revenue histories (lib/finance.js),
// so the stored copies are dead weight that could only drift.
function migrateV5toV6(s) {
  const out = JSON.parse(JSON.stringify(s));
  if (out.projects?.finance) {
    delete out.projects.finance.netWorthHistory;
    delete out.projects.finance.revenueHistory;
  }
  return out;
}

// v6 → v7: remove BODDY. Matched on the seeded `boddy` business key and the
// "BODDY" revenue line so a user-renamed entry wouldn't be caught.
function migrateV6toV7(s) {
  const out = JSON.parse(JSON.stringify(s));
  const work = out.projects?.work;
  if (work?.businesses) {
    work.businesses = work.businesses.filter((b) => b.key !== "boddy");
  }
  const fin = out.projects?.finance;
  if (fin?.revenue) {
    fin.revenue = fin.revenue.filter((r) => r.project !== "boddy" && r.name !== "BODDY");
  }
  return out;
}

// v7 → v8: V2 overhaul. Adds the flat `tasks` list, the top-level `finance`
// lens container, and `ui.view`. All additive — mergeDefaults seeds the new
// keys from defaultState; this step just guarantees a `finance.transactions`
// array and an explicit `ui.view` exist on older blobs.
function migrateV7toV8(s) {
  const out = JSON.parse(JSON.stringify(s));
  if (!Array.isArray(out.tasks)) out.tasks = defaultState.tasks;
  if (!out.finance || typeof out.finance !== "object" || Array.isArray(out.finance)) {
    out.finance = { ...defaultState.finance };
  }
  if (!Array.isArray(out.finance.transactions)) out.finance.transactions = [];
  out.ui = { ...(out.ui || {}), view: out.ui?.view || "tasks", theme: out.ui?.theme ?? null };
  return out;
}

// v8 → v9: refresh the seeded demo tasks to Arin's real task list — but only
// when they still look like the untouched original placeholders, so a curated
// list is never clobbered.
function migrateV8toV9(s) {
  const out = JSON.parse(JSON.stringify(s));
  const tasks = Array.isArray(out.tasks) ? out.tasks : [];
  const DEMO_SIGNATURES = ["Chase 2 stale permits", "Quote follow-up — Mrs Doyle", "Weekly review — W19", "Order replacement for kitchen"];
  const looksLikeDemo = tasks.some((t) => DEMO_SIGNATURES.includes(t.text));
  if (tasks.length === 0 || looksLikeDemo) out.tasks = defaultState.tasks;
  return out;
}

// Daily rollover. Runs on every load (not version-gated): when the stored
// `todayDate` isn't today, reset the day-scoped fields and stamp the new date.
// Today's Top 3 are ad-hoc daily priorities, so they clear each morning; the
// originating Work todos keep their stars. Dated data (journal, habits, food,
// finance history) is untouched.
export function rollDaily(state) {
  if (!state || typeof state !== "object") return state;
  const today = new Date().toISOString().slice(0, 10);
  if (state.todayDate === today) return state;
  return {
    ...state,
    todayDate: today,
    topThree: (state.topThree || []).map((slot) => ({
      ...slot,
      title: "",
      projectKey: null,
      business: null,
      done: false,
    })),
  };
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
  const storedVersion = data.state?.schemaVersion || 1;
  const migrated = migrate(data.state);
  // If migrate() upgraded the blob (e.g. v7 → v8 added tasks/finance/ui),
  // persist the new shape immediately so the stored row never lags the code.
  if (storedVersion !== migrated.schemaVersion) saveState(migrated);
  return migrated;
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
