import React from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import Project from "./Project.jsx";
import { fmt, toMoneySync } from "../../lib/money";

const CHECK_KEYS = ["flights", "accommodation", "activities", "gym", "coworking", "eSIM", "insurance"];

export default function TravelProject({ state, setState, meta, onClose, goalHandlers }) {
  const data = state.projects.travel;

  const updateTravel = (updater) =>
    setState((s) => ({ ...s, projects: { ...s.projects, travel: updater(s.projects.travel) } }));

  const tripList = (key, factory) => ({
    onAdd: () =>
      updateTravel((t) => ({
        ...t,
        [key]: [...(t[key] || []), factory((t[key] || []).reduce((m, x) => Math.max(m, x.id || 0), 0) + 1)],
      })),
    onUpdate: (id, patch) =>
      updateTravel((t) => ({ ...t, [key]: (t[key] || []).map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    onRemove: (id) => updateTravel((t) => ({ ...t, [key]: (t[key] || []).filter((x) => x.id !== id) })),
  });

  const trips = tripList("trips", (id) => ({
    id, name: "New trip", start: "", end: "", sub: "", days: null,
    checklist: Object.fromEntries(CHECK_KEYS.map((k) => [k, false])),
    notes: "",
  }));
  const wishlist = tripList("wishlist", (id) => ({ id, place: "New place", season: "", status: "researched", notes: "" }));
  const sublets = tripList("sublets", (id) => ({ id, dateRange: "", income: toMoneySync(0, "EUR"), source: "" }));

  const updatePoints = (key, value) =>
    updateTravel((t) => ({ ...t, points: { ...t.points, [key]: parseFloat(value) || 0, lastUpdated: new Date().toISOString().slice(0, 10) } }));

  return (
    <Project title="Travel" color={meta.color} onClose={onClose} goals={data.goals} goalHandlers={goalHandlers}>
      {/* Trips */}
      <SectionHeader>Trips</SectionHeader>
      {(data.trips || []).map((trip) => (
        <div key={trip.id} style={{ padding: "10px 0", borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>
              <EditableText value={trip.name} onChange={(v) => trips.onUpdate(trip.id, { name: v })} style={{ fontSize: 14, fontWeight: 500 }} />
            </span>
            <span style={{ fontSize: 11, color: C.textSecondary }}>
              <EditableText value={trip.start} onChange={(v) => trips.onUpdate(trip.id, { start: v })} placeholder="start" style={{ fontSize: 11 }} />
              {" – "}
              <EditableText value={trip.end} onChange={(v) => trips.onUpdate(trip.id, { end: v })} placeholder="end" style={{ fontSize: 11 }} />
            </span>
            <IconBtn onClick={() => trips.onRemove(trip.id)} danger label="Remove">×</IconBtn>
          </div>
          {(trip.notes || true) && (
            <div style={{ marginTop: 4, fontSize: 11, color: C.textTertiary }}>
              <EditableText value={trip.notes || ""} onChange={(v) => trips.onUpdate(trip.id, { notes: v })} placeholder="notes…" style={{ fontSize: 11 }} />
            </div>
          )}
        </div>
      ))}
      <button onClick={trips.onAdd} style={{ ...styles.addBtn, marginTop: 10 }}>+ Add trip</button>

      {/* Points */}
      <div style={{ marginTop: 22 }}>
        <SectionHeader>Points balances</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
          {["ba", "iberia", "emirates", "revpoints", "amex"].map((key) => (
            <div key={key} style={{ background: C.bgSecondary, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: C.textSecondary, textTransform: "uppercase" }}>{key}</div>
              <div style={{ fontSize: 16, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                <EditableText
                  value={String(data.points?.[key] || 0)}
                  onChange={(v) => updatePoints(key, v)}
                  type="number"
                  style={{ fontSize: 16, fontWeight: 500 }}
                />
              </div>
            </div>
          ))}
        </div>
        {data.points?.lastUpdated && (
          <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4 }}>
            updated {data.points.lastUpdated}
          </div>
        )}
      </div>

      {/* Wishlist */}
      <div style={{ marginTop: 22 }}>
        <SectionHeader>Wishlist</SectionHeader>
        {(data.wishlist || []).map((w) => (
          <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `0.5px solid ${C.border}` }}>
            <span style={{ flex: 1, fontSize: 13 }}>
              <EditableText value={w.place} onChange={(v) => wishlist.onUpdate(w.id, { place: v })} style={{ fontSize: 13 }} />
              <span style={{ fontSize: 11, color: C.textTertiary, marginLeft: 6 }}>
                <EditableText value={w.season || ""} onChange={(v) => wishlist.onUpdate(w.id, { season: v })} placeholder="season" style={{ fontSize: 11 }} />
              </span>
            </span>
            <select
              value={w.status}
              onChange={(e) => wishlist.onUpdate(w.id, { status: e.target.value })}
              style={{ fontSize: 11, padding: "1px 4px", borderRadius: 4, border: `0.5px solid ${C.border}`, fontFamily: "inherit" }}
            >
              <option value="researched">researched</option>
              <option value="booked">booked</option>
              <option value="done">done</option>
            </select>
            <IconBtn onClick={() => wishlist.onRemove(w.id)} danger label="Remove">×</IconBtn>
          </div>
        ))}
        <button onClick={wishlist.onAdd} style={{ ...styles.addBtn, marginTop: 8 }}>+ Add wishlist place</button>
      </div>

      {/* Sublets */}
      <div style={{ marginTop: 22 }}>
        <SectionHeader>Sublets</SectionHeader>
        {(data.sublets || []).map((sl) => (
          <div key={sl.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `0.5px solid ${C.border}` }}>
            <span style={{ flex: 1, fontSize: 13 }}>
              <EditableText value={sl.dateRange} onChange={(v) => sublets.onUpdate(sl.id, { dateRange: v })} placeholder="date range" style={{ fontSize: 13 }} />
              <span style={{ fontSize: 11, color: C.textTertiary, marginLeft: 6 }}>
                <EditableText value={sl.source || ""} onChange={(v) => sublets.onUpdate(sl.id, { source: v })} placeholder="source" style={{ fontSize: 11 }} />
              </span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{fmt(sl.income)}</span>
            <IconBtn onClick={() => sublets.onRemove(sl.id)} danger label="Remove">×</IconBtn>
          </div>
        ))}
        <button onClick={sublets.onAdd} style={{ ...styles.addBtn, marginTop: 8 }}>+ Add sublet</button>
      </div>

      {/* Recommender placeholder */}
      <div style={{ marginTop: 22, fontSize: 11, color: C.textTertiary, fontStyle: "italic" }}>
        Recommender (places, events, restaurants) — coming next.
      </div>
    </Project>
  );
}

function SectionHeader({ children }) {
  return (
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
      {children}
    </div>
  );
}
