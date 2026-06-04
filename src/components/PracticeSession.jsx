import React, { useState, useEffect, useRef, useMemo } from "react";
import { C } from "../lib/tokens";
import { speak, speechSupported } from "../lib/speech";
import {
  buildSession,
  scoreSentenceAttempt,
  normalizeSentence,
  diffWords,
} from "../lib/sentences";

// Focused full-screen practice session. Runs a bounded, weighted pass through
// the sentence deck (built in sentences.js), interleaving three task types and
// grading each into a [0,1] score that feeds the completion rate. Overlay
// chrome reuses the HabitConfirm modal/backdrop pattern.

const ACCENTS = ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"];

// ----- shared little controls ------------------------------------------------
function GhostBtn({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "transparent",
        border: `0.5px solid ${C.border}`,
        borderRadius: 6,
        padding: "8px 14px",
        fontSize: 12,
        color: disabled ? C.textTertiary : C.accent,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.accent,
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "8px 16px",
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function ListenBtn({ text, lang }) {
  if (!speechSupported()) return null;
  return (
    <button
      onClick={() => speak(text, lang)}
      aria-label="Listen"
      title="Listen"
      style={{
        background: "transparent",
        border: `0.5px solid ${C.border}`,
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: 12,
        color: C.accent,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      ▸ listen
    </button>
  );
}

function TenseTag({ children }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        color: C.accentDark,
        background: C.accentLight,
        borderRadius: 4,
        padding: "2px 8px",
      }}
    >
      {children}
    </span>
  );
}

// ----- produce: EN → ES typing ----------------------------------------------
function ProduceTask({ sentence, speechLang, onDone }) {
  const words = sentence.es.split(/\s+/);
  const [input, setInput] = useState("");
  const [hintCount, setHintCount] = useState(0);
  const [checkCount, setCheckCount] = useState(0);
  const [checked, setChecked] = useState(null); // null | true | false
  const [revealed, setRevealed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, []);

  const correct = normalizeSentence(input) === normalizeSentence(sentence.es);
  const fullyRevealed = hintCount >= words.length;
  const resolved = checked === true || revealed;

  const finish = () => {
    const score = revealed
      ? 0
      : scoreSentenceAttempt({ correct: true, hintCount, wordCount: words.length, checkCount });
    onDone(score);
  };

  const doCheck = () => {
    setCheckCount((c) => c + 1);
    setChecked(correct);
  };

  const insertAccent = (ch) => {
    const el = ref.current;
    if (!el) {
      setInput((v) => v + ch);
      return;
    }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + ch + input.slice(end);
    setInput(next);
    setChecked(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (resolved) finish();
      else doCheck();
    }
  };

  const diff = checked === false ? diffWords(input, sentence.es) : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <TenseTag>produce · {sentence.tenses}</TenseTag>
        <ListenBtn text={sentence.es} lang={speechLang} />
      </div>

      <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.4, marginTop: 12 }}>{sentence.en}</div>

      {/* Word mask — revealed words appear; the rest stay as blanks. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {words.map((w, i) => {
          const shown = i < hintCount;
          return (
            <span
              key={i}
              style={{
                fontSize: 15,
                color: shown ? C.accentDark : C.textTertiary,
                fontWeight: shown ? 500 : 400,
                letterSpacing: shown ? 0 : "0.05em",
              }}
            >
              {shown ? w : w.replace(/[\p{L}\p{N}]/gu, "_")}
            </span>
          );
        })}
      </div>

      <textarea
        ref={ref}
        value={input}
        onChange={(e) => { setInput(e.target.value); setChecked(null); }}
        onKeyDown={onKeyDown}
        placeholder="Write it in Spanish…"
        autoCapitalize="none"
        spellCheck={false}
        rows={2}
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginTop: 12,
          border: `1px solid ${checked === true ? C.success : checked === false ? C.danger : C.borderStrong}`,
          background: C.bg,
          borderRadius: 6,
          padding: "8px 10px",
          fontSize: 15,
          fontFamily: "inherit",
          outline: "none",
          resize: "vertical",
        }}
      />

      {/* Accent helper — easy diacritics on mobile. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {ACCENTS.map((ch) => (
          <button
            key={ch}
            onClick={() => insertAccent(ch)}
            style={{
              background: C.bgSecondary,
              border: `0.5px solid ${C.border}`,
              borderRadius: 6,
              padding: "4px 9px",
              fontSize: 14,
              color: C.text,
              cursor: "pointer",
              fontFamily: "inherit",
              minWidth: 30,
            }}
          >
            {ch}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {!resolved && (
          <>
            <GhostBtn onClick={() => setHintCount((c) => Math.min(c + 1, words.length))} disabled={fullyRevealed}>
              {hintCount === 0 ? "Hint" : fullyRevealed ? "All shown" : "Hint next word"}
            </GhostBtn>
            <PrimaryBtn onClick={doCheck}>Check</PrimaryBtn>
            <GhostBtn onClick={() => setRevealed(true)} style={{ marginLeft: "auto" }}>
              Reveal
            </GhostBtn>
          </>
        )}
        {resolved && <PrimaryBtn onClick={finish} style={{ marginLeft: "auto" }}>Continue</PrimaryBtn>}
      </div>

      {checked === true && (
        <div style={{ fontSize: 13, color: C.success, fontWeight: 500, marginTop: 12 }}>¡Correcto!</div>
      )}

      {/* Smart feedback: positional word diff instead of just dumping the answer. */}
      {diff && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {diff.words.map((w, i) => (
              <span
                key={i}
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: w.ok ? C.success : C.danger,
                  textDecoration: w.ok ? "none" : "underline",
                }}
              >
                {w.word}
              </span>
            ))}
          </div>
          {diff.extra.length > 0 && (
            <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 6 }}>
              extra: {diff.extra.join(" ")}
            </div>
          )}
        </div>
      )}

      {revealed && (
        <div style={{ fontSize: 13, color: C.text, marginTop: 12 }}>
          <span style={{ color: C.accentDark, fontWeight: 500 }}>Answer: </span>
          {sentence.es}
        </div>
      )}
    </div>
  );
}

