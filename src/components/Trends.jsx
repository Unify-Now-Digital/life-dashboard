import React from "react";
import { C, styles } from "../lib/tokens";

function Sparkline({ data }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <div style={{ display: "flex", alignItems: "end", gap: 3, height: 32 }}>
      {data.map((v, i) => {
        const h = ((v - min) / range) * 80 + 20;
        const isLast = i === data.length - 1;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background: isLast ? C.accent : "#B5D4F4",
              borderRadius: 1,
              minHeight: 2,
            }}
          />
        );
      })}
    </div>
  );
}

export default function Trends({ trends }) {
  const spanishLast = trends.spanishMinutes[trends.spanishMinutes.length - 1];
  const spanishAvg = trends.spanishMinutes.reduce((a, b) => a + b, 0) / trends.spanishMinutes.length;
  const spanishDelta = Math.round(((spanishLast - spanishAvg) / spanishAvg) * 100);
  const bwLast = trends.bodyweight[trends.bodyweight.length - 1];
  const bwFirst = trends.bodyweight[0];
  const bwDelta = (bwLast - bwFirst).toFixed(1);

  return (
    <div>
      <div style={{ ...styles.sectionH, padding: "0 4px" }}>
        Trends
        <span style={styles.sectionSub}>last 7 days</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.textSecondary }}>Spanish minutes / day</span>
            <span style={{ fontSize: 16, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
              {spanishLast}{" "}
              <span style={{ color: spanishDelta >= 0 ? C.success : C.danger, fontSize: 11 }}>
                {spanishDelta >= 0 ? "+" : ""}
                {spanishDelta}%
              </span>
            </span>
          </div>
          <Sparkline data={trends.spanishMinutes} />
        </div>
        <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.textSecondary }}>Bodyweight (kg)</span>
            <span style={{ fontSize: 16, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
              {bwLast.toFixed(1)}{" "}
              <span style={{ color: parseFloat(bwDelta) <= 0 ? C.success : C.danger, fontSize: 11 }}>
                {parseFloat(bwDelta) > 0 ? "+" : ""}
                {bwDelta}
              </span>
            </span>
          </div>
          <Sparkline data={trends.bodyweight} />
        </div>
      </div>
    </div>
  );
}
