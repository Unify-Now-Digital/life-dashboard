import React, { useState } from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import PanelHeader from "./PanelHeader.jsx";

const SEG_COLORS = ["#185FA5", "#378ADD", "#85B7EB", "#1D9E75", "#993556", "#BA7517", "#534AB7", "#3B6D11"];

function Row({ item, onUpdate, onRemove, currency, editing, color }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: `0.5px solid ${C.border}`,
      }}
    >
      {color && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: 2,
            background: color,
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ flex: 1, fontSize: 13, color: C.textSecondary }}>
        <EditableText
          value={item.label}
          onChange={(v) => onUpdate(item.id, "label", v)}
          style={{ fontSize: 13 }}
        />
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
        {currency}
        <EditableText
          value={String(item.amount)}
          onChange={(v) => onUpdate(item.id, "amount", parseFloat(v) || 0)}
          style={{ fontSize: 14, fontWeight: 500 }}
          type="number"
        />
      </span>
      {editing && (
        <IconBtn onClick={() => onRemove(item.id)} danger label="Remove">
          ×
        </IconBtn>
      )}
    </div>
  );
}

function StackedBar({ rows, total }) {
  if (!total) return null;
  return (
    <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 2, background: C.bgTertiary }}>
      {rows.map((r, i) => (
        <div
          key={r.id}
          style={{
            width: `${(r.amount / total) * 100}%`,
            height: "100%",
            background: SEG_COLORS[i % SEG_COLORS.length],
          }}
        />
      ))}
    </div>
  );
}

export default function FinancesPanel({
  data,
  onClose,
  onUpdate,
  onUpdateIncome,
  onAddIncome,
  onRemoveIncome,
  onUpdateExpense,
  onAddExpense,
  onRemoveExpense,
}) {
  const [editing, setEditing] = useState(false);
  const currency = data.currency || "€";
  const incomeRows = data.incomeBreakdown || [];
  const expenseRows = data.expenseBreakdown || [];
  const incomeTotal = incomeRows.reduce((a, b) => a + (b.amount || 0), 0);
  const expenseTotal = expenseRows.reduce((a, b) => a + (b.amount || 0), 0);
  const saved = Math.max(0, incomeTotal - expenseTotal);
  const rate = incomeTotal > 0 ? Math.round((saved / incomeTotal) * 100) : 0;
  const fmt = (n) => `${currency}${n.toLocaleString()}`;

  return (
    <div>
      <PanelHeader title="Finances — this month" editing={editing} onToggleEdit={() => setEditing(!editing)} onClose={onClose} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.textSecondary }}>Income</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2, color: C.success, fontVariantNumeric: "tabular-nums" }}>
            {fmt(incomeTotal)}
          </div>
        </div>
        <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.textSecondary }}>Spending</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {fmt(expenseTotal)}
          </div>
        </div>
        <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.textSecondary }}>Saved</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {fmt(saved)}
          </div>
        </div>
        <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.textSecondary }}>Rate</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2, color: C.accent, fontVariantNumeric: "tabular-nums" }}>
            {rate}%
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: C.textTertiary, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Income
        </div>
        <select
          value={currency}
          onChange={(e) => onUpdate("currency", e.target.value)}
          style={{
            fontSize: 11,
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
      {incomeRows.map((r, i) => (
        <Row
          key={r.id}
          item={r}
          onUpdate={onUpdateIncome}
          onRemove={onRemoveIncome}
          currency={currency}
          editing={editing}
          color={SEG_COLORS[i % SEG_COLORS.length]}
        />
      ))}
      <StackedBar rows={incomeRows} total={incomeTotal} />
      {editing && (
        <button onClick={onAddIncome} style={styles.addBtn}>
          + Add income
        </button>
      )}

      <div
        style={{
          fontSize: 11,
          color: C.textTertiary,
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginTop: 18,
          marginBottom: 8,
        }}
      >
        Expenses
      </div>
      {expenseRows.map((r, i) => (
        <Row
          key={r.id}
          item={r}
          onUpdate={onUpdateExpense}
          onRemove={onRemoveExpense}
          currency={currency}
          editing={editing}
          color={SEG_COLORS[i % SEG_COLORS.length]}
        />
      ))}
      <StackedBar rows={expenseRows} total={expenseTotal} />
      {editing && (
        <button onClick={onAddExpense} style={styles.addBtn}>
          + Add expense
        </button>
      )}
    </div>
  );
}
