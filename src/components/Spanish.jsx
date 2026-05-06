import React, { useState, useEffect } from "react";
import { C, styles } from "../lib/tokens";

const TENSES = [
  { key: "past", label: "yo past" },
  { key: "present", label: "yo present" },
  { key: "future", label: "yo future" },
];
const RULE_MASTERY_THRESHOLD = 2;

function SubTabs({ tab, setTab, progress }) {
  const tabs = [
    { id: "verbs", label: "Verbs", ...progress.verbs },
    { id: "chunks", label: "Conversations", ...progress.chunks },
    { id: "phrase", label: "Phrase", ...progress.phrase },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      {tabs.map((t) => {
        const active = tab === t.id;
        const complete = t.done === t.total && t.total > 0;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              background: active ? C.accentLight : "transparent",
              color: active ? C.accentDark : C.textSecondary,
              border: `0.5px solid ${active ? C.accent : C.border}`,
              borderRadius: 6,
              padding: "6px 8px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span>{t.label}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 400,
                color: complete ? C.success : active ? C.accentDark : C.textTertiary,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {t.done} / {t.total} {t.metric}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PhraseView({ phrases, index, onCycle, onMarkSeen }) {
  const phrase = phrases[index % phrases.length];
  // Mark the currently displayed phrase as seen whenever it changes — including
  // the first render — so the Phrase tab counter advances naturally.
  // onMarkSeen is excluded from deps because it's a fresh handler on every
  // Dashboard render; the underlying setState is idempotent regardless.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    onMarkSeen(phrase.id);
  }, [phrase.id]);
  return (
    <div>
      <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 6 }}>
        Phrase {(index % phrases.length) + 1} of {phrases.length}
      </div>
      <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4 }}>{phrase.es}</div>
      <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>{phrase.en}</div>
      {phrase.note && (
        <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 10, fontStyle: "italic" }}>
          {phrase.note}
        </div>
      )}
      <button
        onClick={onCycle}
        style={{
          marginTop: 16,
          background: "transparent",
          border: `0.5px solid ${C.border}`,
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 12,
          color: C.accent,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Next phrase
      </button>
    </div>
  );
}

function TappableSpanish({ es, en, revealed, onToggle, variant }) {
  // variant: "them" (left chat bubble) | "option" (subtle, with left border)
  const baseStyle = {
    cursor: "pointer",
    userSelect: "none",
  };
  if (variant === "them") {
    return (
      <div onClick={onToggle} style={baseStyle}>
        <div
          style={{
            background: C.bgSecondary,
            border: `0.5px solid ${C.border}`,
            borderRadius: 8,
            padding: "10px 13px",
            fontSize: 15,
          }}
        >
          {es}
        </div>
        {revealed && (
          <div
            style={{
              fontSize: 12,
              color: C.textTertiary,
              fontStyle: "italic",
              marginTop: 4,
              paddingLeft: 13,
            }}
          >
            {en}
          </div>
        )}
        {!revealed && (
          <div style={{ fontSize: 10, color: C.textTertiary, marginTop: 4, paddingLeft: 13 }}>
            tap to translate
          </div>
        )}
      </div>
    );
  }
  // option variant
  return (
    <div onClick={onToggle} style={{ ...baseStyle, borderLeft: `2px solid ${C.accent}`, padding: "4px 12px" }}>
      <div style={{ fontSize: 14 }}>{es}</div>
      {revealed && (
        <div style={{ fontSize: 12, color: C.textTertiary, fontStyle: "italic", marginTop: 2 }}>
          {en}
        </div>
      )}
    </div>
  );
}

