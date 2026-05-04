import React, { useState } from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import PanelHeader from "./PanelHeader.jsx";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function monthLabel(yyyymm) {
  const [y, m] = yyyymm.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

function tripDays(t) {
  if (!t.start || !t.end) return null;
  return Math.round((new Date(t.end) - new Date(t.start)) / 86400000) + 1;
}

function DateField({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <input
        type="date"
        value={value || ""}
        autoFocus
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        style={{
          fontSize: 12,
          padding: "1px 4px",
          border: `1px solid ${C.accent}`,
          borderRadius: 4,
          background: C.bg,
          fontFamily: "inherit",
          outline: "none",
        }}
      />
    );
  }
  return (
    <span
      onClick={() => setEditing(true)}
      style={{
        fontSize: 12,
        color: value ? C.textSecondary : C.textTertiary,
        cursor: "pointer",
        padding: "1px 4px",
        borderRadius: 4,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.bgSecondary)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {value ? fmtDate(value) : "set date"}
    </span>
  );
}

function TripRow({ t, onUpdate, onRemove, editing, showDates = true }) {
  const days = tripDays(t);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 0",
        borderBottom: `0.5px solid ${C.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          <EditableText
            value={t.name}
            onChange={(v) => onUpdate(t.id, "name", v)}
            style={{ fontSize: 14, fontWeight: 500 }}
          />
        </div>
        {showDates && (
          <div style={{ marginTop: 2 }}>
            <DateField value={t.start} onChange={(v) => onUpdate(t.id, "start", v)} />
            <span style={{ color: C.textTertiary, fontSize: 12 }}> – </span>
            <DateField value={t.end} onChange={(v) => onUpdate(t.id, "end", v)} />
          </div>
        )}
      </div>
      {days !== null && (
        <div style={{ fontSize: 12, color: C.textSecondary, fontVariantNumeric: "tabular-nums" }}>
          {days}d
        </div>
      )}
      {editing && (
        <IconBtn onClick={() => onRemove(t.id)} danger label="Remove">
          ×
        </IconBtn>
      )}
    </div>
  );
}

function Timeline({ trips }) {
  const year = new Date().getFullYear();
  const yearStart = new Date(`${year}-01-01`);
  const yearMS = new Date(`${year + 1}-01-01`) - yearStart;
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          fontSize: 10,
          color: C.textTertiary,
          marginBottom: 4,
        }}
      >
        {MONTHS.map((m) => (
          <div key={m} style={{ textAlign: "center" }}>
            {m}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "relative",
          height: 28,
          background: C.bgSecondary,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        {trips
          .filter((t) => t.start && t.end)
          .map((t) => {
            const startOff = (new Date(t.start) - yearStart) / yearMS;
            const endOff = (new Date(t.end) - yearStart) / yearMS;
            const left = Math.max(0, startOff) * 100;
            const width = Math.max(1, (Math.min(1, endOff) - Math.max(0, startOff)) * 100);
            return (
              <div
                key={t.id}
                title={`${t.name} (${fmtDate(t.start)} – ${fmtDate(t.end)})`}
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  left: `${left}%`,
                  width: `${width}%`,
                  background: C.accent,
                  color: "white",
                  fontSize: 10,
                  padding: "0 6px",
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.name}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function MiniCalendar({ year, month, trips }) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = first.getDay();
  const daysInMonth = last.getDate();
  const isTripDay = (day) => {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return trips.some((t) => t.start && t.end && iso >= t.start && iso <= t.end);
  };
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <div>
      <div style={{ fontSize: 10, color: C.textSecondary, marginBottom: 4, fontWeight: 500 }}>
        {MONTHS[month]}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {cells.map((d, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              fontSize: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: d && isTripDay(d) ? C.accent : "transparent",
              color: d && isTripDay(d) ? "white" : d ? C.textSecondary : "transparent",
              borderRadius: 2,
            }}
          >
            {d || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function Grid({ trips }) {
  const year = new Date().getFullYear();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
        gap: 12,
      }}
    >
      {MONTHS.map((_, i) => (
        <MiniCalendar key={i} year={year} month={i} trips={trips} />
      ))}
    </div>
  );
}

function ListGrouped({ trips, onUpdate, onRemove, editing }) {
  const groups = {};
  trips.forEach((t) => {
    const key = t.start ? t.start.slice(0, 7) : "unscheduled";
    groups[key] = groups[key] || [];
    groups[key].push(t);
  });
  const keys = Object.keys(groups).sort((a, b) => {
    if (a === "unscheduled") return 1;
    if (b === "unscheduled") return -1;
    return a.localeCompare(b);
  });
  return (
    <div>
      {keys.map((k) => (
        <div key={k} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              color: C.textTertiary,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {k === "unscheduled" ? "Unscheduled" : monthLabel(k)}
          </div>
          {groups[k].map((t) => (
            <TripRow key={t.id} t={t} onUpdate={onUpdate} onRemove={onRemove} editing={editing} />
          ))}
        </div>
      ))}
    </div>
  );
}

const VIEWS = [
  { key: "timeline", label: "Timeline" },
  { key: "grid", label: "Calendar" },
  { key: "list", label: "List" },
];

function ViewToggle({ view, onChange }) {
  return (
    <div style={{ display: "inline-flex", border: `0.5px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
      {VIEWS.map((v) => (
        <button
          key={v.key}
          onClick={() => onChange(v.key)}
          style={{
            background: view === v.key ? C.accent : "transparent",
            color: view === v.key ? "white" : C.textSecondary,
            border: "none",
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

export default function TravelPanel({ data, onClose, onUpdateStat, onUpdateTrip, onAddTrip, onRemoveTrip }) {
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState("timeline");

  const stats = [
    { key: "countries", lbl: "countries" },
    { key: "daysAwayYTD", lbl: "days away YTD" },
  ];

  return (
    <div>
      <PanelHeader title="Travel" editing={editing} onToggleEdit={() => setEditing(!editing)} onClose={onClose} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {stats.map((s) => (
          <div
            key={s.key}
            style={{ background: C.bgSecondary, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}
          >
            <div style={{ fontSize: 18, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
              <EditableText
                value={String(data[s.key])}
                onChange={(v) => onUpdateStat(s.key, parseInt(v) || 0)}
                style={{ fontSize: 18, fontWeight: 500 }}
                type="number"
              />
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>{s.lbl}</div>
          </div>
        ))}
        <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
            {data.trips.length}
          </div>
          <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>trips planned</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <ViewToggle view={view} onChange={setView} />
        <span style={{ fontSize: 11, color: C.textTertiary }}>{new Date().getFullYear()}</span>
      </div>

      {view === "timeline" && <Timeline trips={data.trips} />}
      {view === "grid" && <Grid trips={data.trips} />}
      {view === "list" && (
        <ListGrouped trips={data.trips} onUpdate={onUpdateTrip} onRemove={onRemoveTrip} editing={editing} />
      )}

      {view !== "list" && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${C.border}` }}>
          <div
            style={{
              fontSize: 11,
              color: C.textTertiary,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Trips
          </div>
          {data.trips.map((t) => (
            <TripRow
              key={t.id}
              t={t}
              onUpdate={onUpdateTrip}
              onRemove={onRemoveTrip}
              editing={editing}
            />
          ))}
        </div>
      )}

      {editing && (
        <button onClick={onAddTrip} style={styles.addBtn}>
          + Add trip
        </button>
      )}
    </div>
  );
}
