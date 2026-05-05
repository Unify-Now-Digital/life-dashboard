import React, { useState } from "react";
import { C, styles } from "../../lib/tokens";
import PanelHeader from "./PanelHeader.jsx";

const PRONOUNS = ["yo", "vos", "él/ella", "nosotros", "ellos/ellas"];
const RULE_REVEAL_AFTER = 2;

function SubTabs({ tab, setTab }) {
  const tabs = [
    { id: "phrase", label: "Phrase" },
    { id: "chunks", label: "Conversations" },
    { id: "verbs", label: "Verbs" },
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
      <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 6 }}>
        {chunk.situation}
      </div>
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
              <div
                key={i}
                style={{
                  borderLeft: `2px solid ${C.accent}`,
                  padding: "4px 12px",
                }}
              >
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

function VerbsView({ verbs, index, onResult }) {
  const verb = verbs[index % verbs.length];
  const [drafts, setDrafts] = useState(["", "", "", "", ""]);
  const [checked, setChecked] = useState(false);

  const handleCheck = (e) => {
    e.preventDefault();
    setChecked(true);
    const allRight = drafts.every((d, i) => normalize(d) === normalize(verb.forms[i]));
    onResult(verb.id, allRight);
  };

  const handleNext = () => {
    setDrafts(["", "", "", "", ""]);
    setChecked(false);
    onResult(verb.id, null); // null = just advance, don't change pass count
  };

  const showRule = verb.correctPasses >= RULE_REVEAL_AFTER;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{verb.infinitive}</div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>{verb.tense}</div>
        </div>
        <div style={{ fontSize: 11, color: C.textTertiary }}>
          {verb.correctPasses} correct {verb.correctPasses === 1 ? "pass" : "passes"}
        </div>
      </div>

      <form onSubmit={handleCheck}>
        {PRONOUNS.map((p, i) => {
          const correct = normalize(drafts[i]) === normalize(verb.forms[i]);
          const showError = checked && !correct;
          return (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 80, fontSize: 12, color: C.textSecondary }}>{p}</div>
              <input
                type="text"
                value={drafts[i]}
                onChange={(e) => {
                  const next = [...drafts];
                  next[i] = e.target.value;
                  setDrafts(next);
                }}
                disabled={checked}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                style={{
                  flex: 1,
                  border: `0.5px solid ${showError ? C.accent : C.border}`,
                  background: showError ? C.accentLight : C.bg,
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 14,
                  fontFamily: "inherit",
                  outline: "none",
                  color: C.text,
                }}
              />
              {checked && !correct && (
                <div style={{ fontSize: 13, color: C.accentDark, minWidth: 90 }}>{verb.forms[i]}</div>
              )}
            </div>
          );
        })}

        {!checked ? (
          <button
            type="submit"
            style={{
              marginTop: 8,
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
            Check
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            style={{
              marginTop: 8,
              background: "transparent",
              border: `0.5px solid ${C.border}`,
              borderRadius: 6,
              padding: "8px 14px",
              fontSize: 13,
              color: C.accent,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Next verb
          </button>
        )}
      </form>

      {checked && showRule && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            background: C.accentLight,
            border: `0.5px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 12,
            color: C.accentDark,
            lineHeight: 1.5,
          }}
        >
          {verb.rule}
        </div>
      )}
    </div>
  );
}

function normalize(s) {
  // Strip accents so users typing "tenes" on mobile match "tenés"
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function SpanishPanel({ data, onClose, onCyclePhrase, onRateChunk, onVerbResult }) {
  const [tab, setTab] = useState("phrase");

  return (
    <div>
      <PanelHeader title="Spanish" onClose={onClose} />
      <SubTabs tab={tab} setTab={setTab} />
      {tab === "phrase" && (
        <PhraseView phrases={data.phrases} index={data.phraseIndex} onCycle={onCyclePhrase} />
      )}
      {tab === "chunks" && (
        <ChunksView chunks={data.chunks} index={data.chunkIndex} onAdvance={onRateChunk} />
      )}
      {tab === "verbs" && (
        <VerbsView verbs={data.verbs} index={data.verbIndex} onResult={onVerbResult} />
      )}
    </div>
  );
}
