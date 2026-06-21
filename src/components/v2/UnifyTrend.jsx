import React, { useEffect, useRef, useState } from "react";
import { C } from "../../lib/tokens";
import { unifyTrend } from "../../lib/unifyIncome.js";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const initial = (m) => MON[parseInt(m.slice(5, 7), 10) - 1][0];
const k = (gbp) => `${(gbp / 1000).toFixed(1)}k`;

// Bold rolling Unify-income sparkline for the header's top-right quarter.
// Hideable (persisted by the caller).
export default function UnifyTrend({ hidden, onToggle }) {
  const data = unifyTrend(6);
  const ref = useRef(null);
  const [w, setW] = useState(320);

  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect?.width;
      if (cw) setW(cw);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!data.length) return null;

  if (hidden) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onToggle}
          title="Show Unify income"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "5px 11px", fontSize: 12, color: C.textTertiary, cursor: "pointer", fontFamily: "inherit" }}
        >
          Unify ↗
        </button>
      </div>
    );
  }

  const W = Math.max(220, Math.round(w));
  const H = 82;
  const padX = 10;
  const padTop = 16;
  const padBottom = 16;
  const vals = data.map((d) => d.gbp);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const x = (i) => padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v) => padTop + innerH - ((v - min) / range) * innerH;
  const line = data.map((d, i) => `${x(i).toFixed(1)},${y(d.gbp).toFixed(1)}`).join(" ");
  const area = `${padX},${H - padBottom} ${line} ${W - padX},${H - padBottom}`;

  return (
    <div ref={ref} style={{ width: "100%", minWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>Unify £/mo</span>
        <button onClick={onToggle} title="Hide" aria-label="Hide Unify income" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.textTertiary, lineHeight: 1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="2.5" /><path d="M3 3l18 18" />
          </svg>
        </button>
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <polygon points={area} fill={C.accent} opacity="0.1" />
        <polyline points={line} fill="none" stroke={C.accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={d.month}>
            <circle cx={x(i)} cy={y(d.gbp)} r={i === data.length - 1 ? 4 : 3} fill={C.accent} />
            <text x={x(i)} y={y(d.gbp) - 7} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={C.textSecondary} style={{ fontVariantNumeric: "tabular-nums" }}>{k(d.gbp)}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={d.month} x={x(i)} y={H - 3} textAnchor="middle" fontSize="10" fill={C.textTertiary}>{initial(d.month)}</text>
        ))}
      </svg>
    </div>
  );
}
