import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  buildDecks,
  normalizePractice,
  todayISO,
  streakLen,
  chain14,
  dayNumber,
  norm,
  answerMatches,
  credit,
  masterUp,
  resetToLearning,
  noteIntroduced,
  orderDueQueue,
  logDaily,
  dailyStats,
  maybeCelebrate,
  DECK_ORDER,
  DECK_META,
} from "../lib/calma.js";
import { mainHref } from "../lib/host.js";

// "Calma" — the daily Spanish session (design V2). A single warm screen that
// drills one of four decks (Verbos / Frases / Oraciones / Charla) one card at a
// time, with a streak chain, a daily-goal ring, XP, spaced repetition and a
// confetti celebration when the goal is hit. Persistent progress lives in
// state.projects.learning.spanish.practice (see lib/calma.js); the in-progress
// session view (answers / reveals / confetti) is transient local state.
//
// This view has its own warm palette by design — it's a deliberately distinct,
// self-contained experience on the focused Spanish subdomain, not the
// notion-clean dashboard. Tokens are kept local to this file.

const T = {
  page: "#e8e5de",
  cardOuter: "#f7f4ee",
  cardBorder: "#e6dfd2",
  white: "#fff",
  goalStrip: "#fffdf8",
  ink: "#23201a",
  muted: "#8a8170",
  muted2: "#94896f",
  faint: "#a59b88",
  faint2: "#b3a994",
  faint3: "#b9ab90",
  innerBorder: "#ece4d4",
  inputBorder: "#e4ddcf",
  dashBorder: "#e2d9c8",
  amber: "#c8861f",
  amberText: "#b06b1a",
  amberText2: "#9a6a1a",
  amberText3: "#8a6a1d",
  dotEmpty: "#ece4d2",
  dotBorder: "#8a5a12",
  track: "#efe7d6",
  fieldLabel: "#a89d85",
  serif: "'Instrument Serif', Georgia, serif",
  ui: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  mono: "'Spline Sans Mono', ui-monospace, SFMono-Regular, monospace",
};

const CONFETTI_COLORS = ["#ff5a3c", "#ffce3c", "#3ccf91", "#5a7bff", "#c64cff", "#f59e0b"];
const DOW = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const KEYFRAMES = `
  @keyframes calmaFall{0%{transform:translateY(-30px) rotate(0)}100%{transform:translateY(108vh) rotate(620deg);opacity:.15}}
  @keyframes calmaPop{0%{transform:scale(.7);opacity:0}55%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}
  @keyframes calmaFloatUp{0%{transform:translateY(6px) scale(.9);opacity:0}25%{transform:translateY(-2px) scale(1);opacity:1}100%{transform:translateY(-46px);opacity:0}}
  @keyframes calmaSoftIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes calmaFlame{0%,100%{transform:scale(1) rotate(-1deg)}50%{transform:scale(1.06) rotate(1deg)}}
`;

