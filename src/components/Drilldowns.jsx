import React, { useState } from "react";
import { C, styles } from "../lib/tokens";
import BusinessesPanel from "./drilldowns/BusinessesPanel.jsx";
import FinancesPanel from "./drilldowns/FinancesPanel.jsx";
import TravelPanel from "./drilldowns/TravelPanel.jsx";
import RelationshipsPanel from "./drilldowns/RelationshipsPanel.jsx";
import ReadingPanel from "./drilldowns/ReadingPanel.jsx";

function Tile({ label, value, sub, onClick, fullWidth, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? C.bgSecondary : C.bg,
        border: `0.5px solid ${active ? C.borderStrong : C.border}`,
        borderRadius: 8,
        padding: 14,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        gridColumn: fullWidth ? "1 / -1" : "auto",
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4 }}>{sub}</div>
    </button>
  );
}

export default function Drilldowns({ data, handlers }) {
  const [open, setOpen] = useState(null);
  const toggle = (id) => setOpen(open === id ? null : id);

  const tiles = [
    {
      id: "biz",
      label: "Businesses",
      value: data.businesses.length,
      sub: data.businesses.map((b) => b.name.split(" ")[0]).join(" · "),
    },
    {
      id: "fin",
      label: "Finances",
      value:
        data.finances.income > 0
          ? `${Math.round((data.finances.saved / data.finances.income) * 100)}%`
          : "—",
      sub: "savings rate this month",
    },
    {
      id: "travel",
      label: "Travel",
      value: data.travel.trips.length ? `${data.travel.trips[0].days}d` : "—",
      sub: data.travel.trips.length ? `to ${data.travel.trips[0].name}` : "no trips planned",
    },
    {
      id: "rel",
      label: "Relationships",
      value: data.relationships.filter((r) => r.stale).length,
      sub: "people overdue",
    },
    {
      id: "read",
      label: "Reading & learning",
      value: `${data.reading.filter((r) => r.progress !== null).length} books · ${
        data.reading.filter((r) => r.progress === null).length
      } podcast`,
      sub: "in progress",
      fullWidth: true,
    },
  ];

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        Drill-downs
        <span style={styles.sectionSub}>tap to expand</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {tiles.map((t) => (
          <Tile key={t.id} {...t} active={open === t.id} onClick={() => toggle(t.id)} />
        ))}
      </div>
      {open && (
        <div style={{ paddingTop: 14, borderTop: `0.5px solid ${C.border}`, marginTop: 14 }}>
          {open === "biz" && (
            <BusinessesPanel items={data.businesses} {...handlers.businesses} onClose={() => setOpen(null)} />
          )}
          {open === "fin" && (
            <FinancesPanel data={data.finances} {...handlers.finances} onClose={() => setOpen(null)} />
          )}
          {open === "travel" && <TravelPanel data={data.travel} {...handlers.travel} onClose={() => setOpen(null)} />}
          {open === "rel" && (
            <RelationshipsPanel items={data.relationships} {...handlers.relationships} onClose={() => setOpen(null)} />
          )}
          {open === "read" && <ReadingPanel items={data.reading} {...handlers.reading} onClose={() => setOpen(null)} />}
        </div>
      )}
    </div>
  );
}
