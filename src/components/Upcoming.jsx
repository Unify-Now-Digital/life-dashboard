import React, { useState } from "react";
import { C, CAT_STYLES, CAT_KEYS, styles } from "../lib/tokens";
import { EditableText, IconBtn, EditModeToggle } from "./Editable.jsx";

export default function Upcoming({ items, onUpdate, onAdd, onRemove }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        <span>
          Upcoming <span style={styles.sectionSub}>next 7 days</span>
        </span>
        <EditModeToggle editing={editing} onToggle={() => setEditing(!editing)} />
      </div>
      {items.map((item, i) => {
        const cat = CAT_STYLES[item.cat] || { bg: C.bgSecondary, color: C.textSecondary };
        return (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: i < items.length - 1 ? `0.5px solid ${C.border}` : "none",
            }}
          >
            <span style={{ fontSize: 12, color: C.textTertiary, minWidth: 56, fontWeight: 500 }}>
              <EditableText value={item.date} onChange={(v) => onUpdate(item.id, "date", v)} style={{ fontSize: 12 }} />
            </span>
            <span style={{ fontSize: 14, color: C.text, flex: 1 }}>
              <EditableText value={item.text} onChange={(v) => onUpdate(item.id, "text", v)} style={{ fontSize: 14 }} />
            </span>
            {editing ? (
              <select
                value={item.cat}
                onChange={(e) => onUpdate(item.id, "cat", e.target.value)}
                style={{
                  fontSize: 11,
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: `0.5px solid ${C.border}`,
                  background: cat.bg,
                  color: cat.color,
                  fontWeight: 500,
                  fontFamily: "inherit",
                }}
              >
                {CAT_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 500,
                  background: cat.bg,
                  color: cat.color,
                }}
              >
                {item.cat}
              </span>
            )}
            {editing && (
              <IconBtn onClick={() => onRemove(item.id)} danger label="Remove">
                ×
              </IconBtn>
            )}
          </div>
        );
      })}
      {editing && (
        <button onClick={onAdd} style={styles.addBtn}>
          + Add upcoming item
        </button>
      )}
    </div>
  );
}
