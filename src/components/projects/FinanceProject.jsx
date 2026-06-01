import React, { useState } from "react";
import { C, styles, tint } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import Project from "./Project.jsx";

const eur = (n) =>
  `${n < 0 ? "-" : ""}€${Math.abs(Math.round(n)).toLocaleString()}`;

const todayISO = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => todayISO().slice(0, 7);

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

function Tile({ card, total, isOpen, onClick }) {
  const bgRest = tint(card.color, 0.06);
  const bgOpen = tint(card.color, 0.12);
  const borderRest = tint(card.color, 0.25);
  const borderOpen = tint(card.color, 0.6);
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        background: isOpen ? bgOpen : bgRest,
        border: `0.5px solid ${isOpen ? borderOpen : borderRest}`,
        borderLeft: `2px solid ${card.color}`,
        borderRadius: 8,
        padding: "8px 10px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minHeight: 60,
      }}
    >
      <span style={{ fontSize: 11, color: C.textSecondary, fontWeight: 500 }}>{card.label}</span>
      <span
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: card.invert && total > 0 ? C.danger : C.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {eur(total)}
      </span>
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
      }));
    }
    return (data.accounts || [])
      .filter((a) => a.type === card.type)
      .map((a) => ({ id: a.id, name: a.name, value: latestEur(a.history, "date") }));
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

  const opened = CARDS.find((c) => c.key === openKey) || null;

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
        Money · tap to edit
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${CARDS.length}, 1fr)`,
          gap: 8,
        }}
      >
        {CARDS.map((c) => (
          <Tile
            key={c.key}
            card={c}
            total={totals[c.key]}
            isOpen={openKey === c.key}
            onClick={() => setOpenKey(openKey === c.key ? null : c.key)}
          />
        ))}
      </div>

      {opened && (
        <ItemList card={opened} items={lists[opened.key]} handlers={handlersFor(opened)} />
      )}
    </Project>
  );
}
