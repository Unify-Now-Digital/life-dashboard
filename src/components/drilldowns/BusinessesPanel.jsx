import React, { useState } from "react";
import { C, BIZ_COLORS, styles } from "../../lib/tokens";
import { EditableText } from "../Editable.jsx";
import PanelHeader from "./PanelHeader.jsx";

export default function BusinessesPanel({ items, onClose, onUpdate, onAdd, onRemove }) {
  const [editing, setEditing] = useState(false);
  return (
    <div>
      <PanelHeader title="Businesses" editing={editing} onToggleEdit={() => setEditing(!editing)} onClose={onClose} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {items.map((b) => (
          <div
            key={b.id}
            style={{
              background: C.bgSecondary,
              borderRadius: 8,
              padding: "12px 14px",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: C.textTertiary,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontWeight: 500,
              }}
            >
              {editing ? (
                <select
                  value={b.color}
                  onChange={(e) => onUpdate(b.id, "color", e.target.value)}
                  style={{
                    width: 16,
                    height: 16,
                    marginRight: 6,
                    border: "none",
                    background: b.color,
                    color: b.color,
                    verticalAlign: "middle",
                    appearance: "none",
                    WebkitAppearance: "none",
                    cursor: "pointer",
                    borderRadius: "50%",
                  }}
                >
                  {BIZ_COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    marginRight: 6,
                    verticalAlign: "middle",
                    background: b.color,
                  }}
                />
              )}
              <EditableText value={b.name} onChange={(v) => onUpdate(b.id, "name", v)} style={{ fontSize: 11 }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
              <EditableText
                value={b.value}
                onChange={(v) => onUpdate(b.id, "value", v)}
                style={{ fontSize: 18, fontWeight: 500 }}
              />
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 6 }}>
              <EditableText value={b.meta} onChange={(v) => onUpdate(b.id, "meta", v)} style={{ fontSize: 11 }} />
            </div>
            {editing && (
              <button
                onClick={() => onRemove(b.id)}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  background: "transparent",
                  border: "none",
                  color: C.danger,
                  fontSize: 16,
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <button onClick={onAdd} style={styles.addBtn}>
          + Add business
        </button>
      )}
    </div>
  );
}
