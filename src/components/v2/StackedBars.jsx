import React from "react";
import { C, financeCatColor } from "../../lib/tokens";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monLabel = (m) => MON[parseInt(m.slice(5, 7), 10) - 1];
const eurK = (n) => (n >= 1000 ? `€${(n / 1000).toFixed(1)}k` : `€${Math.round(n)}`);

// Monthly spend stacked by category, left → right. Built from each category's
// absolute `monthly` array (aligned to range.months). `rent` adds a flat
// monthly Rent segment at the base (rent is excluded from the spend categories).
export default function StackedBars({ months, categories, rent = 0, height = 150 }) {
  const real = (categories || []).filter((c) => Array.isArray(c.monthly));
  if (!months?.length || !real.length) return null;
  const cats = rent > 0
    ? [{ key: "rent", label: "Rent", monthly: months.map(() => rent) }, ...real]
    : real;

  const totals = months.map((_, i) => cats.reduce((s, c) => s + (c.monthly[i] || 0), 0));
  const max = Math.max(...totals, 1);
  const scale = height / max;

  return (
    <div style={{ background: C.statBg, borderRadius: 14, padding: "14px 16px 10px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Monthly spend by category</span>
        <span style={{ fontSize: 11.5, color: C.textTertiary }}>{months.length} mo</span>
      </div>

      {/* bars */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: height + 18 }}>
        {months.map((m, i) => (
          <div key={m} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
            <div style={{ fontSize: 10.5, color: C.textTertiary, fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>{eurK(totals[i])}</div>
            <div style={{ width: "100%", maxWidth: 46, display: "flex", flexDirection: "column-reverse", borderRadius: "5px 5px 0 0", overflow: "hidden" }} title={`${monLabel(m)} · ${eurK(totals[i])}`}>
              {cats.map((c) => {
                const v = c.monthly[i] || 0;
                if (v <= 0) return null;
                return <div key={c.key} style={{ height: Math.max(1, v * scale), background: financeCatColor(c.key) }} title={`${c.label} · €${Math.round(v).toLocaleString()}`} />;
              })}
            </div>
          </div>
        ))}
      </div>

      {/* month axis */}
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        {months.map((m) => (
          <div key={m} style={{ flex: 1, textAlign: "center", fontSize: 11, color: C.textSecondary }}>{monLabel(m)}</div>
        ))}
      </div>

      {/* legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 12 }}>
        {cats.map((c) => (
          <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textSecondary }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: financeCatColor(c.key), flexShrink: 0 }} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
