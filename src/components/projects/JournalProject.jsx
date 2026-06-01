import React, { useState } from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import Project from "./Project.jsx";

const isoToday = () => new Date().toISOString().slice(0, 10);
const weekISO = (d = new Date()) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};
const monthISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default function JournalProject({ state, setState, meta, onClose, goalHandlers, hideHeader }) {
  const data = state.projects.journal;
  const [tab, setTab] = useState("entries");

  const updateJournal = (updater) =>
    setState((s) => ({ ...s, projects: { ...s.projects, journal: updater(s.projects.journal) } }));

  // Entries
  const addEntry = () =>
    updateJournal((j) => ({
      ...j,
      entries: [{ id: Date.now(), date: isoToday(), text: "", isPrivate: false }, ...(j.entries || [])],
    }));
  const updateEntry = (id, patch) =>
    updateJournal((j) => ({ ...j, entries: j.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const removeEntry = (id) => updateJournal((j) => ({ ...j, entries: j.entries.filter((e) => e.id !== id) }));

  // Mood
  const upsertMood = (date, patch) =>
    updateJournal((j) => {
      const idx = (j.mood || []).findIndex((m) => m.date === date);
      const next = [...(j.mood || [])];
      if (idx >= 0) next[idx] = { ...next[idx], ...patch };
      else next.push({ date, energy: 3, mood: 3, ...patch });
      return { ...j, mood: next };
    });

  // Top of mind — FIFO at ~10. Entries are { id, text } objects.
  const addTop = () =>
    updateJournal((j) => {
      const list = j.topOfMind || [];
      const id = list.reduce((m, t) => Math.max(m, t.id || 0), 0) + 1;
      return { ...j, topOfMind: [{ id, text: "" }, ...list].slice(0, 10) };
    });
  const updateTop = (id, value) =>
    updateJournal((j) => ({
      ...j,
      topOfMind: (j.topOfMind || []).map((t) => (t.id === id ? { ...t, text: value } : t)),
    }));
  const removeTop = (id) =>
    updateJournal((j) => ({ ...j, topOfMind: (j.topOfMind || []).filter((t) => t.id !== id) }));

  // Weekly
  const addWeekly = () =>
    updateJournal((j) => ({
      ...j,
      weekly: [
        { weekISO: weekISO(), prompts: [{ q: "What went well?", a: "" }, { q: "What didn't?", a: "" }, { q: "What's next?", a: "" }] },
        ...(j.weekly || []),
      ],
    }));
  const updateWeekly = (wk, qi, value) =>
    updateJournal((j) => ({
      ...j,
      weekly: j.weekly.map((w) =>
        w.weekISO === wk ? { ...w, prompts: w.prompts.map((p, i) => (i === qi ? { ...p, a: value } : p)) } : w
      ),
    }));

  // Monthly
  const addMonthly = () =>
    updateJournal((j) => ({
      ...j,
      monthly: [
        { monthISO: monthISO(), prompts: [{ q: "Theme", a: "" }, { q: "Win", a: "" }, { q: "Lesson", a: "" }], autoSummary: "" },
        ...(j.monthly || []),
      ],
    }));
  const updateMonthly = (mo, qi, value) =>
    updateJournal((j) => ({
      ...j,
      monthly: j.monthly.map((m) =>
        m.monthISO === mo ? { ...m, prompts: m.prompts.map((p, i) => (i === qi ? { ...p, a: value } : p)) } : m
      ),
    }));

  return (
    <Project title="Journal" color={meta.color} onClose={onClose} goals={data.goals} goalHandlers={goalHandlers} hideHeader={hideHeader}>
      <Tabs tab={tab} onChange={setTab} />

      {tab === "entries" && (
        <div>
          <button onClick={addEntry} style={styles.addBtn}>+ New entry</button>
          {(data.entries || []).map((e) => (
            <div key={e.id} style={{ marginTop: 12, padding: 12, background: C.bgSecondary, borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.textTertiary }}>
                  <EditableText value={e.date} onChange={(v) => updateEntry(e.id, { date: v })} style={{ fontSize: 11 }} />
                </span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ fontSize: 10, color: C.textTertiary, display: "flex", alignItems: "center", gap: 3 }}>
                    <input
                      type="checkbox"
                      checked={!!e.isPrivate}
                      onChange={(ev) => updateEntry(e.id, { isPrivate: ev.target.checked })}
                    />
                    private
                  </label>
                  <IconBtn onClick={() => removeEntry(e.id)} danger label="Remove">×</IconBtn>
                </div>
              </div>
              {e.label && (
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 6 }}>
                  <EditableText
                    value={e.label}
                    onChange={(v) => updateEntry(e.id, { label: v })}
                    style={{ fontSize: 13, fontWeight: 500 }}
                  />
                </div>
              )}
              {Array.isArray(e.images) && e.images.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {e.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={e.label || "diary photo"}
                      style={{
                        maxWidth: "100%",
                        maxHeight: 240,
                        borderRadius: 6,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ))}
                </div>
              )}
              <textarea
                value={e.text}
                onChange={(ev) => updateEntry(e.id, { text: ev.target.value })}
                placeholder="What mattered today?"
                style={{
                  width: "100%", border: `0.5px solid ${C.border}`, background: C.bg,
                  padding: 10, borderRadius: 6, fontSize: 14, color: C.text,
                  minHeight: 60, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {tab === "mood" && (
        <MoodLog mood={data.mood} onUpsert={upsertMood} />
      )}

      {tab === "topOfMind" && (
        <div>
          <button onClick={addTop} style={styles.addBtn}>+ Add</button>
          {(data.topOfMind || []).map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `0.5px solid ${C.border}` }}>
              <span style={{ flex: 1, fontSize: 14 }}>
                <EditableText value={t.text} onChange={(v) => updateTop(t.id, v)} placeholder="Top of mind…" style={{ fontSize: 14 }} />
              </span>
              <IconBtn onClick={() => removeTop(t.id)} danger label="Remove">×</IconBtn>
            </div>
          ))}
        </div>
      )}

      {tab === "weekly" && (
        <div>
          <button onClick={addWeekly} style={styles.addBtn}>+ This week</button>
          {(data.weekly || []).map((w) => (
            <div key={w.weekISO} style={{ marginTop: 12, padding: 12, background: C.bgSecondary, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 6 }}>{w.weekISO}</div>
              {w.prompts.map((p, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 2 }}>{p.q}</div>
                  <textarea
                    value={p.a}
                    onChange={(e) => updateWeekly(w.weekISO, i, e.target.value)}
                    style={{ width: "100%", border: `0.5px solid ${C.border}`, padding: 8, fontSize: 13, borderRadius: 6, minHeight: 40, fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "monthly" && (
        <div>
          <button onClick={addMonthly} style={styles.addBtn}>+ This month</button>
          {(data.monthly || []).map((m) => (
            <div key={m.monthISO} style={{ marginTop: 12, padding: 12, background: C.bgSecondary, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 6 }}>{m.monthISO}</div>
              {m.prompts.map((p, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 2 }}>{p.q}</div>
                  <textarea
                    value={p.a}
                    onChange={(e) => updateMonthly(m.monthISO, i, e.target.value)}
                    style={{ width: "100%", border: `0.5px solid ${C.border}`, padding: 8, fontSize: 13, borderRadius: 6, minHeight: 40, fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Project>
  );
}

function MoodLog({ mood, onUpsert }) {
  const today = isoToday();
  const todayEntry = (mood || []).find((m) => m.date === today) || { date: today, energy: 3, mood: 3 };
  const recent = (mood || []).slice(-14).reverse();
  return (
    <div>
      <div style={{ background: C.bgSecondary, borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.textTertiary, marginBottom: 8 }}>Today — {today}</div>
        <Slider label="Energy" value={todayEntry.energy} onChange={(v) => onUpsert(today, { energy: v })} />
        <Slider label="Mood" value={todayEntry.mood} onChange={(v) => onUpsert(today, { mood: v })} />
      </div>
      <div style={{ fontSize: 11, color: C.textTertiary, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
        Recent
      </div>
      {recent.length === 0 && (
        <div style={{ fontSize: 11, color: C.textTertiary, padding: "4px 0" }}>no log yet</div>
      )}
      {recent.map((r) => (
        <div key={r.date} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `0.5px solid ${C.border}` }}>
          <span style={{ fontSize: 11, color: C.textTertiary, width: 88 }}>{r.date}</span>
          <span style={{ fontSize: 12, flex: 1 }}>energy {r.energy} · mood {r.mood}</span>
        </div>
      ))}
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.textSecondary }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 500 }}>{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

function Tabs({ tab, onChange }) {
  const tabs = [
    { id: "entries", label: "Entries" },
    { id: "mood", label: "Mood" },
    { id: "topOfMind", label: "Top of mind" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
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
