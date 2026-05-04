import React, { useState } from "react";
import { C, styles } from "../lib/tokens";
import { EditableText, IconBtn, EditModeToggle } from "./Editable.jsx";

export default function Goals({ goals, onUpdate, onAdd, onRemove }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        Active goals
        <EditModeToggle editing={editing} onToggle={() => setEditing(!editing)} />
      </div>
      {goals.map((g, i) => {
        const pct = g.target ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
        return (
          <div
            key={g.id}
            style={{
              padding: "12px 0",
              borderBottom: i < goals.length - 1 ? `0.5px solid ${C.border}` : "none",
              paddingTop: i === 0 ? 0 : 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, flex: 1 }}>
                <EditableText value={g.label} onChange={(v) => onUpdate(g.id, "label", v)} style={{ fontSize: 14 }} />
              </span>
              <span style={{ fontSize: 13, color: C.textSecondary, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                <EditableText
                  value={String(g.current)}
                  onChange={(v) => onUpdate(g.id, "current", parseFloat(v) || 0)}
                  style={{ fontSize: 13 }}
                  type="number"
                />
                {" / "}
                <EditableText
                  value={String(g.target)}
                  onChange={(v) => onUpdate(g.id, "target", parseFloat(v) || 1)}
                  style={{ fontSize: 13 }}
                  type="number"
                />
              </span>
              {editing && (
                <IconBtn onClick={() => onRemove(g.id)} danger label="Remove">
                  ×
                </IconBtn>
              )}
            </div>
            <div style={{ height: 4, background: C.bgTertiary, borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
              <div
                style={{
                  height: "100%",
                  background: C.accent,
                  borderRadius: 2,
                  width: `${pct}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
        );
      })}
      {editing && (
        <button onClick={onAdd} style={styles.addBtn}>
          + Add goal
        </button>
      )}
    </div>
  );
}