function ChunksView({ chunks, index, onAdvance }) {
  const chunk = chunks[index % chunks.length];
  const [step, setStep] = useState(1); // number of turns currently visible
  const [revealedEN, setRevealedEN] = useState({}); // keys: "t-{idx}" or "o-{turnIdx}-{optIdx}"

  // Reset progress when the chunk changes (after a rating advances index)
  useEffect(() => {
    setStep(1);
    setRevealedEN({});
  }, [chunk.id]);

  const totalTurns = chunk.turns.length;
  const visibleTurns = chunk.turns.slice(0, step);
  const isComplete = step >= totalTurns;

  const toggleEn = (key) => setRevealedEN((r) => ({ ...r, [key]: !r[key] }));

  const handleRate = (rating) => {
    onAdvance(chunk.id, rating);
    // useEffect on chunk.id change will reset step + revealedEN
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 8 }}>
        {chunk.situation} · turn {step} of {totalTurns}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {visibleTurns.map((turn, ti) => {
          if (turn.speaker === "them") {
            const key = `t-${ti}`;
            return (
              <div key={ti}>
                <div style={{ fontSize: 10, color: C.textTertiary, marginBottom: 4 }}>them</div>
                <TappableSpanish
                  es={turn.es}
                  en={turn.en}
                  revealed={!!revealedEN[key]}
                  onToggle={() => toggleEn(key)}
                  variant="them"
                />
              </div>
            );
          }
          // you turn — render the option list
          return (
            <div key={ti}>
              <div style={{ fontSize: 10, color: C.textTertiary, marginBottom: 6 }}>
                you — pick the register that fits
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {turn.options.map((opt, oi) => {
                  const key = `o-${ti}-${oi}`;
                  return (
                    <div key={oi}>
                      <div style={{ fontSize: 10, color: C.textTertiary, marginBottom: 2, paddingLeft: 14 }}>
                        {opt.tone}
                      </div>
                      <TappableSpanish
                        es={opt.es}
                        en={opt.en}
                        revealed={!!revealedEN[key]}
                        onToggle={() => toggleEn(key)}
                        variant="option"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!isComplete ? (
        <button
          onClick={() => setStep((s) => Math.min(s + 1, totalTurns))}
          style={{
            marginTop: 16,
            background: C.accent,
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Next
        </button>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <RateBtn onClick={() => handleRate("again")}>Again</RateBtn>
            <RateBtn onClick={() => handleRate("hard")}>Hard</RateBtn>
            <RateBtn onClick={() => handleRate("good")} primary>
              Good
            </RateBtn>
          </div>
          <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 8 }}>
            Bucket: {chunk.bucket} ·{" "}
            {chunk.bucket >= 3 ? "well-known" : chunk.bucket === 0 ? "new" : "learning"}
          </div>
        </div>
      )}
    </div>
  );
}

function RateBtn({ children, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: primary ? C.accent : "transparent",
        color: primary ? "white" : C.textSecondary,
        border: `0.5px solid ${primary ? C.accent : C.border}`,
        borderRadius: 6,
        padding: "8px 0",
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function VerbCell({ value, onChange, onKeyDown, status, correct, revealed }) {
  const borderColor =
    status === true ? C.success : status === false ? C.accent : C.borderStrong;
  const bg = status === false ? C.accentLight : C.bgSecondary;
  const color = revealed ? C.textTertiary : C.text;
  const fontStyle = revealed ? "italic" : "normal";
  // After a check, show the canonical answer beneath every typed cell so the
  // user can compare against what they typed — even when correct (useful when
  // accent-insensitive matching forgave a missing accent).
  const showAnswerBeneath = status !== undefined && !revealed;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          // Auto-select revealed answers so the first keystroke replaces them
          // and the user can practise typing over the prompt.
          if (revealed) e.target.select();
        }}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: `1px solid ${borderColor}`,
          background: bg,
          borderRadius: 5,
          padding: "5px 7px",
          fontSize: 12,
          fontFamily: "inherit",
          outline: "none",
          color,
          fontStyle,
        }}
      />
      {showAnswerBeneath && (
        <div
          style={{
            fontSize: 10,
            color: status ? C.textTertiary : C.accentDark,
            paddingLeft: 2,
          }}
        >
          {correct}
        </div>
      )}
    </div>
  );
}

// Per-row state model:
//   evals[verbId]?.[tk]: undefined = not yet checked, true = right, false = wrong
//   revealed[verbId]?.[tk]: true = filled by clicking "show", false/undefined = user-typed
//   editing a cell clears its eval and revealed flags
const GRID_COLS = "minmax(96px, 1.4fr) repeat(3, minmax(56px, 78px)) 26px 38px";

function VerbsView({ verbs, onCheckVerb }) {
  const blankDrafts = () =>
    verbs.reduce((acc, v) => {
      acc[v.id] = { past: "", present: "", future: "" };
      return acc;
    }, {});

  const [drafts, setDrafts] = useState(blankDrafts);
  const [evals, setEvals] = useState({});
  const [revealed, setRevealed] = useState({}); // { [verbId]: { past, present, future } as bool }

  const updateDraft = (verbId, tk, value) => {
    setDrafts((d) => ({ ...d, [verbId]: { ...d[verbId], [tk]: value } }));
    setEvals((e) => {
      const row = e[verbId];
      if (!row || row[tk] === undefined) return e;
      return { ...e, [verbId]: { ...row, [tk]: undefined } };
    });
    // Typing into a revealed cell makes it user-typed
    setRevealed((r) => {
      if (!r[verbId]?.[tk]) return r;
      return { ...r, [verbId]: { ...r[verbId], [tk]: false } };
    });
  };

  const checkRow = (verbId) => {
    const v = verbs.find((x) => x.id === verbId);
    const d = drafts[verbId];
    const r = revealed[verbId] || {};
    const cell = {};
    let anyAttempted = false;
    let allFilled = true;
    let allRight = true;
    for (const t of TENSES) {
      const filled = (d[t.key] || "").trim().length > 0;
      // Revealed cells don't count as user attempts — they're study, not test
      if (!filled || r[t.key]) {
        cell[t.key] = undefined;
        allFilled = false;
        continue;
      }
      anyAttempted = true;
      cell[t.key] = normalize(d[t.key]) === normalize(v.forms[t.key]);
      if (!cell[t.key]) allRight = false;
    }
    if (!anyAttempted) return;
    setEvals((e) => ({ ...e, [verbId]: cell }));
    if (allFilled) onCheckVerb(verbId, allRight);
  };

  const toggleRowReveal = (verbId) => {
    const v = verbs.find((x) => x.id === verbId);
    const cur = revealed[verbId] || {};
    const anyRevealed = TENSES.some((t) => cur[t.key]);
    if (anyRevealed) {
      // Hide: clear revealed cells and their drafts
      setDrafts((d) => {
        const row = { ...d[verbId] };
        for (const t of TENSES) if (cur[t.key]) row[t.key] = "";
        return { ...d, [verbId]: row };
      });
      setRevealed((r) => ({ ...r, [verbId]: {} }));
    } else {
      // Show: fill empty cells with correct answers
      const newRev = {};
      setDrafts((d) => {
        const row = { ...d[verbId] };
        for (const t of TENSES) {
          if (!(row[t.key] || "").trim()) {
            row[t.key] = v.forms[t.key];
            newRev[t.key] = true;
          }
        }
        return { ...d, [verbId]: row };
      });
      setRevealed((r) => ({ ...r, [verbId]: newRev }));
    }
  };

  const handleResetAll = () => {
    setDrafts(blankDrafts());
    setEvals({});
    setRevealed({});
  };

  const masteredCount = verbs.filter((v) => v.correctPasses >= RULE_MASTERY_THRESHOLD).length;

  return (
    <div style={{ maxWidth: 560 }}>
      <div
        style={{
          fontSize: 11,
          color: C.textTertiary,
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>Type the yo form. Enter (or ↩) to check, show to reveal.</span>
        <span style={{ color: C.textSecondary, fontVariantNumeric: "tabular-nums" }}>
          {masteredCount} / {verbs.length} mastered
        </span>
      </div>

      {/* Header row — labels appear once at top so each verb row stays compact */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID_COLS,
          gap: 6,
          padding: "0 0 6px 0",
          borderBottom: `0.5px solid ${C.border}`,
          fontSize: 10,
          color: C.textTertiary,
          textTransform: "lowercase",
        }}
      >
        <div></div>
        <div>yo past</div>
        <div>yo present</div>
        <div>yo future</div>
        <div></div>
        <div></div>
      </div>

      {verbs.map((v) => {
        const rowEvals = evals[v.id] || {};
        const rowRev = revealed[v.id] || {};
        const checkedAny = TENSES.some((t) => rowEvals[t.key] !== undefined);
        const anyWrong = TENSES.some((t) => rowEvals[t.key] === false);
        const masteredEnough = v.correctPasses >= RULE_MASTERY_THRESHOLD;
        const showRule = (checkedAny && anyWrong) || masteredEnough;
        const masteryFilled = Math.min(v.correctPasses, RULE_MASTERY_THRESHOLD);
        const anyRevealed = TENSES.some((t) => rowRev[t.key]);

        const onKey = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            checkRow(v.id);
          }
        };

        return (
          <div
            key={v.id}
            style={{
              display: "grid",
              gridTemplateColumns: GRID_COLS,
              gap: 6,
              alignItems: "start",
              padding: "8px 0",
              borderBottom: `0.5px solid ${C.border}`,
            }}
          >
            <div style={{ minWidth: 0, paddingTop: 4 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {v.infinitive}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.textTertiary,
                  lineHeight: 1.2,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {v.en}
              </div>
              <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                {Array.from({ length: RULE_MASTERY_THRESHOLD }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      background: i < masteryFilled ? C.accent : C.bgTertiary,
                    }}
                  />
                ))}
              </div>
            </div>
            {TENSES.map((t) => (
              <VerbCell
                key={t.key}
                value={drafts[v.id][t.key]}
                onChange={(e) => updateDraft(v.id, t.key, e.target.value)}
                onKeyDown={onKey}
                status={rowEvals[t.key]}
                correct={v.forms[t.key]}
                revealed={!!rowRev[t.key]}
              />
            ))}
            <button
              type="button"
              onClick={() => checkRow(v.id)}
              title="Check this row"
              aria-label="Check this row"
              style={{
                background: C.bg,
                border: `1px solid ${C.borderStrong}`,
                borderRadius: 5,
                padding: "5px 0",
                fontSize: 12,
                lineHeight: 1,
                color: C.accent,
                cursor: "pointer",
                fontFamily: "inherit",
                height: 27,
              }}
            >
              ↩
            </button>
            <button
              type="button"
              onClick={() => toggleRowReveal(v.id)}
              title={anyRevealed ? "Hide revealed answers" : "Reveal answers in empty cells"}
              aria-label={anyRevealed ? "Hide revealed answers" : "Reveal answers"}
              style={{
                background: anyRevealed ? C.accentLight : C.bg,
                border: `1px solid ${anyRevealed ? C.accent : C.borderStrong}`,
                borderRadius: 5,
                padding: "5px 0",
                fontSize: 10,
                lineHeight: 1,
                color: anyRevealed ? C.accentDark : C.textSecondary,
                cursor: "pointer",
                fontFamily: "inherit",
                height: 27,
                fontWeight: 500,
              }}
            >
              {anyRevealed ? "hide" : "show"}
            </button>
            {showRule && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  marginTop: 6,
                  padding: "5px 9px",
                  background: C.accentLight,
                  borderRadius: 5,
                  fontSize: 11,
                  color: C.accentDark,
                  lineHeight: 1.4,
                }}
              >
                <span style={{ fontWeight: 500 }}>{anyWrong ? "Why: " : "Pattern: "}</span>
                {v.rule}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button
          type="button"
          onClick={handleResetAll}
          style={{
            background: "transparent",
            border: `0.5px solid ${C.border}`,
            borderRadius: 6,
            padding: "5px 12px",
            fontSize: 11,
            color: C.textSecondary,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

function normalize(s) {
  // Strip accents so users typing "tendre" on mobile match "tendré"
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function Spanish({ data, onCyclePhrase, onRateChunk, onCheckVerb, onMarkPhraseSeen }) {
  const [tab, setTab] = useState("verbs");
  const [collapsed, setCollapsed] = useState(false);

  const verbsMastered = data.verbs.filter((v) => v.correctPasses >= RULE_MASTERY_THRESHOLD).length;
  const chunksMastered = data.chunks.filter((c) => (c.bucket || 0) >= 1).length;
  const phrasesSeen = (data.phrasesSeen || []).length;

  const progress = {
    verbs: { done: verbsMastered, total: data.verbs.length, metric: "mastered" },
    chunks: { done: chunksMastered, total: data.chunks.length, metric: "reviewed" },
    phrase: { done: phrasesSeen, total: data.phrases.length, metric: "seen" },
  };

  // Pill summary when collapsed — shows progress at a glance so the user
  // knows where they are without having to expand. Single tap reopens.
  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        style={{
          background: C.bgSecondary,
          border: `0.5px solid ${C.border}`,
          borderRadius: 999,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontSize: 12,
          color: C.textSecondary,
          userSelect: "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 500, color: C.text }}>Spanish</span>
          <span style={{ color: C.textTertiary }}>
            verbs {verbsMastered}/{data.verbs.length} · conv {chunksMastered}/{data.chunks.length} · phr {phrasesSeen}/{data.phrases.length}
          </span>
        </span>
        <span style={{ fontSize: 11, color: C.accent }}>open ▸</span>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={{ ...styles.sectionH, marginBottom: 12 }}>
        <span style={{ fontWeight: 500 }}>Spanish</span>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={styles.sectionSub}>B1 → B2 · vos</span>
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Collapse Spanish section"
            title="Collapse"
            style={{
              background: "transparent",
              border: `0.5px solid ${C.border}`,
              borderRadius: 6,
              padding: "3px 9px",
              fontSize: 11,
              color: C.textSecondary,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            minimise ▾
          </button>
        </span>
      </div>
      <SubTabs tab={tab} setTab={setTab} progress={progress} />
      {tab === "phrase" && (
        <PhraseView
          phrases={data.phrases}
          index={data.phraseIndex}
          onCycle={onCyclePhrase}
          onMarkSeen={onMarkPhraseSeen}
        />
      )}
      {tab === "chunks" && (
        <ChunksView chunks={data.chunks} index={data.chunkIndex} onAdvance={onRateChunk} />
      )}
      {tab === "verbs" && <VerbsView verbs={data.verbs} onCheckVerb={onCheckVerb} />}
    </div>
  );
}
