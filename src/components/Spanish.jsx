import React, { useState } from "react";
import { C, styles } from "../lib/tokens";

const TENSES = [
  { key: "past", label: "yo past" },
  { key: "present", label: "yo present" },
  { key: "future", label: "yo future" },
];
const RULE_MASTERY_THRESHOLD = 2;

function SubTabs({ tab, setTab }) {
  const tabs = [
    { id: "verbs", label: "Verbs" },
    { id: "chunks", label: "Conversations" },
    { id: "phrase", label: "Phrase" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            flex: 1,
            background: tab === t.id ? C.accentLight : "transparent",
            color: tab === t.id ? C.accentDark : C.textSecondary,
            border: `0.5px solid ${tab === t.id ? C.accent : C.border}`,
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function PhraseView({ phrases, index, onCycle }) {
  const phrase = phrases[index % phrases.length];
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

function ChunksView({ chunks, index, onAdvance }) {
  const [revealed, setRevealed] = useState(false);
  const chunk = chunks[index % chunks.length];

  const handleRate = (rating) => {
    onAdvance(chunk.id, rating);
    setRevealed(false);
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 6 }}>{chunk.situation}</div>
      <div
        style={{
          background: C.bgSecondary,
          border: `0.5px solid ${C.border}`,
          borderRadius: 8,
          padding: "12px 14px",
          fontSize: 15,
        }}
      >
        {chunk.prompt}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          style={{
            marginTop: 14,
            background: C.accent,
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Reveal responses
        </button>
      ) : (
        <>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {chunk.responses.map((r, i) => (
              <div key={i} style={{ borderLeft: `2px solid ${C.accent}`, padding: "4px 12px" }}>
                <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 2 }}>{r.tone}</div>
                <div style={{ fontSize: 14 }}>{r.text}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <RateBtn onClick={() => handleRate("again")}>Again</RateBtn>
            <RateBtn onClick={() => handleRate("hard")}>Hard</RateBtn>
            <RateBtn onClick={() => handleRate("good")} primary>Good</RateBtn>
          </div>
          <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 8 }}>
            Bucket: {chunk.bucket} · {chunk.bucket >= 3 ? "well-known" : chunk.bucket === 0 ? "new" : "learning"}
          </div>
        </>
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

function VerbCell({ value, onChange, onKeyDown, status, correct }) {
  const borderColor =
    status === true ? C.success : status === false ? C.accent : C.border;
  const bg = status === false ? C.accentLight : C.bg;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: `0.5px solid ${borderColor}`,
          background: bg,
          borderRadius: 5,
          padding: "5px 7px",
          fontSize: 12,
          fontFamily: "inherit",
          outline: "none",
          color: C.text,
        }}
      />
      {status === false && (
        <div style={{ fontSize: 10, color: C.accentDark, paddingLeft: 2 }}>{correct}</div>
      )}
    </div>
  );
}

// Per-row state model:
//   evals[verbId]?.[tk]: undefined = not yet checked, true = right, false = wrong
//   editing a cell after a check resets that cell's eval back to undefined
function VerbsView({ verbs, onCheckVerb }) {
  const blankDrafts = () =>
    verbs.reduce((acc, v) => {
      acc[v.id] = { past: "", present: "", future: "" };
      return acc;
    }, {});

  const [drafts, setDrafts] = useState(blankDrafts);
  const [evals, setEvals] = useState({}); // { [verbId]: { past, present, future } }

  const updateDraft = (verbId, tk, value) => {
    setDrafts((d) => ({ ...d, [verbId]: { ...d[verbId], [tk]: value } }));
    setEvals((e) => {
      const row = e[verbId];
      if (!row || row[tk] === undefined) return e;
      return { ...e, [verbId]: { ...row, [tk]: undefined } };
    });
  };

  const checkRow = (verbId) => {
    const v = verbs.find((x) => x.id === verbId);
    const d = drafts[verbId];
    const cell = {};
    let anyAttempted = false;
    let allFilled = true;
    let allRight = true;
    for (const t of TENSES) {
      const filled = (d[t.key] || "").trim().length > 0;
      if (!filled) {
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
    // Only update mastery state when the row is complete. Partial attempts get
    // local feedback (right/wrong cells) but don't reset progress.
    if (allFilled) onCheckVerb(verbId, allRight);
  };

  const handleResetAll = () => {
    setDrafts(blankDrafts());
    setEvals({});
  };

  const masteredCount = verbs.filter((v) => v.correctPasses >= RULE_MASTERY_THRESHOLD).length;

  return (
    <div>
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
        <span>Type the yo form. Press Enter (or tap ↩) to check that row.</span>
        <span style={{ color: C.textSecondary, fontVariantNumeric: "tabular-nums" }}>
          {masteredCount} / {verbs.length} mastered
        </span>
      </div>

      {/* Header row — labels appear once at top so each verb row stays compact */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(140px, 1.4fr) repeat(3, minmax(64px, 1fr)) 28px",
          gap: 8,
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
      </div>

      {verbs.map((v) => {
        const rowEvals = evals[v.id] || {};
        const checkedAny = TENSES.some((t) => rowEvals[t.key] !== undefined);
        const anyWrong = TENSES.some((t) => rowEvals[t.key] === false);
        const masteredEnough = v.correctPasses >= RULE_MASTERY_THRESHOLD;
        const showRule = (checkedAny && anyWrong) || masteredEnough;
        const masteryFilled = Math.min(v.correctPasses, RULE_MASTERY_THRESHOLD);

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
              gridTemplateColumns: "minmax(140px, 1.4fr) repeat(3, minmax(64px, 1fr)) 28px",
              gap: 8,
              alignItems: "start",
              padding: "8px 0",
              borderBottom: `0.5px solid ${C.border}`,
            }}
          >
            <div style={{ minWidth: 0, paddingTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>
                {v.infinitive}
              </div>
              <div style={{ fontSize: 10, color: C.textTertiary, lineHeight: 1.2, marginTop: 2 }}>
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
              />
            ))}
            <button
              type="button"
              onClick={() => checkRow(v.id)}
              title="Check this row"
              aria-label="Check this row"
              style={{
                background: "transparent",
                border: `0.5px solid ${C.border}`,
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

export default function Spanish({ data, onCyclePhrase, onRateChunk, onCheckVerb }) {
  const [tab, setTab] = useState("verbs");

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        Spanish
        <span style={styles.sectionSub}>B1 → B2 · vos · yo across past/present/future</span>
      </div>
      <SubTabs tab={tab} setTab={setTab} />
      {tab === "phrase" && (
        <PhraseView phrases={data.phrases} index={data.phraseIndex} onCycle={onCyclePhrase} />
      )}
      {tab === "chunks" && (
        <ChunksView chunks={data.chunks} index={data.chunkIndex} onAdvance={onRateChunk} />
      )}
      {tab === "verbs" && <VerbsView verbs={data.verbs} onCheckVerb={onCheckVerb} />}
    </div>
  );
}
