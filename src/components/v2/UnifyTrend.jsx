import React from "react";
import { C } from "../../lib/tokens";
import { unifyTrend } from "../../lib/unifyIncome.js";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const initial = (m) => MON[parseInt(m.slice(5, 7), 10) - 1][0];
const k = (gbp) => `${(gbp / 1000).toFixed(1)}k`;

// Compact rolling Unify-income sparkline for the header. Hideable (persisted by
// the caller). Figures are the raw GBP invoice amounts over the last 6 months.
export default function UnifyTrend({ hidden, onToggle }) {
  const data = unifyTrend(6);
  if (!data.length) return null;

  if (hidden) {
    return (
      <button
        onClick={onToggle}
        title="Show Unify income"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: `0.5px solid ${C.border}`, borderRadius: 7, padding: "4px 9px", fontSize: 11, color: C.textTertiary, cursor: "pointer", fontFamily: "inherit" }}
      >
        Unify ↗
      </button>
    );
  }

  const W = 156;
  const H = 30;
  const vals = data.map((d) => d.gbp);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const x = (i) => (data.length === 1 ? W / 2 : (i / (data.length - 1)) * W);
  const y = (v) => H - 3 - ((v - min) / range) * (H - 6);
  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.gbp).toFixed(1)}`).join(" ");

  return (
    <div style={{ minWidth: W }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>Unify £/mo</span>
        <button onClick={onToggle} title="Hide" aria-label="Hide Unify income" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.textTertiary, lineHeight: 1, fontSize: 12 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="2.5" /><path d="M3 3l18 18" />
          </svg>
        </button>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => (
          <circle key={d.month} cx={x(i)} cy={y(d.gbp)} r={i === data.length - 1 ? 2.4 : 1.6} fill={C.accent} />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 1 }}>
        {data.map((d) => (
          <span key={d.month} style={{ fontSize: 8.5, color: C.textTertiary, fontVariantNumeric: "tabular-nums", textAlign: "center", flex: 1 }}>
            {initial(d.month)}
            <br />
            {k(d.gbp)}
          </span>
        ))}
      </div>
    </div>
  );
}
