import React, { useState } from "react";
import { C, styles, tint } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import Project from "./Project.jsx";
import { balanceSeries, revenueSeries } from "../../lib/finance";

const eur = (n) =>
  `${n < 0 ? "-" : ""}€${Math.abs(Math.round(n)).toLocaleString()}`;

const todayISO = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => todayISO().slice(0, 7);

// Tiny inline trend for a single line's history. Hidden until ≥2 points.
function MiniSparkline({ values, color, width = 48, height = 14 }) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - ((v - min) / range) * (height - 2) - 1).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block", flexShrink: 0, opacity: 0.7 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Current value of a line = its latest history snapshot. History is appended
// chronologically; pick the entry with the highest date/month key.
function latestEur(history, key) {
  if (!Array.isArray(history) || history.length === 0) return 0;
  let best = history[0];
  for (const h of history) if ((h[key] || "") >= (best[key] || "")) best = h;
  return best.eur || 0;
}

// Upsert a snapshot for the given period key (today for accounts, this month
// for revenue), so editing the current value updates the latest point and
// records history going forward.
function upsertSnapshot(history, key, keyVal, value) {
  const arr = Array.isArray(history) ? [...history] : [];
  const idx = arr.findIndex((h) => h[key] === keyVal);
  if (idx >= 0) arr[idx] = { ...arr[idx], eur: value };
  else arr.push({ [key]: keyVal, eur: value });
  return arr;
}

// Subcard meta — one per finance area. Color used for tint + accent.
// Revenue reads from `revenue`; the rest read from `accounts` filtered by type.
const CARDS = [
  { key: "revenue", label: "Revenue", color: "#534AB7", kind: "revenue", addLabel: "+ Add line" },
  { key: "savings", label: "Savings", color: "#3B6D11", kind: "account", type: "saving", addLabel: "+ Add account" },
  { key: "investments", label: "Investments", color: "#185FA5", kind: "account", type: "investment", addLabel: "+ Add account" },
  { key: "debts", label: "Debts", color: "#791F1F", kind: "account", type: "debt", addLabel: "+ Add debt", invert: true },
];

// Short axis label: "2026-04-12" → "Apr 12", "2026-04" → "Apr".
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortLabel(s) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(s || "");
  if (!m) return s || "";
  const mon = MON[parseInt(m[2], 10) - 1] || m[2];
  return m[3] ? `${mon} ${parseInt(m[3], 10)}` : mon;
}

// Line chart of one category's total over time. points: [{ label, eur }].
function LineChart({ points, color }) {
  const W = 300;
  const H = 96;
  const padL = 4;
  const padR = 4;
  const padT = 10;
  const padB = 16;
  if (!points || points.length === 0) {
    return <div style={{ fontSize: 11, color: C.textTertiary, padding: "8px 0" }}>No history yet.</div>;
  }
  const vals = points.map((p) => p.eur);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 0);
  const range = max - min || 1;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (i) => padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => padT + innerH - ((v - min) / range) * innerH;
  const zeroY = y(0);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.eur).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: H, display: "block" }}>
      {/* zero baseline */}
      {min < 0 && max > 0 && (
        <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke={C.border} strokeWidth="1" strokeDasharray="3 3" />
      )}
      {points.length >= 2 && (
        <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.eur)} r={i === points.length - 1 ? 3 : 2} fill={color} />
      ))}
      {/* x-axis end labels */}
      <text x={padL} y={H - 4} fontSize="9" fill={C.textTertiary}>{shortLabel(points[0].label)}</text>
      {points.length > 1 && (
        <text x={W - padR} y={H - 4} fontSize="9" fill={C.textTertiary} textAnchor="end">{shortLabel(last.label)}</text>
      )}
    </svg>
  );
}

function ChartCard({ card, total, series, isOpen, onClick }) {
  const bg = tint(card.color, isOpen ? 0.1 : 0.05);
  const border = tint(card.color, isOpen ? 0.55 : 0.25);
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        background: bg,
        border: `0.5px solid ${border}`,
        borderLeft: `2px solid ${card.color}`,
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>{card.label}</span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: card.invert && total > 0 ? C.danger : C.text,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {eur(total)}
          {card.kind === "revenue" ? <span style={{ fontSize: 11, color: C.textTertiary }}>/mo</span> : null}
        </span>
      </div>
      <LineChart points={series} color={card.color} />
    </div>
  );
}

