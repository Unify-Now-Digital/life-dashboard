import React, { useState } from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn, EditModeToggle } from "../Editable.jsx";
import Project from "./Project.jsx";
import LanguageDeck from "../LanguageDeck.jsx";
import PracticeSession from "../PracticeSession.jsx";
import { nextId } from "../../lib/defaultState";
import { nextRate } from "../../lib/sentences";

// Per-language deck handlers. `langSlot` is the key under
// state.projects.learning that holds the deck (e.g. "spanish" / "turkish").
function makeDeckHandlers(setState, langSlot) {
  const update = (updater) =>
    setState((s) => ({
      ...s,
      projects: {
        ...s.projects,
        learning: { ...s.projects.learning, [langSlot]: updater(s.projects.learning[langSlot]) },
      },
    }));
  return {
    onCyclePhrase: () =>
      update((sp) => ({ ...sp, phraseIndex: (sp.phraseIndex + 1) % sp.phrases.length })),
    onMarkPhraseSeen: (phraseId) =>
      update((sp) => {
        const seen = sp.phrasesSeen || [];
        if (seen.includes(phraseId)) return sp;
        return { ...sp, phrasesSeen: [...seen, phraseId] };
      }),
    onGradeSentence: (id, score) =>
      update((sp) => ({
        ...sp,
        sentences: (sp.sentences || []).map((s) =>
          s.id === id
            ? {
                ...s,
                attempts: (s.attempts || 0) + 1,
                rate: nextRate(s.rate || 0, s.attempts || 0, score),
                lastSeen: Date.now(),
              }
            : s
        ),
      })),
    onMarkSentenceSeen: (sentenceId) =>
      update((sp) => {
        const seen = sp.sentencesSeen || [];
        if (seen.includes(sentenceId)) return sp;
        return { ...sp, sentencesSeen: [...seen, sentenceId] };
      }),
    onRateChunk: (id, rating) =>
      update((sp) => {
        const chunks = sp.chunks.map((c) => {
          if (c.id !== id) return c;
          if (rating === "good") return { ...c, bucket: Math.min(c.bucket + 1, 5), lastSeen: Date.now() };
          if (rating === "hard") return { ...c, lastSeen: Date.now() };
          return { ...c, bucket: 0, lastSeen: Date.now() };
        });
        return { ...sp, chunks, chunkIndex: (sp.chunkIndex + 1) % sp.chunks.length };
      }),
    onCheckVerb: (id, allFilledAndRight) =>
      update((sp) => ({
        ...sp,
        verbs: sp.verbs.map((v) =>
          v.id === id ? { ...v, correctPasses: allFilledAndRight ? v.correctPasses + 1 : 0 } : v
        ),
      })),
  };
}

export default function LearningProject({ state, setState, meta, onClose, goalHandlers, hideHeader }) {
  const data = state.projects.learning;
  const [tab, setTab] = useState("spanish");
  // null when closed, otherwise the deck slot being practised ("spanish" | "turkish").
  const [practiceLang, setPracticeLang] = useState(null);

  const spanishHandlers = makeDeckHandlers(setState, "spanish");
  const turkishHandlers = makeDeckHandlers(setState, "turkish");

  const PRACTICE = {
    spanish: { langKey: "es", speechLang: "es-AR", handlers: spanishHandlers },
    turkish: { langKey: "tr", speechLang: "tr-TR", handlers: turkishHandlers },
  };
  const practiceCfg = practiceLang ? PRACTICE[practiceLang] : null;

  // Reading list handlers
  const updateReading = (updater) =>
    setState((s) => ({
      ...s,
      projects: { ...s.projects, learning: { ...s.projects.learning, reading: updater(s.projects.learning.reading) } },
    }));
  const readingH = {
    onAdd: () =>
      updateReading((r) => [
        ...r,
        { id: nextId(r), title: "New book", pages: { current: 0, total: 0 }, reviewedAt: null, review: "", rating: 0 },
      ]),
    onUpdate: (id, field, value) =>
      updateReading((r) => r.map((b) => (b.id === id ? { ...b, [field]: value } : b))),
    onRemove: (id) => updateReading((r) => r.filter((b) => b.id !== id)),
  };

  return (
    <Project title="Learning" color={meta.color} onClose={onClose} goals={data.goals} goalHandlers={goalHandlers} hideHeader={hideHeader}>
      <Tabs tab={tab} onChange={setTab} />

      {tab === "spanish" && (
        <LanguageDeck
          data={data.spanish}
          langKey="es"
          title="Spanish"
          subtitle="B1 → B2 · vos"
          pronoun="yo"
          onStartPractice={() => setPracticeLang("spanish")}
          {...spanishHandlers}
        />
      )}
      {tab === "turkish" && (
        <LanguageDeck
          data={data.turkish}
          langKey="tr"
          title="Turkish"
          subtitle="A1 · informal sen"
          pronoun="ben"
          onStartPractice={() => setPracticeLang("turkish")}
          {...turkishHandlers}
        />
      )}
      {practiceCfg && (
        <PracticeSession
          sentences={data[practiceLang].sentences || []}
          langKey={practiceCfg.langKey}
          speechLang={practiceCfg.speechLang}
          onGrade={practiceCfg.handlers.onGradeSentence}
          onMarkSeen={practiceCfg.handlers.onMarkSentenceSeen}
          onClose={() => setPracticeLang(null)}
        />
      )}
      {tab === "reading" && <ReadingList items={data.reading} {...readingH} />}
    </Project>
  );
}

