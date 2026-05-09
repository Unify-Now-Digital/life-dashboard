import React from "react";
import { C, styles } from "../lib/tokens";
import { EditableText } from "./Editable.jsx";

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

function ReadOnlyTile({ label, value, sub }) {
  return (
    <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: C.textSecondary }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Metrics({ m, onUpdate, state }) {
  const trips = state.projects?.travel?.trips || [];
  const upcomingTrip = [...trips]
    .filter((t) => t.start)
    .sort((a, b) => a.start.localeCompare(b.start))
    .find((t) => new Date(t.start) >= new Date(new Date().toDateString()));
  const daysToNext = upcomingTrip
    ? Math.max(0, Math.ceil((new Date(upcomingTrip.start) - new Date()) / 86400000))
    : null;
  const travelValue = upcomingTrip ? `${daysToNext}d` : "—";
  const travelSub = upcomingTrip ? `to ${upcomingTrip.name}` : "no trips planned";

  const savings = state.projects?.finance?.savings || [];
  const investments = state.projects?.finance?.investments || [];
  const debts = state.projects?.finance?.debts || [];
  const netEur =
    savings.reduce((a, b) => a + (b.balance?.eur || 0), 0) +
    investments.reduce((a, b) => a + (b.value?.eur || 0), 0) -
    debts.reduce((a, b) => a + (b.amount?.eur || 0), 0);

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
        <ReadOnlyTile label="Travel" value={travelValue} sub={travelSub} />
        <ReadOnlyTile label="Net (EUR)" value={`€${netEur.toLocaleString()}`} sub="from Finance project" />
      </div>
    </div>
  );
}
