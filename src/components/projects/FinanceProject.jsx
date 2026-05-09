import React, { useState } from "react";
import { C, styles, tint } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import Project from "./Project.jsx";

// Defensive money read — handles the new plain-EUR-number shape AND the
// legacy `{amount, ccy, eur, ...}` snapshot shape that older state blobs
// may still carry. Always returns an EUR number.
function moneyEur(item) {
  const v = item?.amount ?? item?.balance ?? item?.value;
  if (typeof v === "number") return v;
  if (v && typeof v === "object") return v.eur ?? v.amount ?? 0;
  return 0;
}
function itemName(item) {
  return item?.name ?? item?.account ?? item?.label ?? "—";
}
const eur = (n) =>
  `${n < 0 ? "-" : ""}€${Math.abs(Math.round(n)).toLocaleString()}`;

// Subcard meta — one per finance area. Color used for tint + accent.
const CARDS = [
  { key: "debts", label: "Debts", color: "#791F1F", listKey: "debts", addLabel: "+ Add debt", invert: true },
  { key: "savings", label: "Savings", color: "#3B6D11", listKey: "savings", addLabel: "+ Add account" },
  { key: "investments", label: "Investments", color: "#185FA5", listKey: "investments", addLabel: "+ Add account" },
  { key: "revenue", label: "Revenue", color: "#534AB7", listKey: "monthlyRevenue", addLabel: "+ Add line" },
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

function ItemList({ card, items, listHandlers }) {
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

      {items.map((it) => {
        const amount = moneyEur(it);
        return (
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
                value={itemName(it)}
                onChange={(v) => listHandlers.onUpdate(it.id, { name: v })}
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
                value={String(amount)}
                onChange={(v) =>
                  listHandlers.onUpdate(it.id, { amount: parseFloat(v) || 0 })
                }
                type="number"
                style={{ fontSize: 13, fontWeight: 500 }}
              />
            </span>
            {editing && (
              <IconBtn onClick={() => listHandlers.onRemove(it.id)} danger label="Remove">
                ×
              </IconBtn>
            )}
          </div>
        );
      })}

      {editing && (
        <button
          onClick={listHandlers.onAdd}
          style={{ ...styles.addBtn, marginTop: 6, fontSize: 11, padding: "5px 10px" }}
        >
          {card.addLabel}
        </button>
      )}
    </div>
  );
}

export default function FinanceProject({ state, setState, meta, onClose, goalHandlers }) {
  const data = state.projects.finance;
  const [openKey, setOpenKey] = useState("debts"); // default expanded

  const updateFinance = (updater) =>
    setState((s) => ({
      ...s,
      projects: { ...s.projects, finance: updater(s.projects.finance) },
    }));

  const handlersFor = (listKey, factoryName) => ({
    onAdd: () =>
      updateFinance((f) => {
        const arr = f[listKey] || [];
        const nextId = (arr.reduce((m, x) => Math.max(m, x.id || 0), 0) || 0) + 1;
        return { ...f, [listKey]: [...arr, { id: nextId, name: factoryName, amount: 0 }] };
      }),
    onUpdate: (id, patch) =>
      updateFinance((f) => ({
        ...f,
        [listKey]: (f[listKey] || []).map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),
    onRemove: (id) =>
      updateFinance((f) => ({
        ...f,
        [listKey]: (f[listKey] || []).filter((x) => x.id !== id),
      })),
  });

  const handlersByKey = {
    debts: handlersFor("debts", "New debt"),
    savings: handlersFor("savings", "New account"),
    investments: handlersFor("investments", "New account"),
    revenue: handlersFor("monthlyRevenue", "New line"),
  };

  // Read each list once + sum.
  const lists = Object.fromEntries(CARDS.map((c) => [c.key, data[c.listKey] || []]));
  const totals = Object.fromEntries(
    CARDS.map((c) => [c.key, lists[c.key].reduce((a, b) => a + moneyEur(b), 0)])
  );

  const opened = CARDS.find((c) => c.key === openKey) || null;

  return (
    <Project
      title="Finance"
      color={meta.color}
      onClose={onClose}
      goals={data.goals}
      goalHandlers={goalHandlers}
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
        <ItemList
          card={opened}
          items={lists[opened.key]}
          listHandlers={handlersByKey[opened.key]}
        />
      )}
    </Project>
  );
}
