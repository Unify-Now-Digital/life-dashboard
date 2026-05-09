import React, { useState } from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import Project from "./Project.jsx";

const isoToday = () => new Date().toISOString().slice(0, 10);

function MarkerLog({ title, unit, rows, onAdd, onUpdate, onRemove, editing }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: C.textTertiary,
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        <span>{title}</span>
        {editing && (
          <button onClick={onAdd} style={{ ...styles.addBtn, marginTop: 0, padding: "3px 8px", fontSize: 11, width: "auto" }}>
            + Add
          </button>
        )}
      </div>
      {(rows || []).slice().reverse().map((r) => (
        <div
          key={r.date + r.value}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 0",
            borderBottom: `0.5px solid ${C.border}`,
          }}
        >
          <span style={{ fontSize: 12, color: C.textTertiary, width: 88 }}>{r.date}</span>
          <span style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums", flex: 1 }}>
            <EditableText
              value={String(r.value)}
              onChange={(v) => onUpdate(r.date, parseFloat(v) || 0)}
              type="number"
              style={{ fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: C.textSecondary, marginLeft: 4 }}>{unit}</span>
          </span>
          {editing && (
            <IconBtn onClick={() => onRemove(r.date)} danger label="Remove">
              ×
            </IconBtn>
          )}
        </div>
      ))}
      {(!rows || rows.length === 0) && (
        <div style={{ fontSize: 11, color: C.textTertiary, padding: "4px 0" }}>no data yet</div>
      )}
    </div>
  );
}

export default function HealthProject({ state, setState, meta, onClose, goalHandlers }) {
  const data = state.projects.health;
  const [editing] = useState(false);
  void editing; // editing toggle lives inside Project shell; markers respect that via prop drilling — kept simple here

  const updateMarkers = (key, updater) =>
    setState((s) => ({
      ...s,
      projects: {
        ...s.projects,
        health: {
          ...s.projects.health,
          markers: { ...s.projects.health.markers, [key]: updater(s.projects.health.markers[key] || []) },
        },
      },
    }));

  const markerHandlers = (key, fieldName) => ({
    onAdd: () =>
      updateMarkers(key, (rows) => [
        ...rows,
        { date: isoToday(), [fieldName]: 0 },
      ]),
    onUpdate: (date, value) =>
      updateMarkers(key, (rows) => rows.map((r) => (r.date === date ? { ...r, [fieldName]: value } : r))),
    onRemove: (date) => updateMarkers(key, (rows) => rows.filter((r) => r.date !== date)),
  });

  const w = markerHandlers("weight", "kg");
  const sl = markerHandlers("sleep", "hours");
  const wa = markerHandlers("waist", "cm");

  const updateLift = (name, patch) =>
    setState((s) => ({
      ...s,
      projects: {
        ...s.projects,
        health: {
          ...s.projects.health,
          lifts: s.projects.health.lifts.map((l) => (l.name === name ? { ...l, ...patch } : l)),
        },
      },
    }));

  // Wrap rows for display: show {date, value, unit}
  const rowsFor = (key, field) => (data.markers?.[key] || []).map((r) => ({ date: r.date, value: r[field] }));

  return (
    <Project title="Health" color={meta.color} onClose={onClose} goals={data.goals} goalHandlers={goalHandlers}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
        <div>
          <MarkerLog
            title="Weight"
            unit="kg"
            rows={rowsFor("weight", "kg")}
            onAdd={w.onAdd}
            onUpdate={w.onUpdate}
            onRemove={w.onRemove}
            editing
          />
          <MarkerLog
            title="Sleep"
            unit="hrs"
            rows={rowsFor("sleep", "hours")}
            onAdd={sl.onAdd}
            onUpdate={sl.onUpdate}
            onRemove={sl.onRemove}
            editing
          />
          <MarkerLog
            title="Waist"
            unit="cm"
            rows={rowsFor("waist", "cm")}
            onAdd={wa.onAdd}
            onUpdate={wa.onUpdate}
            onRemove={wa.onRemove}
            editing
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              color: C.textTertiary,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Lifts
          </div>
          {(data.lifts || []).map((lift) => (
            <div
              key={lift.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                borderBottom: `0.5px solid ${C.border}`,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, width: 72 }}>{lift.name}</span>
              <span style={{ fontSize: 12, color: C.textSecondary, flex: 1 }}>
                last{" "}
                <EditableText
                  value={String(lift.lastValue)}
                  onChange={(v) => updateLift(lift.name, { lastValue: parseFloat(v) || 0 })}
                  type="number"
                  style={{ fontSize: 12 }}
                />
                kg · PR{" "}
                <EditableText
                  value={String(lift.pr)}
                  onChange={(v) => updateLift(lift.name, { pr: parseFloat(v) || 0 })}
                  type="number"
                  style={{ fontSize: 12 }}
                />
                kg
              </span>
            </div>
          ))}
        </div>
      </div>
    </Project>
  );
}
