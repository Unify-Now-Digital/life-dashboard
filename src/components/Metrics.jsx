import React from "react";
import { C, styles } from "../lib/tokens";
import { EditableText } from "./Editable.jsx";

export default function Metrics({ m, onUpdate }) {
  const items = [
    { key: "smMTD", lbl: "Sears Melvin MTD", sub: "+£1,180 vs last month", sub_color: C.success },
    { key: "cmMTD", lbl: "Churchill MTD", sub: "+£2,300", sub_color: C.success },
    { key: "boddyPipeline", lbl: "BODDY pipeline", sub: "12 open deals", sub_color: C.textSecondary },
    { key: "netWorth", lbl: "Net worth", sub: "tap to set", sub_color: C.textTertiary },
    { key: "daysToTrip", lbl: "Days to next trip", sub: m.nextTripName, sub_color: C.textTertiary },
    { key: "spanishLevel", lbl: "Spanish level", sub: "on track for B2", sub_color: C.success },
  ];
  return (
    <div>
      <div style={{ ...styles.sectionH, padding: "0 4px" }}>Key metrics</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {items.map((it) => (
          <div key={it.key} style={{ background: C.bgSecondary, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: C.textSecondary }}>{it.lbl}</div>
            <div style={{ fontSize: 20, fontWeight: 500, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
              <EditableText
                value={m[it.key]}
                onChange={(v) => onUpdate(it.key, v)}
                style={{ fontSize: 20, fontWeight: 500 }}
              />
            </div>
            <div style={{ fontSize: 11, marginTop: 2, color: it.sub_color }}>{it.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