function ItemList({ card, items, handlers }) {
  const [editing, setEditing] = useState(false);
  return (
    <div
      style={{
        background: tint(card.color, 0.04),
        border: `0.5px dashed ${tint(card.color, 0.35)}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginTop: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: C.textTertiary,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {card.label}
          {card.kind === "revenue" ? ` · ${currentMonth()}` : ""}
        </span>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            background: editing ? C.accent : "transparent",
            color: editing ? "white" : C.accent,
            border: `0.5px solid ${editing ? C.accent : C.border}`,
            borderRadius: 4,
            padding: "3px 10px",
            fontSize: 10,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div style={{ fontSize: 11, color: C.textTertiary, padding: "4px 0" }}>
          Nothing here yet. Tap Edit to add.
        </div>
      )}

      {items.map((it) => (
        <div
          key={it.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 0",
            borderBottom: `0.5px solid ${C.border}`,
          }}
        >
          <span style={{ flex: 1, fontSize: 13, color: C.text }}>
            <EditableText
              value={it.name}
              onChange={(v) => handlers.onUpdateName(it.id, v)}
              placeholder="name"
              style={{ fontSize: 13 }}
            />
          </span>
          <MiniSparkline values={it.series} color={card.color} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: C.text,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            €
            <EditableText
              value={String(it.value)}
              onChange={(v) => handlers.onUpdateValue(it.id, parseFloat(v) || 0)}
              type="number"
              style={{ fontSize: 13, fontWeight: 500 }}
            />
          </span>
          {editing && (
            <IconBtn onClick={() => handlers.onRemove(it.id)} danger label="Remove">
              ×
            </IconBtn>
          )}
        </div>
      ))}

      {editing && (
        <button
          onClick={handlers.onAdd}
          style={{ ...styles.addBtn, marginTop: 6, fontSize: 11, padding: "5px 10px" }}
        >
          {card.addLabel}
        </button>
      )}
    </div>
  );
}

export default function FinanceProject({ state, setState, meta, onClose, goalHandlers, hideHeader }) {
  const data = state.projects.finance;
  // Subcards-only by default; tap one to expand its list inline beneath.
  const [openKey, setOpenKey] = useState(null);

  const updateFinance = (updater) =>
    setState((s) => ({
      ...s,
      projects: { ...s.projects, finance: updater(s.projects.finance) },
    }));

  // Map a card to its display items: { id, name, value } where value is the
  // latest history snapshot in EUR.
  const itemsFor = (card) => {
    if (card.kind === "revenue") {
      return (data.revenue || []).map((r) => ({
        id: r.id,
        name: r.name,
        value: latestEur(r.history, "month"),
        series: (r.history || []).map((h) => h.eur),
      }));
    }
    return (data.accounts || [])
      .filter((a) => a.type === card.type)
      .map((a) => ({
        id: a.id,
        name: a.name,
        value: latestEur(a.history, "date"),
        series: (a.history || []).map((h) => h.eur),
      }));
  };

  const handlersFor = (card) => {
    if (card.kind === "revenue") {
      const month = currentMonth();
      return {
        onUpdateName: (id, name) =>
          updateFinance((f) => ({
            ...f,
            revenue: (f.revenue || []).map((r) => (r.id === id ? { ...r, name } : r)),
          })),
        onUpdateValue: (id, value) =>
          updateFinance((f) => ({
            ...f,
            revenue: (f.revenue || []).map((r) =>
              r.id === id ? { ...r, history: upsertSnapshot(r.history, "month", month, value) } : r
            ),
          })),
        onAdd: () =>
          updateFinance((f) => {
            const arr = f.revenue || [];
            const id = (arr.reduce((m, x) => Math.max(m, x.id || 0), 0) || 0) + 1;
            return { ...f, revenue: [...arr, { id, name: "New line", project: null, history: [{ month, eur: 0 }] }] };
          }),
        onRemove: (id) =>
          updateFinance((f) => ({ ...f, revenue: (f.revenue || []).filter((r) => r.id !== id) })),
      };
    }
    const date = todayISO();
    return {
      onUpdateName: (id, name) =>
        updateFinance((f) => ({
          ...f,
          accounts: (f.accounts || []).map((a) => (a.id === id ? { ...a, name } : a)),
        })),
      onUpdateValue: (id, value) =>
        updateFinance((f) => ({
          ...f,
          accounts: (f.accounts || []).map((a) =>
            a.id === id ? { ...a, history: upsertSnapshot(a.history, "date", date, value) } : a
          ),
        })),
      onAdd: () =>
        updateFinance((f) => {
          const arr = f.accounts || [];
          const id = (arr.reduce((m, x) => Math.max(m, x.id || 0), 0) || 0) + 1;
          return {
            ...f,
            accounts: [...arr, { id, name: "New account", type: card.type, history: [{ date, eur: 0 }] }],
          };
        }),
      onRemove: (id) =>
        updateFinance((f) => ({ ...f, accounts: (f.accounts || []).filter((a) => a.id !== id) })),
    };
  };

  const lists = Object.fromEntries(CARDS.map((c) => [c.key, itemsFor(c)]));
  const totals = Object.fromEntries(
    CARDS.map((c) => [c.key, lists[c.key].reduce((a, b) => a + b.value, 0)])
  );
  // Time series per category: revenue by month, balances by snapshot date.
  const seriesFor = (card) =>
    card.kind === "revenue"
      ? revenueSeries(data).map((p) => ({ label: p.month, eur: p.eur }))
      : balanceSeries(data, card.type);

  return (
    <Project
      title="Finance"
      color={meta.color}
      onClose={onClose}
      goals={data.goals}
      goalHandlers={goalHandlers}
      hideHeader={hideHeader}
    >
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
        Money over time · tap a category to edit
      </div>

      {CARDS.map((c) => (
        <React.Fragment key={c.key}>
          <ChartCard
            card={c}
            total={totals[c.key]}
            series={seriesFor(c)}
            isOpen={openKey === c.key}
            onClick={() => setOpenKey(openKey === c.key ? null : c.key)}
          />
          {openKey === c.key && (
            <ItemList card={c} items={lists[c.key]} handlers={handlersFor(c)} />
          )}
        </React.Fragment>
      ))}
    </Project>
  );
}
