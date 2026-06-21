import React from "react";
import { C, HABIT, RUNRATE } from "../../lib/tokens";
import { habitStats } from "../../lib/habitStats.js";

// Tap cycles a day's state: unanswered → yes → no → clear.
const CYCLE = { unanswered: "yes", yes: "no", no: "clear" };

function HabitIcon({ habitKey, color }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, style: { flexShrink: 0 } };
  switch (habitKey) {
    case "spanish":
      return <svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.4 8.4 0 1 1 21 11.5z" /></svg>;
    case "gym":
      return <svg {...common}><path d="M6.5 6.5l11 11M4 8l-1 1 2 2M8 4l1-1 2 2M20 16l1-1-2-2M16 20l-1 1-2-2" /></svg>;
    case "clean":
      return <svg {...common}><path d="M12 3s6 6.3 6 10.5a6 6 0 0 1-12 0C6 9.3 12 3 12 3z" /></svg>;
    case "sleep":
      return <svg {...common}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>;
    default:
      return <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />;
  }
}

function Dot({ status, today, onClick }) {
  const size = 11;
  const fill = status === "yes" ? HABIT.hit : status === "no" ? HABIT.miss : "transparent";
  return (
    <button
      onClick={onClick}
      title={status}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: fill,
        border: today
          ? `1.5px solid ${HABIT.today}`
          : status === "unanswered"
          ? `1px solid ${C.borderStrong}`
          : "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        boxSizing: "border-box",
      }}
    />
  );
}

function Sparkline({ values, width = 150, height = 26 }) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const stepX = width / (values.length - 1);
  const pts = values.map((v, i) => `${(i * stepX).toFixed(1)},${(height - 2 - v * (height - 4)).toFixed(1)}`).join(" ");
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={C.textTertiary} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function HabitCard({ habit, habitLog, habitNoLog, onConfirm }) {
  const stats = habitStats(habit.key, habitLog, habitNoLog, habit);
  const rateColor = stats.runRate >= 80 ? RUNRATE.good : RUNRATE.warn;
  return (
    <div style={{ flex: "1 1 0", minWidth: 0, padding: "0 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <HabitIcon habitKey={habit.key} color={C.text} />
          <span style={{ fontSize: 15, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>{habit.label}</span>
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: rateColor, fontVariantNumeric: "tabular-nums" }}>{stats.runRate}%</span>
      </div>

      <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
        {stats.dots.map((d) => (
          <Dot
            key={d.dateISO}
            status={d.status}
            today={d.today}
            onClick={() => onConfirm(habit.key, d.dateISO, CYCLE[d.status])}
          />
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        <Sparkline values={stats.spark} />
      </div>

      <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
        {stats.hits}/{stats.targetOccurrences} · 28d
      </div>
    </div>
  );
}

// Docked habit footer (version C), permanent across all views. Desktop: one
// row of cards; mobile: 2×2 grid.
export default function HabitFooter({ habits, habitLog, habitNoLog, onConfirm, isDesktop }) {
  const list = (habits && habits.length ? habits : []).filter((h) => h.active !== false);
  if (!list.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        padding: "10px max(14px, env(safe-area-inset-left)) calc(8px + env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-right))",
        background: C.bg,
        borderTop: `0.5px solid ${C.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          background: C.footerBg,
          border: `0.5px solid ${C.border}`,
          borderRadius: 14,
          padding: "14px 6px",
          display: isDesktop ? "flex" : "grid",
          gridTemplateColumns: isDesktop ? undefined : "1fr 1fr",
          gap: isDesktop ? 0 : 16,
        }}
      >
        {list.map((h, i) => (
          <React.Fragment key={h.key}>
            {isDesktop && i > 0 && <div style={{ width: 0.5, alignSelf: "stretch", background: C.border }} />}
            <HabitCard habit={h} habitLog={habitLog} habitNoLog={habitNoLog} onConfirm={onConfirm} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
