import React, { useState } from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import PanelHeader from "./PanelHeader.jsx";

export default function ReadingPanel({ items, onClose, onUpdate, onAdd, onRemove }) {
  const [editing, setEditing] = useState(false);
  return (
    <div>
      <PanelHeader
        title="Reading & learning"
        editing={editing}
        onToggleEdit={() => setEditing(!editing)}
        onClose={onClose}
      />
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
              width: 36,
              height: 50,
              background: b.progress === null ? C.accentLight : C.bgTertiary,
              color: b.progress === null ? "#0C447C" : C.textTertiary,
              borderRadius: 3,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              textAlign: "center",
              padding: 4,
              lineHeight: 1.2,
              fontWeight: 500,
            }}
          >
            {b.progress === null
              ? "pod"
              : b.title
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0] || "")
                  .join("")
                  .toUpperCase() || "—"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              <EditableText
                value={b.title}
                onChange={(v) => onUpdate(b.id, "title", v)}
                style={{ fontSize: 14, fontWeight: 500 }}
              />
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
                    onChange={(v) =>
                      onUpdate(b.id, "progress", Math.max(0, Math.min(100, parseInt(v) || 0)))
                    }
                    style={{ fontSize: 11 }}
                    type="number"
                  />
                  {"% · "}
                  <EditableText value={b.sub} onChange={(v) => onUpdate(b.id, "sub", v)} style={{ fontSize: 11 }} />
                </div>
              </>
            )}
          </div>
          {editing && (
            <IconBtn onClick={() => onRemove(b.id)} danger label="Remove">
              ×
            </IconBtn>
          )}
        </div>
      ))}
      {editing && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => onAdd("book")} style={{ ...styles.addBtn, marginTop: 0, flex: 1 }}>
            + Add book
          </button>
          <button onClick={() => onAdd("podcast")} style={{ ...styles.addBtn, marginTop: 0, flex: 1 }}>
            + Add podcast
          </button>
        </div>
      )}
    </div>
  );
}
