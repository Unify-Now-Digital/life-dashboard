import React, { useState } from "react";
import { C, styles, AVATAR_STYLES, AVATAR_KEYS } from "../../lib/tokens";
import { EditableText, IconBtn, EditModeToggle } from "../Editable.jsx";
import Project from "./Project.jsx";
import { nextId } from "../../lib/defaultState";

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
        last: "—",
        action: "tap to set",
        stale: false,
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
                Last: <EditableText value={r.last} onChange={(v) => onUpdate(r.id, "last", v)} style={{ fontSize: 11 }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: r.stale ? C.danger : C.accent }}>
                <EditableText
                  value={r.action}
                  onChange={(v) => onUpdate(r.id, "action", v)}
                  style={{ fontSize: 11, fontWeight: 500, color: r.stale ? C.danger : C.accent }}
                />
              </span>
              {editing && (
                <label style={{ fontSize: 10, color: C.textTertiary, fontWeight: 400, cursor: "pointer" }}>
                  <input type="checkbox" checked={r.stale} onChange={(e) => onUpdate(r.id, "stale", e.target.checked)} style={{ marginRight: 4 }} />
                  overdue
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
