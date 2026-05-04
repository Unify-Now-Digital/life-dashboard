import React, { useState } from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import PanelHeader from "./PanelHeader.jsx";

export default function TravelPanel({ data, onClose, onUpdateStat, onUpdateTrip, onAddTrip, onRemoveTrip }) {
  const [editing, setEditing] = useState(false);
  const stats = [
    { key: "countries", lbl: "countries" },
    { key: "daysAwayYTD", lbl: "days away YTD" },
  ];
  return (
    <div>
      <PanelHeader title="Travel" editing={editing} onToggleEdit={() => setEditing(!editing)} onClose={onClose} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {stats.map((s) => (
          <div key={s.key} style={{ background: C.bgSecondary, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
              <EditableText
                value={String(data[s.key])}
                onChange={(v) => onUpdateStat(s.key, parseInt(v) || 0)}
                style={{ fontSize: 18, fontWeight: 500 }}
                type="number"
              />
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>{s.lbl}</div>
          </div>
        ))}
        <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
            {data.trips.length}
          </div>
          <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>trips planned</div>
        </div>
      </div>
      {data.trips.map((t, i) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "10px 0",
            borderBottom: i < data.trips.length - 1 ? `0.5px solid ${C.border}` : "none",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              <EditableText
                value={t.name}
                onChange={(v) => onUpdateTrip(t.id, "name", v)}
                style={{ fontSize: 14, fontWeight: 500 }}
              />
            </div>
            <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>
              <EditableText value={t.sub} onChange={(v) => onUpdateTrip(t.id, "sub", v)} style={{ fontSize: 11 }} />
            </div>
          </div>
          <div style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", color: C.textSecondary }}>
            <EditableText
              value={String(t.days)}
              onChange={(v) => onUpdateTrip(t.id, "days", parseInt(v) || 0)}
              style={{ fontSize: 13 }}
              type="number"
            />
            d
          </div>
          {editing && (
            <IconBtn onClick={() => onRemoveTrip(t.id)} danger label="Remove">
              ×
            </IconBtn>
          )}
        </div>
      ))}
      {editing && (
        <button onClick={onAddTrip} style={styles.addBtn}>
          + Add trip
        </button>
      )}
    </div>
  );
}
