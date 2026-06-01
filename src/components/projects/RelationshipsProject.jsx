import React, { useState } from "react";
import { C, styles, AVATAR_STYLES, AVATAR_KEYS } from "../../lib/tokens";
import { EditableText, IconBtn, EditModeToggle } from "../Editable.jsx";
import Project from "./Project.jsx";
import { nextId } from "../../lib/defaultState";

// Days since last contact, or null if never recorded.
function daysSince(iso) {
  if (!iso) return null;
  const then = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today - then) / 86400000);
}
// A contact is overdue when more days have passed than its cadence allows.
function isOverdue(contact) {
  const d = daysSince(contact.lastContact);
  if (d == null) return false;
  return d > (contact.cadenceDays || 0);
}
function agoLabel(iso) {
  const d = daysSince(iso);
  if (d == null) return "never";
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

export default function RelationshipsProject({ state, setState, meta, onClose, goalHandlers, hideHeader }) {
  const data = state.projects.relationships;
  const [editing, setEditing] = useState(false);

  const updateContacts = (updater) =>
    setState((s) => ({
      ...s,
      projects: { ...s.projects, relationships: { ...s.projects.relationships, contacts: updater(s.projects.relationships.contacts) } },
    }));

  const onAdd = () =>
    updateContacts((cs) => [
      ...cs,
      {
        id: nextId(cs),
        name: "New person",
        initials: "NP",
        color: AVATAR_KEYS[cs.length % AVATAR_KEYS.length],
        lastContact: new Date().toISOString().slice(0, 10),
        channel: "",
        cadenceDays: 7,
        action: "",
      },
    ]);
  const onUpdate = (id, field, value) =>
    updateContacts((cs) => cs.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  const onRemove = (id) => updateContacts((cs) => cs.filter((c) => c.id !== id));

  return (
    <Project
      title="Relationships"
      color={meta.color}
      onClose={onClose}
      goals={data.goals}
      goalHandlers={goalHandlers}
      headerExtras={<EditModeToggle editing={editing} onToggle={() => setEditing(!editing)} />}
      hideHeader={hideHeader}
    >
      {data.contacts.map((r, i) => {
        const av = AVATAR_STYLES[r.color] || AVATAR_STYLES.blue;
        const overdue = isOverdue(r);
        return (
          <div
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: i < data.contacts.length - 1 ? `0.5px solid ${C.border}` : "none",
            }}
          >
            {editing ? (
              <select
                value={r.color}
                onChange={(e) => onUpdate(r.id, "color", e.target.value)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: av.bg, color: av.color, border: "none",
                  fontSize: 11, fontWeight: 500, textAlign: "center",
                  cursor: "pointer", fontFamily: "inherit", appearance: "none", WebkitAppearance: "none",
                }}
              >
                {AVATAR_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0, background: av.bg, color: av.color }}>
                {r.initials}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                <EditableText
                  value={r.name}
                  onChange={(v) => {
                    onUpdate(r.id, "name", v);
                    const initials = v.split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();
                    onUpdate(r.id, "initials", initials);
                  }}
                  style={{ fontSize: 14, fontWeight: 500 }}
                />
              </div>
              <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>
                {editing ? (
                  <>
                    Last:{" "}
                    <EditableText value={r.lastContact || ""} onChange={(v) => onUpdate(r.id, "lastContact", v || null)} placeholder="YYYY-MM-DD" style={{ fontSize: 11 }} />
                    {" · "}
                    <EditableText value={r.channel || ""} onChange={(v) => onUpdate(r.id, "channel", v)} placeholder="channel" style={{ fontSize: 11 }} />
                  </>
                ) : (
                  <>
                    {agoLabel(r.lastContact)}
                    {r.channel ? ` · ${r.channel}` : ""}
                  </>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: overdue ? C.danger : C.accent }}>
                {overdue && !(r.action || "").trim() ? (
                  "overdue"
                ) : (
                  <EditableText
                    value={r.action}
                    onChange={(v) => onUpdate(r.id, "action", v)}
                    placeholder="next step"
                    style={{ fontSize: 11, fontWeight: 500, color: overdue ? C.danger : C.accent }}
                  />
                )}
              </span>
              {editing && (
                <label style={{ fontSize: 10, color: C.textTertiary, fontWeight: 400 }}>
                  every{" "}
                  <EditableText
                    value={String(r.cadenceDays ?? 7)}
                    onChange={(v) => onUpdate(r.id, "cadenceDays", Math.max(1, parseInt(v) || 7))}
                    type="number"
                    style={{ fontSize: 10 }}
                  />
                  {" days"}
                </label>
              )}
            </div>
            {editing && (<IconBtn onClick={() => onRemove(r.id)} danger label="Remove">×</IconBtn>)}
          </div>
        );
      })}
      {editing && (<button onClick={onAdd} style={styles.addBtn}>+ Add person</button>)}
    </Project>
  );
}
