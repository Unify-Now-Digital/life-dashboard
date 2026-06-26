// "Calma" daily Spanish-session logic — streaks, XP, daily goal and spaced
// repetition. Kept out of the component (same reasoning as sentences.js /
// habits.js): the scoring and scheduling rules are the non-obvious part and
// benefit from living in one tunable place.
//
// Progress is persisted inside the cloud-synced app state under
//   state.projects.learning.spanish.practice
// so it survives across devices with no extra plumbing. Shape:
//   { xp, todayXP, todayDate, goal, startDate,
//     streakDates:[ISO…], mastery:{ id:{lvl,due,seen} },
//     credited:{ fieldId:1 }, celebratedDate }

import { normalizeSentence } from "./sentences";

// Spaced-repetition intervals, indexed by the item's NEW mastery level (0–5).
export const INTERVALS = [1, 1, 2, 4, 8, 16];

// Max brand-new cards introduced per deck per day (the rest of a session is
// due reviews), so progress is paced rather than dumping every card at once.
export const NEW_PER_DAY = 6;

export const DECK_ORDER = ["verb", "phrase", "sentence", "convo"];
export const DECK_META = {
  verb: { label: "Verbos" },
  phrase: { label: "Frases" },
  sentence: { label: "Oraciones" },
  convo: { label: "Charla" },
};

