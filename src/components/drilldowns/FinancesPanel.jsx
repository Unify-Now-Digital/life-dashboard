import React from "react";
import { C } from "../../lib/tokens";
import { EditableText } from "../Editable.jsx";
import PanelHeader from "./PanelHeader.jsx";

export default function FinancesPanel({ data, onClose, onUpdate }) {
  const { income, spending, saved, currency } = data;
  const rate = income > 0 ? Math.round((saved / income) * 100) : 0;
  const living = Math.round(spending * 0.62);
  const food = Math.round(spending * 0.25);
  const fun = Math.max(0, spending - living - food);
  const total = income || 1;
  const segs = [
    { lbl: "Living", val: living, color: "#185FA5" },
    { lbl: "Food/social", val: food, color: "#378ADD" },
    { lbl: "Travel/fun", val: fun, color: "#85B7EB" },
    { lbl: "Saved", val: saved, color: "#1D9E75" },
  ];
  const fmt = (n) => `${currency}${n.toLocaleString()}`;

  const editRow = (key, label, color) => (
    <div
      key={key}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: `0.5px solid ${C.border}`,
      }}
    >
      <span style={{ fontSize: 13, color: C.textSecondary }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums", color }}>
        {currency}
        <EditableText
          value={String(data[key])}
          onChange={(v) => onUpdate(key, parseFloat(v) || 0)}
          style={{ fontSize: 14, fontWeight: 500 }}
          type="number"
        />
      </span>
    </div>
  );

  return (
    <div>
      <PanelHeader title="Finances — this month" onClose={onClose} />
      {editRow("income", "Income", C.success)}
      {editRow("spending", "Spending", C.text)}
      {editRow("saved", "Saved", C.text)}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 0",
          borderBottom: `0.5px solid ${C.border}`,
        }}
      >
        <span style={{ fontSize: 13, color: C.textSecondary }}>Savings rate</span>
        <span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: C.accent }}>
          {rate}%
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
        <span style={{ fontSize: 13, color: C.textSecondary }}>Currency</span>
        <select
          value={currency}
          onChange={(e) => onUpdate("currency", e.target.value)}
          style={{
            fontSize: 13,
            padding: "2px 6px",
            borderRadius: 4,
            border: `0.5px solid ${C.border}`,
            background: C.bg,
            fontFamily: "inherit",
          }}
        >
          {["€", "£", "$", "CHF"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: "flex",
            height: 8,
            borderRadius: 4,
            overflow: "hidden",
            gap: 2,
            background: C.bgTertiary,
          }}
        >
          {segs.map((s, i) => (
            <div key={i} style={{ width: `${(s.val / total) * 100}%`, height: "100%", background: s.color }} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 8,
            flexWrap: "wrap",
            fontSize: 11,
            color: C.textSecondary,
          }}
        >
          {segs.map((s, i) => (
            <span key={i}>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  marginRight: 5,
                  verticalAlign: "middle",
                  background: s.color,
                }}
              />
              {s.lbl} {fmt(s.val)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