function Tabs({ tab, onChange }) {
  const tabs = [
    { id: "spanish", label: "Spanish" },
    { id: "turkish", label: "Turkish" },
    { id: "reading", label: "Reading" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              background: active ? C.accentLight : "transparent",
              color: active ? C.accentDark : C.textSecondary,
              border: `0.5px solid ${active ? C.accent : C.border}`,
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// Read-progress derives from pages; rating is 1–5 stars.
function pctFor(pages) {
  const total = pages?.total || 0;
  const current = pages?.current || 0;
  return total > 0 ? Math.max(0, Math.min(100, Math.round((current / total) * 100))) : 0;
}

function Stars({ value, onChange }) {
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: 0, fontSize: 13, lineHeight: 1,
            color: n <= value ? C.accent : C.border, fontFamily: "inherit",
          }}
        >
          ★
        </button>
      ))}
    </span>
  );
}

function ReadingList({ items, onAdd, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <EditModeToggle editing={editing} onToggle={() => setEditing(!editing)} />
      </div>
      {items.map((b, i) => {
        const pages = b.pages || { current: 0, total: 0 };
        const pct = pctFor(pages);
        const setPages = (patch) => onUpdate(b.id, "pages", { ...pages, ...patch });
        return (
          <div
            key={b.id}
            style={{
              display: "flex",
              gap: 12,
              padding: "10px 0",
              borderBottom: i < items.length - 1 ? `0.5px solid ${C.border}` : "none",
            }}
          >
            <div
              style={{
                width: 36, height: 50,
                background: C.bgTertiary, color: C.textTertiary,
                borderRadius: 3, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, textAlign: "center", padding: 4, lineHeight: 1.2, fontWeight: 500,
              }}
            >
              {(b.title || "").split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "—"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                <EditableText value={b.title} onChange={(v) => onUpdate(b.id, "title", v)} style={{ fontSize: 14, fontWeight: 500 }} />
              </div>
              <div style={{ height: 3, background: C.bgTertiary, borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", background: C.accent, width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                p.
                <EditableText
                  value={String(pages.current)}
                  onChange={(v) => setPages({ current: Math.max(0, parseInt(v) || 0) })}
                  style={{ fontSize: 11 }}
                  type="number"
                />
                {" / "}
                <EditableText
                  value={String(pages.total)}
                  onChange={(v) => setPages({ total: Math.max(0, parseInt(v) || 0) })}
                  style={{ fontSize: 11 }}
                  type="number"
                />
                {` · ${pct}%`}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <Stars value={b.rating || 0} onChange={(n) => onUpdate(b.id, "rating", n)} />
                <span style={{ fontSize: 11, color: C.textTertiary }}>
                  reviewed{" "}
                  <EditableText
                    value={b.reviewedAt || ""}
                    onChange={(v) => onUpdate(b.id, "reviewedAt", v || null)}
                    type="date"
                    placeholder="date"
                    style={{ fontSize: 11 }}
                  />
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                <EditableText
                  value={b.review || ""}
                  onChange={(v) => onUpdate(b.id, "review", v)}
                  placeholder="review…"
                  style={{ fontSize: 12 }}
                />
              </div>
            </div>
            {editing && (<IconBtn onClick={() => onRemove(b.id)} danger label="Remove">×</IconBtn>)}
          </div>
        );
      })}
      {editing && (
        <button onClick={onAdd} style={{ ...styles.addBtn, marginTop: 10 }}>+ Add book</button>
      )}
    </div>
  );
}
