// Sentence-practice logic: scoring, the smoothed completion rate that drives
// rotation, word-diff feedback, and building a weighted practice session.
//
// Kept here (rather than in the component) for the same reason habit logic
// lives in habits.js — it's the non-obvious part and benefits from being in
// one tunable place. All functions read defensively so they work on legacy
// sentence objects that predate the rate/attempts/lastSeen fields.

// ----- text normalisation ---------------------------------------------------
// Shared by the produce task and the word-diff feedback. Case/accent-folding.
export function normalize(s) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Sentence comparison: case/accent-insensitive, punctuation-agnostic, spaces
// collapsed — so only the words + order matter.
export function normalizeSentence(s) {
  return normalize(s)
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ----- scoring ---------------------------------------------------------------
// Quality of one produce attempt, in [0,1]. A clean first try scores 1.0;
// revealing hint words and needing repeated checks erode it; a never-correct
// attempt scores 0.
export function scoreSentenceAttempt({ correct, hintCount, wordCount, checkCount }) {
  if (!correct) return 0;
  const hintFrac = wordCount > 0 ? (hintCount || 0) / wordCount : 0;
  const extraChecks = Math.max(0, (checkCount || 1) - 1);
  return clamp01(1 - 0.6 * hintFrac - 0.15 * extraChecks);
}

// Fold a new [0,1] score into the running completion rate via an exponential
// moving average so recent performance dominates (mastery can decay/recover).
// The first graded attempt seeds the rate outright.
export function nextRate(prevRate, prevAttempts, score) {
  if (!prevAttempts) return clamp01(score);
  const alpha = 0.4;
  return clamp01((prevRate || 0) * (1 - alpha) + clamp01(score) * alpha);
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

// ----- word-diff feedback ----------------------------------------------------
// Positional comparison of the user's answer against the target. Good enough
// for these short sentences and far more useful than just dumping the answer:
// each target word is flagged ok/missed, and any surplus typed words returned.
export function diffWords(input, target) {
  const got = normalizeSentence(input).split(" ").filter(Boolean);
  const want = normalizeSentence(target).split(" ").filter(Boolean);
  const display = (target || "").split(/\s+/).filter(Boolean);
  const words = display.map((w, i) => ({ word: w, ok: got[i] != null && got[i] === want[i] }));
  const extra = got.length > want.length ? got.slice(want.length) : [];
  return { words, extra };
}

// ----- session building ------------------------------------------------------
// Weight: unseen sentences surface strongly; otherwise weight rises as the
// completion rate falls, with a low-confidence boost and a damp for sentences
// practised in the last few hours (so a session interleaves rather than
// hammering one weak item).
function weightFor(s, now) {
  const attempts = s.attempts || 0;
  if (attempts === 0) return 6;
  let w = 1 + (1 - (s.rate || 0)) * 4; // 1 (mastered) .. 5 (always wrong)
  if (attempts < 3) w += 1; // still establishing confidence
  if (s.lastSeen && now - s.lastSeen < 6 * 3600e3) w *= 0.5; // rest recently-seen
  return Math.max(0.05, w);
}

// Pick the task type for a sentence at a given queue position. Weak/unseen
// sentences get the hardest task (full production); stronger ones get scramble
// or comprehension for variety. Position parity interleaves the types so the
// same task doesn't run several times back to back.
function taskFor(s, position, canComprehend) {
  const attempts = s.attempts || 0;
  const rate = s.rate || 0;
  if (attempts === 0 || rate < 0.4) return "produce";
  if (rate < 0.75) return position % 2 === 0 ? "produce" : "scramble";
  if (canComprehend) return position % 2 === 0 ? "scramble" : "comprehend";
  return "scramble";
}

// Weighted sample WITHOUT replacement → a full-deck pass ordered weak-first-ish
// with randomness. Returns [{ sentence, task }].
export function buildSession(sentences, now = Date.now()) {
  const list = (sentences || []).filter(Boolean);
  const canComprehend = list.length >= 3; // need distractors for multiple choice
  const pool = list.map((s) => ({ s, w: weightFor(s, now) }));
  const ordered = [];
  while (pool.length) {
    const total = pool.reduce((a, p) => a + p.w, 0);
    let r = Math.random() * total;
    let idx = 0;
    while (idx < pool.length - 1 && (r -= pool[idx].w) > 0) idx++;
    ordered.push(pool[idx].s);
    pool.splice(idx, 1);
  }
  return ordered.map((s, i) => ({ sentence: s, task: taskFor(s, i, canComprehend) }));
}