// ----- scramble: tap word-tiles into order ----------------------------------
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ScrambleTask({ sentence, speechLang, onDone }) {
  const target = useMemo(() => sentence.es.split(/\s+/), [sentence.id]);
  // Tiles carry a stable key so duplicate words don't collide.
  const [bank, setBank] = useState(() =>
    shuffled(target.map((w, i) => ({ key: i, word: w })))
  );
  const [placed, setPlaced] = useState([]);
  const [wrongChecks, setWrongChecks] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState(null); // null | true | false

  const built = placed.map((t) => t.word).join(" ");
  const correct = normalizeSentence(built) === normalizeSentence(sentence.es);
  const resolved = checked === true || revealed;

  const place = (tile) => {
    setBank((b) => b.filter((t) => t.key !== tile.key));
    setPlaced((p) => [...p, tile]);
    setChecked(null);
  };
  const unplace = (tile) => {
    setPlaced((p) => p.filter((t) => t.key !== tile.key));
    setBank((b) => [...b, tile]);
    setChecked(null);
  };

  const doCheck = () => {
    if (correct) setChecked(true);
    else { setChecked(false); setWrongChecks((c) => c + 1); }
  };

  // Hint: move the next correct word from the bank into place.
  const hint = () => {
    const nextWord = target[placed.length];
    if (nextWord == null) return;
    const tile = bank.find((t) => t.word === nextWord);
    if (!tile) return;
    place(tile);
    setHintsUsed((h) => h + 1);
  };

  const reveal = () => {
    setRevealed(true);
    setPlaced(target.map((w, i) => ({ key: i, word: w })));
    setBank([]);
  };

  const finish = () => {
    const score = revealed ? 0 : clamp01(1 - 0.15 * wrongChecks - 0.2 * hintsUsed);
    onDone(score);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <TenseTag>arrange · {sentence.tenses}</TenseTag>
        <ListenBtn text={sentence.es} lang={speechLang} />
      </div>

      <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.4, marginTop: 12 }}>{sentence.en}</div>

      {/* Assembled answer */}
      <div
        style={{
          minHeight: 44,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 12,
          padding: 8,
          border: `1px solid ${checked === true ? C.success : checked === false ? C.danger : C.borderStrong}`,
          borderRadius: 6,
          background: C.bg,
        }}
      >
        {placed.map((t) => (
          <Tile key={t.key} onClick={() => !resolved && unplace(t)} active>
            {t.word}
          </Tile>
        ))}
      </div>

      {/* Word bank */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {bank.map((t) => (
          <Tile key={t.key} onClick={() => !resolved && place(t)}>
            {t.word}
          </Tile>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {!resolved && (
          <>
            <GhostBtn onClick={hint} disabled={bank.length === 0}>Hint</GhostBtn>
            <PrimaryBtn onClick={doCheck}>Check</PrimaryBtn>
            <GhostBtn onClick={reveal} style={{ marginLeft: "auto" }}>Reveal</GhostBtn>
          </>
        )}
        {resolved && <PrimaryBtn onClick={finish} style={{ marginLeft: "auto" }}>Continue</PrimaryBtn>}
      </div>

      {checked === true && (
        <div style={{ fontSize: 13, color: C.success, fontWeight: 500, marginTop: 12 }}>¡Correcto!</div>
      )}
      {checked === false && (
        <div style={{ fontSize: 13, color: C.danger, marginTop: 12 }}>Not quite — try reordering.</div>
      )}
      {revealed && (
        <div style={{ fontSize: 13, color: C.text, marginTop: 12 }}>
          <span style={{ color: C.accentDark, fontWeight: 500 }}>Answer: </span>
          {sentence.es}
        </div>
      )}
    </div>
  );
}

function Tile({ children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? C.accentLight : C.bgSecondary,
        border: `0.5px solid ${active ? C.accent : C.border}`,
        color: active ? C.accentDark : C.text,
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: 15,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

// ----- comprehend: ES → EN multiple choice -----------------------------------
function ComprehendTask({ sentence, sentences, speechLang, onDone }) {
  const options = useMemo(() => {
    const distractors = shuffled(
      sentences.filter((s) => s.id !== sentence.id).map((s) => s.en)
    ).slice(0, 3);
    return shuffled([sentence.en, ...distractors]);
  }, [sentence.id]);

  const [wrongPicks, setWrongPicks] = useState([]); // option strings picked wrong
  const [chosen, setChosen] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const resolved = chosen != null || revealed;

  const pick = (opt) => {
    if (opt === sentence.en) setChosen(opt);
    else if (!wrongPicks.includes(opt)) setWrongPicks((w) => [...w, opt]);
  };

  const finish = () => {
    const score = revealed ? 0 : wrongPicks.length === 0 ? 1 : 0.5;
    onDone(score);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <TenseTag>understand · {sentence.tenses}</TenseTag>
        <ListenBtn text={sentence.es} lang={speechLang} />
      </div>

      <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4, marginTop: 12, color: C.accentDark }}>
        {sentence.es}
      </div>
      <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 6 }}>What does it mean?</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {options.map((opt) => {
          const isWrong = wrongPicks.includes(opt);
          const isChosen = chosen === opt;
          const showAsAnswer = (revealed || chosen != null) && opt === sentence.en;
          return (
            <button
              key={opt}
              onClick={() => !resolved && pick(opt)}
              disabled={resolved || isWrong}
              style={{
                textAlign: "left",
                background: showAsAnswer ? C.accentLight : isWrong ? C.bgTertiary : C.bg,
                border: `0.5px solid ${showAsAnswer ? C.success : isWrong ? C.danger : C.borderStrong}`,
                color: isWrong ? C.textTertiary : C.text,
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                cursor: resolved || isWrong ? "default" : "pointer",
                fontFamily: "inherit",
                textDecoration: isWrong ? "line-through" : "none",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {!resolved && <GhostBtn onClick={() => setRevealed(true)} style={{ marginLeft: "auto" }}>Reveal</GhostBtn>}
        {resolved && (
          <>
            {chosen != null && (
              <span style={{ fontSize: 13, color: C.success, fontWeight: 500, alignSelf: "center" }}>
                {wrongPicks.length === 0 ? "¡Correcto!" : "Got there."}
              </span>
            )}
            <PrimaryBtn onClick={finish} style={{ marginLeft: "auto" }}>Continue</PrimaryBtn>
          </>
        )}
      </div>
    </div>
  );
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

// ----- summary ---------------------------------------------------------------
function Summary({ results, onAgain, onClose }) {
  const done = results.length;
  const clean = results.filter((r) => r.score === 1).length;
  const avg = done ? results.reduce((a, r) => a + r.score, 0) / done : 0;
  const toReview = results
    .filter((r) => r.score < 0.75)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500 }}>Session complete</div>
      <div style={{ display: "flex", gap: 20, marginTop: 14, fontVariantNumeric: "tabular-nums" }}>
        <Stat label="practised" value={done} />
        <Stat label="clean first try" value={clean} />
        <Stat label="avg score" value={`${Math.round(avg * 100)}%`} />
      </div>
      {toReview.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>To review</div>
          {toReview.map((r, i) => (
            <div
              key={i}
              style={{
                fontSize: 13,
                color: C.textSecondary,
                padding: "5px 0",
                borderBottom: i < toReview.length - 1 ? `0.5px solid ${C.border}` : "none",
              }}
            >
              {r.en}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <PrimaryBtn onClick={onAgain}>Practice again</PrimaryBtn>
        <GhostBtn onClick={onClose} style={{ marginLeft: "auto" }}>Done</GhostBtn>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 500, color: C.text }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ----- session shell ---------------------------------------------------------
export default function PracticeSession({ sentences, speechLang = "es-ES", onGrade, onMarkSeen, onClose }) {
  const [queue, setQueue] = useState(() => buildSession(sentences));
  const [pos, setPos] = useState(0);
  const [results, setResults] = useState([]);

  // Escape closes (no global handler exists in the app — scope it here).
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const current = queue[pos];

  // Mark each sentence seen as it appears.
  useEffect(() => {
    if (current && onMarkSeen) onMarkSeen(current.sentence.id);
  }, [pos, current]);

  const handleDone = (score) => {
    const s = current.sentence;
    onGrade(s.id, score);
    setResults((r) => [...r, { id: s.id, en: s.en, task: current.task, score }]);
    setPos((p) => p + 1);
  };

  const restart = () => {
    setQueue(buildSession(sentences));
    setResults([]);
    setPos(0);
  };

  const finished = pos >= queue.length || queue.length === 0;

  return (
    <>
      <style>{`
        @keyframes practiceSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 200 }} />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(560px, calc(100vw - 24px))",
          maxHeight: "calc(100vh - 24px)",
          overflowY: "auto",
          background: C.bg,
          border: `0.5px solid ${C.borderStrong}`,
          borderRadius: 12,
          padding: 18,
          zIndex: 201,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header: progress + close */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 4, background: C.bgTertiary, borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: C.accent,
                  width: `${queue.length ? (Math.min(pos, queue.length) / queue.length) * 100 : 0}%`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
          <span style={{ fontSize: 11, color: C.textTertiary, fontVariantNumeric: "tabular-nums" }}>
            {Math.min(pos + (finished ? 0 : 1), queue.length)} of {queue.length}
          </span>
          <button
            onClick={onClose}
            aria-label="Close practice"
            style={{
              background: "transparent",
              border: "none",
              color: C.textTertiary,
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {finished ? (
          <Summary results={results} onAgain={restart} onClose={onClose} />
        ) : (
          <div key={pos} style={{ animation: "practiceSlide 0.3s ease" }}>
            {current.task === "produce" && (
              <ProduceTask sentence={current.sentence} speechLang={speechLang} onDone={handleDone} />
            )}
            {current.task === "scramble" && (
              <ScrambleTask sentence={current.sentence} speechLang={speechLang} onDone={handleDone} />
            )}
            {current.task === "comprehend" && (
              <ComprehendTask
                sentence={current.sentence}
                sentences={sentences}
                speechLang={speechLang}
                onDone={handleDone}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
