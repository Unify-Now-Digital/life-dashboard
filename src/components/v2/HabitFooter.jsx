import React from "react";
import { C, HABIT, RUNRATE, ACCENT, tint } from "../../lib/tokens";
import { habitStats } from "../../lib/habitStats.js";

// Tap cycles a day's state: unanswered → yes → no → clear.
const CYCLE = { unanswered: "yes", yes: "no", no: "clear" };

function HabitIcon({ habitKey, color }) {
  const common = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
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
  const size = 13;
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
        border: today ? `1.5px solid ${HABIT.today}` : status === "unanswered" ? `1.5px solid ${C.borderStrong}` : "none",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
        boxSizing: "border-box",
      }}
    />
  );
}

function Sparkline({ values, width = 150, height = 22 }) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const stepX = width / (values.length - 1);
  const pts = values.map((v, i) => `${(i * stepX).toFixed(1)},${(height - 2 - v * (height - 4)).toFixed(1)}`).join(" ");
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block", opacity: 0.55 }}>
      <polyline points={pts} fill="none" stroke={C.textSecondary} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Same star glyph PrioritiesBar uses for tasks — one visual language for
// "priority" across the app, not a habit-specific icon.
// Sits as a corner badge on the card, not inline in the icon/label/rate row —
// that row is already tight in the 2-column mobile grid, and a 4th item
// there truncated every label down to a single letter ("S…" for both
// Spanish and Sleep, ambiguous). A corner badge costs no row width.
function StarButton({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      title={on ? "Remove priority" : "Mark priority"}
      aria-label={on ? "Remove priority" : "Mark priority"}
      style={{
        position: "absolute",
        top: -7,
        right: -7,
        width: 22,
        height: 22,
        borderRadius: "50%",
        flexShrink: 0,
        border: `1.5px solid ${on ? ACCENT.priorities : C.border}`,
        background: on ? ACCENT.priorities : C.bg,
        color: on ? "#fff" : C.textTertiary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2.5l2.9 6 6.6.6-5 4.3 1.5 6.4L12 16.9 6 19.8l1.5-6.4-5-4.3 6.6-.6z" />
      </svg>
    </button>
  );
}

function HabitCard({ habit, habitLog, habitNoLog, onConfirm, onTogglePriority }) {
  const stats = habitStats(habit.key, habitLog, habitNoLog, habit);
  const good = stats.runRate >= 80;
  const rateColor = good ? RUNRATE.good : RUNRATE.warn;
  const rateBg = good ? RUNRATE.goodBg : RUNRATE.warnBg;
  const starred = !!habit.priority;
  return (
    <div
      style={{
        position: "relative",
        flex: "1 1 0",
        minWidth: 0,
        background: starred ? tint(ACCENT.priorities, 0.06) : C.card,
        border: `0.5px solid ${starred ? ACCENT.priorities : C.border}`,
        borderRadius: 12,
        padding: "12px 14px",
      }}
    >
      {onTogglePriority && <StarButton on={starred} onClick={() => onTogglePriority(habit.key)} />}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: C.bgTertiary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <HabitIcon habitKey={habit.key} color={C.text} />
        </span>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: C.text, whiteSpace: "nowrap", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{habit.label}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: rateColor, background: rateBg, borderRadius: 999, padding: "2px 9px", fontVariantNumeric: "tabular-nums" }}>
          {stats.runRate}%
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {stats.dots.map((d) => (
          <Dot key={d.dateISO} status={d.status} today={d.today} onClick={() => onConfirm(habit.key, d.dateISO, CYCLE[d.status])} />
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <Sparkline values={stats.spark} />
      </div>

      <div style={{ fontSize: 11.5, color: C.textTertiary, marginTop: 7, fontVariantNumeric: "tabular-nums" }}>
        {stats.hits}/{stats.targetOccurrences} · 28d
      </div>
    </div>
  );
}

// Habit cards grid — either docked as a permanent fixed footer, or rendered
// in-flow as the Habits sub-page's full-detail content (`docked={false}`,
// the focus-first shell's default — see CLAUDE.md). Desktop: one row of
// cards; mobile: 2×2 grid.
export default function HabitFooter({ habits, habitLog, habitNoLog, onConfirm, onTogglePriority, isDesktop, docked = true }) {
  const list = (habits && habits.length ? habits : []).filter((h) => h.active !== false);
  if (!list.length) return null;

  const grid = (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        display: isDesktop ? "flex" : "grid",
        gridTemplateColumns: isDesktop ? undefined : "1fr 1fr",
        gap: 10,
      }}
    >
      {list.map((h) => (
        <HabitCard key={h.key} habit={h} habitLog={habitLog} habitNoLog={habitNoLog} onConfirm={onConfirm} onTogglePriority={onTogglePriority} />
      ))}
    </div>
  );

  if (!docked) return grid;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        padding: "10px max(14px, env(safe-area-inset-left)) calc(10px + env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-right))",
        background: C.bg,
        borderTop: `0.5px solid ${C.border}`,
      }}
    >
      {grid}
    </div>
  );
}
