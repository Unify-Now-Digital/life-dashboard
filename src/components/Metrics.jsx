import React, { useState } from "react";
import { C, styles } from "../lib/tokens";
import { EditableText } from "./Editable.jsx";
import HabitRing from "./HabitRing.jsx";
import HabitDots from "./HabitDots.jsx";
import { isoYesterday, statusFor, streakFor, historyFor } from "../lib/habits";
import TravelPanel from "./drilldowns/TravelPanel.jsx";
import FinancesPanel from "./drilldowns/FinancesPanel.jsx";

const HABITS = [
  { key: "gym", label: "Gym" },
  { key: "spanish", label: "Spanish" },
  { key: "clean", label: "Clean" },
  { key: "sleep", label: "Sleep" },
];

function RevenueTile({ label, value, onChange, sub }) {
  return (
    <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: C.textSecondary }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
        <EditableText value={value} onChange={onChange} style={{ fontSize: 20, fontWeight: 500 }} />
      </div>
      {sub && <div style={{ fontSize: 11, marginTop: 2, color: C.textTertiary }}>{sub}</div>}
    </div>
  );
}

function HabitsTile({ habitLog, habitNoLog }) {
  const yesISO = isoYesterday();
  return (
    <div style={{ background: C.bgSecondary, borderRadius: 8, padding: 14, gridColumn: "1 / -1" }}>
      <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>Habits</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {HABITS.map((h) => {
          const status = statusFor(h.key, yesISO, habitLog, habitNoLog);
          const streak = streakFor(h.key, habitLog, habitNoLog);
          const history = historyFor(h.key, habitLog, habitNoLog, 7);
          return (
            <div
              key={h.key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <HabitRing habit={h.key} status={status} streak={streak} onClick={() => {}} />
              <div style={{ fontSize: 11, color: C.textSecondary }}>{h.label}</div>
              <HabitDots history={history} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExpandableTile({ label, value, sub, expanded, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        background: expanded ? C.bg : C.bgSecondary,
        border: `0.5px solid ${expanded ? C.borderStrong : "transparent"}`,
        borderRadius: 8,
        padding: "12px 14px",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div style={{ fontSize: 12, color: C.textSecondary }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>{sub}</div>}
    </button>
  );
}

export default function Metrics({ m, onUpdate, habitLog, habitNoLog, drilldowns, handlers }) {
  const [open, setOpen] = useState(null);
  const toggle = (id) => setOpen(open === id ? null : id);

  const upcomingTrip = [...drilldowns.travel.trips]
    .filter((t) => t.start)
    .sort((a, b) => a.start.localeCompare(b.start))
    .find((t) => new Date(t.start) >= new Date(new Date().toDateString()));
  const daysToNext = upcomingTrip
    ? Math.max(0, Math.ceil((new Date(upcomingTrip.start) - new Date()) / 86400000))
    : null;
  const travelValue = upcomingTrip ? `${daysToNext}d` : "—";
  const travelSub = upcomingTrip ? `to ${upcomingTrip.name}` : "no trips planned";

  const fin = drilldowns.finances;
  const incomeTotal = (fin.incomeBreakdown || []).reduce((a, b) => a + (b.amount || 0), 0) || fin.income || 0;
  const expenseTotal = (fin.expenseBreakdown || []).reduce((a, b) => a + (b.amount || 0), 0) || fin.spending || 0;
  const savedTotal = Math.max(0, incomeTotal - expenseTotal);
  const savingsRate = incomeTotal > 0 ? Math.round((savedTotal / incomeTotal) * 100) : 0;
  const finValue = `${savingsRate}%`;
  const finSub = `${fin.currency}${savedTotal.toLocaleString()} saved this month`;

  return (
    <div>
      <div style={{ ...styles.sectionH, padding: "0 4px" }}>Key metrics</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        <RevenueTile
          label="Unify Digital revenue"
          value={m.unifyMTD}
          onChange={(v) => onUpdate("unifyMTD", v)}
          sub="this month"
        />
        <RevenueTile
          label="Sears Melvin revenue"
          value={m.smMTD}
          onChange={(v) => onUpdate("smMTD", v)}
          sub="this month"
        />
        <HabitsTile habitLog={habitLog} habitNoLog={habitNoLog} />
        <ExpandableTile
          label="Travel"
          value={travelValue}
          sub={travelSub}
          expanded={open === "travel"}
          onToggle={() => toggle("travel")}
        />
        <ExpandableTile
          label="Finances"
          value={finValue}
          sub={finSub}
          expanded={open === "finances"}
          onToggle={() => toggle("finances")}
        />
      </div>
      {open === "travel" && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            background: C.bg,
            border: `0.5px solid ${C.border}`,
            borderRadius: 8,
          }}
        >
          <TravelPanel data={drilldowns.travel} {...handlers.travel} onClose={() => setOpen(null)} />
        </div>
      )}
      {open === "finances" && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            background: C.bg,
            border: `0.5px solid ${C.border}`,
            borderRadius: 8,
          }}
        >
          <FinancesPanel data={drilldowns.finances} {...handlers.finances} onClose={() => setOpen(null)} />
        </div>
      )}
    </div>
  );
}