function prefersReducedMotion() {
  try {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// Monospace input styling, recoloured by check result.
function inputStyle(result) {
  const s = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: `1.5px solid ${T.inputBorder}`,
    borderRadius: 10,
    background: "#fffdf9",
    color: "#26221c",
    fontFamily: T.mono,
    fontSize: 16,
    outline: "none",
  };
  if (result === "correct") {
    s.borderColor = "#1f9d76";
    s.background = "#ecf9f3";
    s.color = "#0e6b4f";
  } else if (result === "wrong") {
    s.borderColor = "#d9594d";
    s.background = "#fcefed";
  } else if (result === "revealed") {
    s.borderColor = "#c69a39";
    s.background = "#fbf5e8";
    s.color = "#8a6a1d";
  }
  return s;
}

const btn = {
  primary: {
    flex: 1,
    padding: 13,
    border: "none",
    borderRadius: 12,
    background: T.amber,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: T.ui,
  },
  dark: {
    flex: 1,
    padding: 13,
    border: "none",
    borderRadius: 12,
    background: T.ink,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: T.ui,
  },
  ghost: {
    padding: "13px 18px",
    border: `1px solid ${T.dashBorder}`,
    borderRadius: 12,
    background: "#fff",
    color: T.muted,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: T.ui,
  },
  text: {
    padding: "13px 14px",
    border: "none",
    borderRadius: 12,
    background: "transparent",
    color: T.faint2,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: T.ui,
  },
};

function ProgressRing({ pct, size = 84 }) {
  const sw = Math.round(size * 0.107);
  const r = size / 2 - sw / 2 - 1;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = `${(circ * Math.min(1, pct / 100)).toFixed(1)} ${circ.toFixed(1)}`;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={T.track} strokeWidth={sw} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={T.amber}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={dash}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: Math.round(size * 0.214), fontWeight: 800, color: T.ink, fontVariantNumeric: "tabular-nums" }}>
          {pct}%
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        left: Math.random() * 100,
        w: 7 + Math.random() * 5,
        h: 11 + Math.random() * 7,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: Math.random() * 360,
        dur: 1.3 + Math.random() * 1.4,
        delay: Math.random() * 0.5,
      })),
    []
  );
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 60 }}>
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: -20,
            width: p.w,
            height: p.h,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `calmaFall ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

export default function SpanishPractice({ state, setState, onMore, localOnlyBanner }) {
  const sp = state.projects.learning.spanish;
  const practice = useMemo(() => normalizePractice(sp.practice, 60), [sp.practice]);

  // Content decks (stable — depend on content arrays, not on progress).
  const decks = useMemo(() => buildDecks(sp), [sp.verbs, sp.phrases, sp.sentences, sp.chunks]);
  const itemsById = useMemo(() => {
    const map = {};
    DECK_ORDER.forEach((k) => decks[k].forEach((it) => (map[it.id] = it)));
    return map;
  }, [decks]);

  const [deck, setDeck] = useState("verb");
  // Session queue: a snapshot of the deck's due item ids taken when the deck is
  // entered, so a mastered card stays visible for its green flash instead of
  // vanishing the instant its due-date is pushed out.
  const [queueIds, setQueueIds] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [done, setDone] = useState({});
  const [revealed, setRevealed] = useState({});
  const [celebrate, setCelebrate] = useState(false);
  const [gain, setGain] = useState(null);

  const firstRef = useRef(null);
  const confettiTimer = useRef(null);
  const gainTimer = useRef(null);
  // Ids answered wrong / revealed / skipped this session — they reschedule as
  // "weak" (resetToLearning) instead of levelling up. Cleared per deck build.
  const missedRef = useRef(new Set());

  // Desktop runs the same mobile-first column, just scaled down so it doesn't
  // read zoomed on a laptop.
  const [isWide, setIsWide] = useState(
    typeof window !== "undefined" && window.innerWidth >= 860
  );
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Latest practice for handlers that build a queue right after a commit.
  const practiceRef = useRef(practice);
  practiceRef.current = practice;

  const writePractice = (p) =>
    setState((s) => {
      const cur = s.projects.learning.spanish;
      return {
        ...s,
        projects: {
          ...s.projects,
          learning: { ...s.projects.learning, spanish: { ...cur, practice: p } },
        },
      };
    });

  // Clone the current practice, apply a mutation, persist it. Computing the
  // next value from this render's snapshot (rather than inside the setState
  // updater) keeps it idempotent under StrictMode's double-invoke.
  const commitPractice = (mutate) => {
    const p = JSON.parse(JSON.stringify(practiceRef.current));
    mutate(p);
    writePractice(p);
    practiceRef.current = p;
    return p;
  };

  const rebuildQueue = (deckKey, p, all = false) => {
    const ids = orderDueQueue(decks[deckKey], p, deckKey, { all });
    missedRef.current = new Set();
    setQueueIds(ids);
    setAnswers({});
    setResults({});
    setDone({});
    setRevealed({});
  };

  const switchDeck = (key) => {
    if (key === deck) return;
    setDeck(key);
    rebuildQueue(key, practiceRef.current);
  };

  // Seed the first session and persist a date rollover (todayXP reset /
  // startDate seed) once on mount.
  useEffect(() => {
    if (normalizePractice(sp.practice, 60) !== sp.practice) writePractice(practiceRef.current);
    rebuildQueue("verb", practiceRef.current);
    return () => {
      clearTimeout(confettiTimer.current);
      clearTimeout(gainTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const practiceMore = () => {
    const t = todayISO();
    const ids = decks[deck].map((it) => it.id);
    const p = commitPractice((pp) => {
      ids.forEach((id) => {
        if (pp.mastery[id]) pp.mastery[id].due = t;
      });
    });
    rebuildQueue(deck, p, true);
  };

  // ----- derived session state ----------------------------------------------
  const remainingIds = queueIds.filter((id) => !done[id]);
  const curId = remainingIds[0] || null;
  const cur = curId ? itemsById[curId] : null;
  const sessionTotal = queueIds.length;
  const sessionDoneN = sessionTotal - remainingIds.length;
  const remainCount = remainingIds.length;

  // Re-focus the first field whenever the current card changes.
  useEffect(() => {
    if (!curId) return;
    const t = setTimeout(() => {
      try {
        firstRef.current && firstRef.current.focus();
      } catch {
        /* ignore */
      }
    }, 70);
    return () => clearTimeout(t);
  }, [curId]);

  const goal = practice.goal || 60;
  const todayXP = practice.todayXP || 0;
  const goalPct = Math.round(100 * Math.min(1, todayXP / goal));
  const streak = streakLen(practice.streakDates);
  const chain = chain14(practice.streakDates);
  // Performance scorecard (last 7 days; the last entry is today).
  const week = dailyStats(practice, 7);
  const todayStat = week[week.length - 1];
  const weekCorrect = week.reduce((s, d) => s + d.correct, 0);
  const weekMissed = week.reduce((s, d) => s + d.missed, 0);

  const now = new Date();
  const hr = now.getHours();
  const greeting =
    hr < 12 ? "Buenos días, Arin." : hr < 19 ? "Buenas tardes, Arin." : "Buenas noches, Arin.";
  const dateLabel = `${DOW[now.getDay()]}, ${now.getDate()} ${MES[now.getMonth()]} · Día ${dayNumber(practice)}`;

  // ----- effects on answer ---------------------------------------------------
  const flashGain = (text) => {
    setGain({ text, id: Date.now() });
    clearTimeout(gainTimer.current);
    gainTimer.current = setTimeout(() => setGain(null), 1000);
  };
  const fireConfetti = () => {
    if (prefersReducedMotion()) return;
    clearTimeout(confettiTimer.current);
    setCelebrate(true);
    confettiTimer.current = setTimeout(() => setCelebrate(false), 2700);
  };
  // Would this much XP push today across the goal for the first time?
  const willCelebrate = (earned) =>
    todayXP < goal && todayXP + earned >= goal && practice.celebratedDate !== todayISO();
  const markDone = (id) => setDone((d) => ({ ...d, [id]: true }));

  // ----- actions -------------------------------------------------------------
  const onInput = (fid, value) => {
    setAnswers((a) => ({ ...a, [fid]: value }));
    setResults((r) => ({ ...r, [fid]: undefined }));
  };

  const checkCur = () => {
    if (!cur) return;
    if (cur.type === "verb") checkVerb(cur);
    else if (cur.type === "single") checkSingle(cur);
  };

  const checkVerb = (item) => {
    const p0 = practiceRef.current;
    let earned = 0;
    let all = true;
    const nr = { ...results };
    item.fields.forEach((f) => {
      const ok = answerMatches(answers[f.fid], f.answer);
      const empty = norm(answers[f.fid]) === "";
      nr[f.fid] = ok ? "correct" : empty ? undefined : "wrong";
      if (ok) {
        if (!p0.credited[f.fid]) earned += 4;
      } else {
        all = false;
      }
    });
    if (all && !p0.credited[item.bonusFid]) earned += 6;
    const cele = willCelebrate(earned);
    // Anything short of a clean all-correct comprobar marks the card weak.
    if (!all) missedRef.current.add(item.id);
    const wasNew = !p0.mastery[item.id];
    const struggled = missedRef.current.has(item.id);

    commitPractice((p) => {
      item.fields.forEach((f) => {
        if (answerMatches(answers[f.fid], f.answer)) credit(p, f.fid, 4);
      });
      if (all) {
        credit(p, item.bonusFid, 6);
        if (struggled) resetToLearning(p, item.id);
        else masterUp(p, item.id);
        if (wasNew) noteIntroduced(p, deck);
        logDaily(p, { wasNew, correct: !struggled });
      }
      maybeCelebrate(p);
    });

    setResults(nr);
    if (earned > 0) flashGain(`+${earned}`);
    if (cele) fireConfetti();
    if (all) setTimeout(() => markDone(item.id), 480);
  };

  const checkSingle = (item) => {
    const p0 = practiceRef.current;
    const ok = answerMatches(answers[item.field.fid], item.field.answer);
    const empty = norm(answers[item.field.fid]) === "";
    const earned = ok && !p0.credited[item.field.fid] ? item.xp : 0;
    const cele = willCelebrate(earned);
    if (!ok && !empty) missedRef.current.add(item.id);
    const wasNew = !p0.mastery[item.id];
    const struggled = missedRef.current.has(item.id);

    commitPractice((p) => {
      if (ok) {
        credit(p, item.field.fid, item.xp);
        if (struggled) resetToLearning(p, item.id);
        else masterUp(p, item.id);
        if (wasNew) noteIntroduced(p, deck);
        logDaily(p, { wasNew, correct: !struggled });
      }
      maybeCelebrate(p);
    });

    setResults((r) => ({ ...r, [item.field.fid]: ok ? "correct" : empty ? undefined : "wrong" }));
    if (earned > 0) flashGain(`+${earned}`);
    if (cele) fireConfetti();
    if (ok) setTimeout(() => markDone(item.id), 480);
  };

  const revealCur = () => {
    if (!cur) return;
    const item = cur;
    if (item.type === "convo") {
      const p0 = practiceRef.current;
      const earned = !p0.credited[item.fid] ? item.xp : 0;
      const cele = willCelebrate(earned);
      const wasNew = !p0.mastery[item.id];
      commitPractice((p) => {
        credit(p, item.fid, item.xp);
        masterUp(p, item.id);
        if (wasNew) noteIntroduced(p, deck); // convo now respects the daily new-card cap
        logDaily(p, { wasNew, correct: true });
        maybeCelebrate(p);
      });
      setRevealed((r) => ({ ...r, [item.id]: true }));
      if (earned > 0) flashGain(`+${earned}`);
      if (cele) fireConfetti();
      return;
    }
    // Verb / single: fill in the answer(s), no XP, comes back tomorrow.
    if (item.type === "verb") {
      const na = { ...answers };
      const nr = { ...results };
      item.fields.forEach((f) => {
        na[f.fid] = f.answer;
        nr[f.fid] = "revealed";
      });
      setAnswers(na);
      setResults(nr);
    } else {
      setAnswers((a) => ({ ...a, [item.field.fid]: item.field.answer }));
      setResults((r) => ({ ...r, [item.field.fid]: "revealed" }));
    }
    // Revealing = struggled: drop back to learning, return tomorrow as weak.
    const wasNew = !practiceRef.current.mastery[item.id];
    commitPractice((p) => {
      resetToLearning(p, item.id);
      if (wasNew) noteIntroduced(p, deck);
      logDaily(p, { wasNew, correct: false });
    });
    setRevealed((r) => ({ ...r, [item.id]: true }));
  };

  const nextCur = () => {
    if (!cur) return;
    setRevealed((r) => ({ ...r, [cur.id]: false }));
    markDone(cur.id);
  };

  const skipCur = () => {
    if (!cur) return;
    const item = cur;
    const wasNew = !practiceRef.current.mastery[item.id];
    commitPractice((p) => {
      resetToLearning(p, item.id);
      if (wasNew) noteIntroduced(p, deck);
      logDaily(p, { wasNew, correct: false });
    });
    markDone(item.id);
  };

  const onKey = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (cur && revealed[cur.id]) nextCur();
    else checkCur();
  };

  // ----- render --------------------------------------------------------------
  const pillStyle = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 15px",
    border: "none",
    borderRadius: 999,
    background: active ? T.ink : "transparent",
    color: active ? "#fff" : T.muted,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: T.ui,
    transition: "all .2s",
  });
  const badgeStyle = (active, n) => ({
    minWidth: 18,
    height: 18,
    padding: "0 5px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    fontVariantNumeric: "tabular-nums",
    background: active ? (n > 0 ? T.amber : "rgba(255,255,255,.2)") : n > 0 ? "#efe4d0" : "#ece8e0",
    color: active ? "#fff" : n > 0 ? T.amberText2 : T.faint2,
  });

  const dueCountFor = (key) => orderDueQueue(decks[key], practice, key).length;

  return (
    <div style={{ minHeight: "100vh", background: T.page, padding: "0 16px 72px", fontFamily: T.ui, color: T.ink }}>
      <style>{KEYFRAMES}</style>

      {/* sticky deck toggle */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          justifyContent: "center",
          padding: "14px 0",
          background: "linear-gradient(#e8e5de,#e8e5dee0 70%,#e8e5de00)",
        }}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: 680, display: "flex", justifyContent: "center" }}>
          <a
            href={mainHref()}
            title="Volver al panel"
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              color: T.faint,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: T.ui,
              padding: "6px 2px",
            }}
          >
            ‹ Panel
          </a>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: 5,
              background: "#fff",
              border: "1px solid #d9d4ca",
              borderRadius: 999,
              boxShadow: "0 2px 10px rgba(40,30,15,.06)",
              maxWidth: "100%",
              overflowX: "auto",
            }}
          >
            {DECK_ORDER.map((key) => {
              const active = deck === key;
              const n = dueCountFor(key);
              return (
                <button key={key} onClick={() => switchDeck(key)} style={pillStyle(active)}>
                  {DECK_META[key].label}
                  <span style={badgeStyle(active, n)}>{n}</span>
                </button>
              );
            })}
          </div>
          {onMore && (
            <button
              onClick={onMore}
              title="Turkish & reading"
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: T.faint,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: T.ui,
                padding: "6px 2px",
              }}
            >
              más ▸
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto" }}>{localOnlyBanner}</div>

      {/* session card */}
      <div
        style={{
          position: "relative",
          maxWidth: 680,
          margin: "6px auto 0",
          background: T.cardOuter,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 20,
          padding: isWide ? "26px 30px 30px" : "34px 28px 40px",
          boxShadow: "0 20px 50px -28px rgba(60,45,20,.35)",
          overflow: "hidden",
        }}
      >
        {celebrate && <Confetti />}
        {gain && (
          <div
            key={gain.id}
            style={{
              position: "absolute",
              top: 28,
              right: 30,
              zIndex: 50,
              fontSize: 22,
              fontWeight: 800,
              color: T.amber,
              fontFamily: T.ui,
              pointerEvents: "none",
              animation: "calmaFloatUp 1s ease forwards",
            }}
          >
            {gain.text}
          </div>
        )}

        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26, gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: T.faint,
                marginBottom: 7,
              }}
            >
              {dateLabel}
            </div>
            <div style={{ fontFamily: T.serif, fontSize: isWide ? 27 : 34, lineHeight: 1.05, color: T.ink }}>{greeting}</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: "#fff",
              border: `1px solid ${T.innerBorder}`,
              borderRadius: 14,
              padding: "9px 14px",
              flex: "none",
            }}
          >
            <span style={{ display: "inline-block", animation: "calmaFlame 1.6s ease-in-out infinite", fontSize: 20 }}>
              🔥
            </span>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.amberText, fontVariantNumeric: "tabular-nums" }}>
                {streak}
              </div>
              <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: T.faint, marginTop: 2 }}>
                racha
              </div>
            </div>
          </div>
        </div>

        {/* goal strip */}
        <div
          style={{
            display: "flex",
            gap: 22,
            alignItems: "center",
            background: T.goalStrip,
            border: `1px solid ${T.innerBorder}`,
            borderRadius: 16,
            padding: "18px 20px",
            marginBottom: 14,
          }}
        >
          <ProgressRing pct={goalPct} size={isWide ? 66 : 84} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 3 }}>Meta de hoy</div>
            <div style={{ fontSize: 13, color: T.muted, fontVariantNumeric: "tabular-nums" }}>
              {Math.min(todayXP, goal)} / {goal} XP · quedan {remainCount} tarjetas
            </div>
            <div style={{ display: "flex", gap: 5, marginTop: 11, flexWrap: "wrap" }}>
              {chain.map((d) => (
                <div
                  key={d.iso}
                  title={d.iso}
                  style={{
                    width: d.today ? 13 : 11,
                    height: d.today ? 13 : 11,
                    borderRadius: 4,
                    background: d.on ? T.amber : T.dotEmpty,
                    border: d.today ? `2px solid ${T.dotBorder}` : "none",
                    boxSizing: "border-box",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* drill card or done screen */}
        {cur ? (
          <DrillCard
            key={cur.id}
            item={cur}
            isWide={isWide}
            answers={answers}
            results={results}
            revealed={!!revealed[cur.id]}
            firstRef={firstRef}
            sessionDoneN={sessionDoneN}
            sessionTotal={sessionTotal}
            onInput={onInput}
            onKey={onKey}
            onCheck={checkCur}
            onReveal={revealCur}
            onNext={nextCur}
            onSkip={skipCur}
          />
        ) : (
          <div
            style={{
              background: "#fff",
              border: `1px solid ${T.innerBorder}`,
              borderRadius: 16,
              padding: "40px 26px",
              textAlign: "center",
              animation: "calmaPop .4s ease both",
            }}
          >
            <div style={{ fontSize: 46, marginBottom: 8 }}>🎉</div>
            <div style={{ fontFamily: T.serif, fontSize: 30, color: T.ink, marginBottom: 6 }}>¡Listo por hoy!</div>
            <div style={{ fontSize: 14, color: T.muted2, maxWidth: 340, margin: "0 auto 18px", lineHeight: 1.5 }}>
              Sumaste {todayXP} XP y mantuviste tu racha de {streak} días. Volvé mañana para no cortarla. 🔥
            </div>

            {/* scorecard — today's tally + a 7-day correct/missed strip */}
            <div
              style={{
                maxWidth: 360,
                margin: "0 auto 22px",
                background: T.goalStrip,
                border: `1px solid ${T.innerBorder}`,
                borderRadius: 14,
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", gap: 22, marginBottom: 12, fontVariantNumeric: "tabular-nums" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0e6b4f" }}>{todayStat.correct}</div>
                  <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: T.faint }}>aciertos hoy</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.amberText }}>{todayStat.missed}</div>
                  <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: T.faint }}>a repasar</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>{todayStat.new}</div>
                  <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: T.faint }}>nuevas</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6, height: 30 }}>
                {week.map((d) => {
                  const tot = d.correct + d.missed;
                  const h = tot === 0 ? 3 : 6 + Math.round(24 * (d.correct / tot));
                  return (
                    <div
                      key={d.iso}
                      title={`${d.iso}: ${d.correct} aciertos · ${d.missed} a repasar`}
                      style={{
                        width: 14,
                        height: h,
                        borderRadius: 3,
                        background: tot === 0 ? T.dotEmpty : d.today ? T.amber : "#cda96a",
                        opacity: tot === 0 ? 0.6 : 1,
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: T.faint, marginTop: 8 }}>
                7 días · {weekCorrect} aciertos · {weekMissed} a repasar
              </div>
            </div>

            <button
              onClick={practiceMore}
              style={{
                padding: "12px 22px",
                border: `1px solid ${T.dashBorder}`,
                borderRadius: 12,
                background: "#faf7f0",
                color: T.amberText3,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: T.ui,
              }}
            >
              Repasar igual
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DrillCard({
  item,
  isWide,
  answers,
  results,
  revealed,
  firstRef,
  sessionDoneN,
  sessionTotal,
  onInput,
  onKey,
  onCheck,
  onReveal,
  onNext,
  onSkip,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${T.innerBorder}`,
        borderRadius: 16,
        padding: isWide ? "22px 24px 20px" : "26px 26px 22px",
        animation: "calmaSoftIn .25s ease both",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: T.faint3, fontWeight: 700 }}>
          {item.eyebrow}
        </span>
        <span style={{ fontSize: 12, color: T.faint2, fontVariantNumeric: "tabular-nums" }}>
          {sessionDoneN} / {sessionTotal}
        </span>
      </div>
      <div style={{ fontFamily: T.serif, fontSize: isWide ? 25 : 30, color: T.ink, lineHeight: 1.12, marginBottom: 6 }}>
        {item.title}
      </div>
      <div style={{ fontSize: 14, color: T.muted2, marginBottom: 22 }}>{item.sub}</div>

      {item.type === "verb" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
          {item.fields.map((f, i) => {
            const res = results[f.fid];
            return (
              <div key={f.fid}>
                <div style={{ fontSize: 11, color: T.fieldLabel, marginBottom: 6, letterSpacing: ".04em" }}>{f.label}</div>
                <input
                  ref={i === 0 ? firstRef : undefined}
                  value={answers[f.fid] || ""}
                  onChange={(e) => onInput(f.fid, e.target.value)}
                  onKeyDown={onKey}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  style={inputStyle(res)}
                />
                {res === "wrong" && (
                  <div style={{ marginTop: 6, fontFamily: T.mono, fontSize: 12, color: T.amberText }}>✓ {f.answer}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {item.type === "single" && (
        <div style={{ marginBottom: 18 }}>
          <input
            ref={firstRef}
            value={answers[item.field.fid] || ""}
            onChange={(e) => onInput(item.field.fid, e.target.value)}
            onKeyDown={onKey}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="escribilo en español…"
            style={inputStyle(results[item.field.fid])}
          />
          {results[item.field.fid] === "wrong" && (
            <div style={{ marginTop: 8, fontFamily: T.mono, fontSize: 13, color: T.amberText }}>
              ✓ respuesta: {item.field.answer}
            </div>
          )}
        </div>
      )}

      {item.type === "convo" &&
        (revealed ? (
          <div>
            <div style={{ fontSize: 11, color: T.fieldLabel, marginBottom: 7, letterSpacing: ".04em" }}>
              una respuesta natural
            </div>
            <div
              style={{
                padding: "16px 18px",
                border: "1px solid #cfe6dd",
                background: "#eef9f4",
                borderRadius: 12,
                marginBottom: 18,
                fontFamily: T.mono,
                color: "#0e6b4f",
                fontSize: 16,
                lineHeight: 1.45,
              }}
            >
              {item.answer}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "18px 20px",
              border: `1px dashed ${T.dashBorder}`,
              borderRadius: 12,
              color: T.fieldLabel,
              fontSize: 14,
              marginBottom: 18,
              lineHeight: 1.5,
            }}
          >
            Pensá cómo responderías en una charla real… después revelá una respuesta natural.
          </div>
        ))}

      {/* actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {revealed ? (
          <button onClick={onNext} style={btn.dark}>
            Siguiente →
          </button>
        ) : item.type === "convo" ? (
          <>
            <button onClick={onReveal} style={btn.primary}>
              Revelar respuesta
            </button>
            <button onClick={onSkip} style={btn.text}>
              Saltar
            </button>
          </>
        ) : (
          <>
            <button onClick={onCheck} style={btn.primary}>
              Comprobar ↵
            </button>
            <button onClick={onReveal} style={btn.ghost}>
              Ver
            </button>
            <button onClick={onSkip} style={btn.text}>
              Saltar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
