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

function VerbInput({ value, onChange, disabled, status, correct }) {
  const borderColor =
    status === "wrong" ? C.accent : status === "right" ? C.success : C.border;
  const bg = status === "wrong" ? C.accentLight : C.bg;
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: `0.5px solid ${borderColor}`,
          background: bg,
          borderRadius: 6,
          padding: "6px 8px",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
          color: C.text,
        }}
      />
      {status === "wrong" && (
        <div style={{ fontSize: 11, color: C.accentDark, marginTop: 2, paddingLeft: 2 }}>
          {correct}
        </div>
      )}
    </div>
  );
}

function VerbRow({ verb, drafts, onChangeDraft, checked, revealed, onToggleReveal }) {
  const tenseStatus = (tk) => {
    if (!checked) return null;
    return normalize(drafts[tk]) === normalize(verb.forms[tk]) ? "right" : "wrong";
  };
  const allRight =
    checked && TENSES.every((t) => normalize(drafts[t.key]) === normalize(verb.forms[t.key]));
  const anyWrong = checked && !allRight;
  const showNote = anyWrong || verb.correctPasses >= RULE_MASTERY_THRESHOLD;
  const masteryDots = Math.min(verb.correctPasses, RULE_MASTERY_THRESHOLD);

  return (
    <div
      style={{
        padding: "10px 0",
        borderBottom: `0.5px solid ${C.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 500, minWidth: 70 }}>{verb.infinitive}</div>
        <button
          type="button"
          onClick={onToggleReveal}
          style={{
            background: revealed ? "transparent" : C.bgSecondary,
            color: revealed ? C.textSecondary : C.textTertiary,
            border: `0.5px solid ${C.border}`,
            borderRadius: 4,
            padding: "2px 8px",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "inherit",
            fontStyle: revealed ? "normal" : "italic",
          }}
        >
          {revealed ? verb.en : "tap for meaning"}
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: RULE_MASTERY_THRESHOLD }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: i < masteryDots ? C.accent : C.bgTertiary,
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {TENSES.map((t) => (
          <div key={t.key}>
            <div style={{ fontSize: 10, color: C.textTertiary, marginBottom: 2 }}>{t.label}</div>
            <VerbInput
              value={drafts[t.key]}
              onChange={(e) => onChangeDraft(t.key, e.target.value)}
              disabled={checked}
              status={tenseStatus(t.key)}
              correct={verb.forms[t.key]}
            />
          </div>
        ))}
      </div>
      {checked && showNote && (
        <div
          style={{
            marginTop: 8,
            padding: "6px 10px",
            background: C.accentLight,
            border: `0.5px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 11,
            color: C.accentDark,
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 500 }}>{anyWrong ? "Why: " : "Pattern: "}</span>
          {verb.rule}
        </div>
      )}
    </div>
  );
}

function VerbsView({ verbs, onCheckBatch }) {
  const blankDrafts = () =>
    verbs.reduce((acc, v) => {
      acc[v.id] = { past: "", present: "", future: "" };
      return acc;
    }, {});

  const [drafts, setDrafts] = useState(blankDrafts);
  const [revealed, setRevealed] = useState({}); // { [verbId]: true }
  const [checked, setChecked] = useState(false);

  const updateDraft = (verbId, tenseKey, value) =>
    setDrafts((d) => ({ ...d, [verbId]: { ...d[verbId], [tenseKey]: value } }));

  const toggleReveal = (verbId) =>
    setRevealed((r) => ({ ...r, [verbId]: !r[verbId] }));

  const handleCheck = (e) => {
    e.preventDefault();
    setChecked(true);
    const results = verbs.map((v) => ({
      id: v.id,
      allRight: TENSES.every((t) => normalize(drafts[v.id][t.key]) === normalize(v.forms[t.key])),
      anyAttempted: TENSES.some((t) => (drafts[v.id][t.key] || "").trim().length > 0),
    }));
    onCheckBatch(results);
  };

  const handleReset = () => {
    setDrafts(blankDrafts());
    setRevealed({});
    setChecked(false);
  };

  const totalCorrect = checked
    ? verbs.filter((v) =>
        TENSES.every((t) => normalize(drafts[v.id][t.key]) === normalize(v.forms[t.key]))
      ).length
    : 0;

  return (
    <form onSubmit={handleCheck}>
      <div
        style={{
          fontSize: 11,
          color: C.textTertiary,
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Type the yo form for each tense. Tap meaning to reveal.</span>
        {checked && (
          <span style={{ color: totalCorrect === verbs.length ? C.success : C.textSecondary }}>
            {totalCorrect} / {verbs.length} verbs
          </span>
        )}
      </div>
      <div>
        {verbs.map((v) => (
          <VerbRow
            key={v.id}
            verb={v}
            drafts={drafts[v.id]}
            onChangeDraft={(tk, val) => updateDraft(v.id, tk, val)}
            checked={checked}
            revealed={!!revealed[v.id]}
            onToggleReveal={() => toggleReveal(v.id)}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        {!checked ? (
          <button
            type="submit"
            style={{
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
            Check all
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: "transparent",
              border: `0.5px solid ${C.border}`,
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 13,
              color: C.accent,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Try again
          </button>
        )}
      </div>
    </form>
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

export default function Spanish({ data, onCyclePhrase, onRateChunk, onCheckVerbBatch }) {
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
      {tab === "verbs" && <VerbsView verbs={data.verbs} onCheckBatch={onCheckVerbBatch} />}
    </div>
  );
}
