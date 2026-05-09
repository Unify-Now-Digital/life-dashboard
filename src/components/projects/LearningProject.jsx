import React, { useState } from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn, EditModeToggle } from "../Editable.jsx";
import Project from "./Project.jsx";
import LanguageDeck from "../LanguageDeck.jsx";
import { nextId } from "../../lib/defaultState";

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

export default function LearningProject({ state, setState, meta, onClose, goalHandlers }) {
  const data = state.projects.learning;
  const [tab, setTab] = useState("spanish");

  const spanishHandlers = makeDeckHandlers(setState, "spanish");
  const turkishHandlers = makeDeckHandlers(setState, "turkish");

  // Reading list handlers
  const updateReading = (updater) =>
    setState((s) => ({
      ...s,
      projects: { ...s.projects, learning: { ...s.projects.learning, reading: updater(s.projects.learning.reading) } },
    }));
  const readingH = {
    onAdd: (kind) =>
      updateReading((r) =>
        kind === "podcast"
          ? [...r, { id: nextId(r), title: "New podcast", author: "Podcast", progress: null, sub: "" }]
          : [...r, { id: nextId(r), title: "New book", author: "Author", progress: 0, sub: "ch. 1" }]
      ),
    onUpdate: (id, field, value) =>
      updateReading((r) => r.map((b) => (b.id === id ? { ...b, [field]: value } : b))),
    onRemove: (id) => updateReading((r) => r.filter((b) => b.id !== id)),
  };

  return (
    <Project title="Learning" color={meta.color} onClose={onClose} goals={data.goals} goalHandlers={goalHandlers}>
      <Tabs tab={tab} onChange={setTab} />

      {tab === "spanish" && (
        <LanguageDeck
          data={data.spanish}
          langKey="es"
          title="Spanish"
          subtitle="B1 → B2 · vos"
          pronoun="yo"
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
          {...turkishHandlers}
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

function ReadingList({ items, onAdd, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <EditModeToggle editing={editing} onToggle={() => setEditing(!editing)} />
      </div>
      {items.map((b, i) => (
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
              background: b.progress === null ? C.accentLight : C.bgTertiary,
              color: b.progress === null ? "#0C447C" : C.textTertiary,
              borderRadius: 3, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, textAlign: "center", padding: 4, lineHeight: 1.2, fontWeight: 500,
            }}
          >
            {b.progress === null ? "pod" : b.title.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "—"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              <EditableText value={b.title} onChange={(v) => onUpdate(b.id, "title", v)} style={{ fontSize: 14, fontWeight: 500 }} />
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
              <EditableText value={b.author} onChange={(v) => onUpdate(b.id, "author", v)} style={{ fontSize: 12 }} />
            </div>
            {b.progress !== null && (
              <>
                <div style={{ height: 3, background: C.bgTertiary, borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: C.accent, width: `${b.progress}%` }} />
                </div>
                <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                  <EditableText
                    value={String(b.progress)}
                    onChange={(v) => onUpdate(b.id, "progress", Math.max(0, Math.min(100, parseInt(v) || 0)))}
                    style={{ fontSize: 11 }}
                    type="number"
                  />
                  {"% · "}
                  <EditableText value={b.sub} onChange={(v) => onUpdate(b.id, "sub", v)} style={{ fontSize: 11 }} />
                </div>
              </>
            )}
          </div>
          {editing && (<IconBtn onClick={() => onRemove(b.id)} danger label="Remove">×</IconBtn>)}
        </div>
      ))}
      {editing && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => onAdd("book")} style={{ ...styles.addBtn, marginTop: 0, flex: 1 }}>+ Add book</button>
          <button onClick={() => onAdd("podcast")} style={{ ...styles.addBtn, marginTop: 0, flex: 1 }}>+ Add podcast</button>
        </div>
      )}
    </div>
  );
}