// ----- dates -----------------------------------------------------------------
export function todayISO(d) {
  d = d || new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return todayISO(d);
}
export function daysBetween(fromIso, toIso) {
  const a = new Date(fromIso + "T00:00:00");
  const b = new Date(toIso + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

// ----- lenient comparison ----------------------------------------------------
// Lowercase, trim, strip accents + punctuation, collapse whitespace — so
// "tendre" matches "tendré". Reuses the shared sentence normaliser.
export const norm = normalizeSentence;
export function answerMatches(got, want) {
  const g = norm(got);
  return g !== "" && g === norm(want);
}

// ----- persistent-state helpers ---------------------------------------------
export function freshPractice(goal = 60) {
  return {
    xp: 0,
    todayXP: 0,
    todayDate: todayISO(),
    goal,
    startDate: todayISO(),
    streakDates: [],
    mastery: {},
    credited: {},
    celebratedDate: null,
    introduced: { date: todayISO(), byDeck: {} },
  };
}

// Defensively fill in any missing fields on a loaded practice object, and roll
// today's XP over when the date has changed. Returns a NEW object only when
// something changed, so callers can skip a needless write.
export function normalizePractice(p, goal = 60) {
  const base = freshPractice(goal);
  const next = { ...base, ...(p || {}) };
  let changed = !p;
  const t = todayISO();
  if (next.todayDate !== t) {
    next.todayDate = t;
    next.todayXP = 0;
    changed = true;
  }
  if (!next.startDate) {
    next.startDate = t;
    changed = true;
  }
  // Reset the daily new-card intake counter on rollover.
  if (!next.introduced || next.introduced.date !== t) {
    next.introduced = { date: t, byDeck: {} };
    changed = true;
  }
  return changed ? next : p;
}

// ----- streak ----------------------------------------------------------------
// Consecutive practised days ending today — or yesterday, since today not yet
// being practised shouldn't break the streak until the day actually ends.
export function streakLen(dates) {
  const set = new Set(dates || []);
  let cur = todayISO();
  if (!set.has(cur)) cur = addDays(cur, -1);
  let n = 0;
  while (set.has(cur)) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

// Last 14 days as { iso, on, today } for the streak chain.
export function chain14(dates) {
  const set = new Set(dates || []);
  const t = todayISO();
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const day = addDays(t, -i);
    out.push({ iso: day, on: set.has(day), today: day === t });
  }
  return out;
}

// "Día N" journey counter, derived from the account's first session.
export function dayNumber(p) {
  return daysBetween(p.startDate || todayISO(), todayISO()) + 1;
}

// ----- spaced repetition -----------------------------------------------------
export function isDue(p, id) {
  const m = p.mastery && p.mastery[id];
  if (!m || !m.due) return true; // new / never-seen items are always due
  return m.due <= todayISO();
}

// ----- mutations (operate in place on a cloned practice object) --------------
export function gainXP(p, n) {
  p.xp += n;
  const t = todayISO();
  if (p.todayDate !== t) {
    p.todayDate = t;
    p.todayXP = 0;
  }
  p.todayXP += n;
  if (!p.streakDates.includes(t)) p.streakDates.push(t);
}
// Award XP for a field/item exactly once, ever.
export function credit(p, fid, n) {
  if (!p.credited[fid]) {
    p.credited[fid] = 1;
    gainXP(p, n);
    return n;
  }
  return 0;
}
// Correct answer → level up (cap 5) and reschedule by the new level's interval.
export function masterUp(p, id) {
  const m = p.mastery[id] || { lvl: 0 };
  m.lvl = Math.min(5, (m.lvl || 0) + 1);
  m.seen = 1;
  m.due = addDays(todayISO(), INTERVALS[m.lvl]);
  p.mastery[id] = m;
}
// Reveal / skip → seen, comes back tomorrow, no level change.
export function markSeen(p, id) {
  const m = p.mastery[id] || { lvl: 0 };
  m.seen = 1;
  m.due = addDays(todayISO(), 1);
  p.mastery[id] = m;
}
// Struggled (wrong, then corrected / revealed / skipped) → drop back to the
// learning level so it returns tomorrow and ranks as weak. Absolute writes →
// idempotent. `lapses` is informational.
export function resetToLearning(p, id) {
  const m = p.mastery[id] || { lvl: 0 };
  m.lvl = 0;
  m.seen = 1;
  m.due = addDays(todayISO(), 1);
  m.lapses = (m.lapses || 0) + 1;
  p.mastery[id] = m;
}

// ----- daily rotation + queue ordering ---------------------------------------
// Stable-per-day hash of an id → [0,1). Different each day, same within a day,
// so card order rotates daily without a stored shuffle.
function hash01(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export const dayKey = (id) => hash01(id + ":" + todayISO());

// New cards already started today for a deck (caps the daily intake).
export function introducedToday(p, deckType) {
  const intro = p && p.introduced;
  if (!intro || intro.date !== todayISO()) return 0;
  return (intro.byDeck && intro.byDeck[deckType]) || 0;
}
export function noteIntroduced(p, deckType) {
  const t = todayISO();
  if (!p.introduced || p.introduced.date !== t) p.introduced = { date: t, byDeck: {} };
  p.introduced.byDeck[deckType] = (p.introduced.byDeck[deckType] || 0) + 1;
}

// Order a deck's cards for the session: due reviews first (most-overdue +
// lowest mastery, ties rotated daily), then up to the day's remaining quota of
// brand-new cards. `all` (Repasar igual) includes everything, uncapped.
export function orderDueQueue(deckCards, p, deckType, { all = false } = {}) {
  const today = todayISO();
  const mastery = (p && p.mastery) || {};
  const reviews = [];
  const news = [];
  for (const it of deckCards || []) {
    const m = mastery[it.id];
    if (m && m.seen) {
      if (all || isDue(p, it.id)) reviews.push(it);
    } else {
      news.push(it);
    }
  }
  reviews.sort((a, b) => {
    const ma = mastery[a.id] || {};
    const mb = mastery[b.id] || {};
    const oa = ma.due && ma.due < today ? 0 : 1;
    const ob = mb.due && mb.due < today ? 0 : 1;
    if (oa !== ob) return oa - ob;
    if ((ma.lvl || 0) !== (mb.lvl || 0)) return (ma.lvl || 0) - (mb.lvl || 0);
    return dayKey(a.id) - dayKey(b.id);
  });
  news.sort((a, b) => dayKey(a.id) - dayKey(b.id));
  const cap = all ? news.length : Math.max(0, NEW_PER_DAY - introducedToday(p, deckType));
  return [...reviews.map((it) => it.id), ...news.slice(0, cap).map((it) => it.id)];
}
// Set the once-per-day "celebrated" flag when today's goal is first crossed.
// Returns true the one time it flips.
export function maybeCelebrate(p) {
  const t = todayISO();
  if ((p.todayXP || 0) >= p.goal && p.celebratedDate !== t) {
    p.celebratedDate = t;
    return true;
  }
  return false;
}

// ----- deck building ---------------------------------------------------------
// Map the existing Spanish content (verbs / phrases / sentences / conversation
// chunks) into the four drill decks the session runs. Item ids are stable and
// namespaced so mastery/credited survive content edits.
export function buildDecks(sp) {
  sp = sp || {};
  const verb = (sp.verbs || []).map((v) => ({
    type: "verb",
    id: `v:${v.id}`,
    eyebrow: "Verbo",
    title: v.infinitive,
    sub: `${v.en} · conjugá la forma yo`,
    fields: [
      { key: "past", label: "pretérito", fid: `v:${v.id}:past`, answer: v.forms.past },
      { key: "present", label: "presente", fid: `v:${v.id}:present`, answer: v.forms.present },
      { key: "future", label: "futuro", fid: `v:${v.id}:future`, answer: v.forms.future },
    ],
    bonusFid: `v:${v.id}:bonus`,
  }));
  const phrase = (sp.phrases || []).map((p) => ({
    type: "single",
    id: `p:${p.id}`,
    eyebrow: "Frase",
    title: p.en,
    sub: "¿cómo se dice?",
    field: { fid: `p:${p.id}:a`, answer: p.es },
    xp: 8,
  }));
  const sentence = (sp.sentences || []).map((s) => ({
    type: "single",
    id: `s:${s.id}`,
    eyebrow: "Oración",
    title: s.en,
    sub: "traducí la oración",
    field: { fid: `s:${s.id}:a`, answer: s.es },
    xp: 10,
  }));
  // Conversations: the existing chunks are multi-turn dialogues. Derive a
  // simple "they ask → reveal a natural reply" card from the first exchange.
  const convo = (sp.chunks || [])
    .map((c) => {
      const them = (c.turns || []).find((t) => t.speaker === "them");
      const you = (c.turns || []).find((t) => t.speaker === "you");
      const answer = you && you.options && you.options[0] ? you.options[0].es : "";
      return {
        type: "convo",
        id: `c:${c.id}`,
        eyebrow: "Conversación",
        title: them ? them.es : c.situation,
        sub: "pensá cómo responderías",
        answer,
        fid: `c:${c.id}:a`,
        xp: 6,
      };
    })
    .filter((c) => c.answer);
  return { verb, phrase, sentence, convo };
}
