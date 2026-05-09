import React from "react";
import { C, styles } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import Project from "./Project.jsx";
import { fmt, toMoneySync } from "../../lib/money";

const CCYS = ["EUR", "GBP", "USD", "CHF"];

function MoneyInput({ money, onChange }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      <select
        value={money?.ccy || "EUR"}
        onChange={(e) => onChange(toMoneySync(money?.amount || 0, e.target.value))}
        style={{
          fontSize: 12,
          padding: "1px 4px",
          borderRadius: 4,
          border: `0.5px solid ${C.border}`,
          background: C.bg,
          fontFamily: "inherit",
        }}
      >
        {CCYS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <EditableText
        value={String(money?.amount ?? 0)}
        onChange={(v) => onChange(toMoneySync(parseFloat(v) || 0, money?.ccy || "EUR"))}
        type="number"
        style={{ fontSize: 13, fontWeight: 500 }}
      />
      <span style={{ fontSize: 11, color: C.textTertiary }}>
        {money?.ccy !== "EUR" ? `≈ €${money?.eur?.toLocaleString() ?? 0}` : ""}
      </span>
    </span>
  );
}

function ListSection({ title, items, addLabel, onAdd, onUpdate, onRemove, render }) {
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
      </div>
      {(items || []).map((it) => (
        <div
          key={it.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 0",
            borderBottom: `0.5px solid ${C.border}`,
          }}
        >
          {render(it, (patch) => onUpdate(it.id, patch))}
          <IconBtn onClick={() => onRemove(it.id)} danger label="Remove">
            ×
          </IconBtn>
        </div>
      ))}
      {(!items || items.length === 0) && (
        <div style={{ fontSize: 11, color: C.textTertiary, padding: "4px 0" }}>none yet</div>
      )}
      <button onClick={onAdd} style={{ ...styles.addBtn, padding: "6px 10px", fontSize: 12 }}>
        + {addLabel}
      </button>
    </div>
  );
}

export default function FinanceProject({ state, setState, meta, onClose, goalHandlers }) {
  const data = state.projects.finance;

  const updateFinance = (updater) =>
    setState((s) => ({
      ...s,
      projects: { ...s.projects, finance: updater(s.projects.finance) },
    }));

  const listHandlers = (key, factory) => ({
    onAdd: () =>
      updateFinance((f) => ({
        ...f,
        [key]: [...(f[key] || []), factory((f[key] || []).reduce((m, x) => Math.max(m, x.id || 0), 0) + 1)],
      })),
    onUpdate: (id, patch) =>
      updateFinance((f) => ({
        ...f,
        [key]: (f[key] || []).map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),
    onRemove: (id) =>
      updateFinance((f) => ({
        ...f,
        [key]: (f[key] || []).filter((x) => x.id !== id),
      })),
  });

  const debts = listHandlers("debts", (id) => ({ id, label: "New debt", amount: toMoneySync(0, "EUR"), lender: "", due: "" }));
  const tax = listHandlers("taxTimeline", (id) => ({ id, label: "New deadline", deadline: "", amount: toMoneySync(0, "EUR"), paid: false }));
  const savings = listHandlers("savings", (id) => ({ id, account: "Account", balance: toMoneySync(0, "EUR"), target: null }));
  const investments = listHandlers("investments", (id) => ({ id, account: "Account", value: toMoneySync(0, "EUR"), breakdown: "" }));

  const rev = data.monthlyRevenue || {};
  const updateRevenue = (key, patch) =>
    updateFinance((f) => ({ ...f, monthlyRevenue: { ...f.monthlyRevenue, [key]: { ...f.monthlyRevenue[key], ...patch } } }));

  // Roll-up totals (in EUR snapshots — purely indicative).
  const debtTotal = (data.debts || []).reduce((a, b) => a + (b.amount?.eur || 0), 0);
  const savTotal = (data.savings || []).reduce((a, b) => a + (b.balance?.eur || 0), 0);
  const invTotal = (data.investments || []).reduce((a, b) => a + (b.value?.eur || 0), 0);

  return (
    <Project title="Finance" color={meta.color} onClose={onClose} goals={data.goals} goalHandlers={goalHandlers}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 16 }}>
        <Stat label="Debts (EUR)" value={`€${debtTotal.toLocaleString()}`} />
        <Stat label="Savings (EUR)" value={`€${savTotal.toLocaleString()}`} />
        <Stat label="Invested (EUR)" value={`€${invTotal.toLocaleString()}`} />
        <Stat label="Net (EUR)" value={`€${(savTotal + invTotal - debtTotal).toLocaleString()}`} accent />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        <ListSection
          title="Debts"
          items={data.debts}
          addLabel="Add debt"
          onAdd={debts.onAdd}
          onUpdate={debts.onUpdate}
          onRemove={debts.onRemove}
          render={(d, patch) => (
            <>
              <span style={{ flex: 1, fontSize: 13 }}>
                <EditableText value={d.label} onChange={(v) => patch({ label: v })} style={{ fontSize: 13 }} />
                <span style={{ fontSize: 11, color: C.textTertiary, marginLeft: 6 }}>
                  <EditableText value={d.lender || ""} onChange={(v) => patch({ lender: v })} placeholder="lender" style={{ fontSize: 11 }} />
                </span>
              </span>
              <MoneyInput money={d.amount} onChange={(m) => patch({ amount: m })} />
            </>
          )}
        />

        <ListSection
          title="Tax timeline"
          items={data.taxTimeline}
          addLabel="Add deadline"
          onAdd={tax.onAdd}
          onUpdate={tax.onUpdate}
          onRemove={tax.onRemove}
          render={(t, patch) => (
            <>
              <span style={{ flex: 1, fontSize: 13 }}>
                <EditableText value={t.label} onChange={(v) => patch({ label: v })} style={{ fontSize: 13 }} />
                <span style={{ fontSize: 11, color: C.textTertiary, marginLeft: 6 }}>
                  <EditableText value={t.deadline || ""} onChange={(v) => patch({ deadline: v })} placeholder="YYYY-MM-DD" style={{ fontSize: 11 }} />
                </span>
              </span>
              <MoneyInput money={t.amount} onChange={(m) => patch({ amount: m })} />
              <label style={{ fontSize: 10, color: C.textTertiary, display: "flex", alignItems: "center", gap: 4 }}>
                <input type="checkbox" checked={!!t.paid} onChange={(e) => patch({ paid: e.target.checked })} />
                paid
              </label>
            </>
          )}
        />

        <ListSection
          title="Savings"
          items={data.savings}
          addLabel="Add account"
          onAdd={savings.onAdd}
          onUpdate={savings.onUpdate}
          onRemove={savings.onRemove}
          render={(sv, patch) => (
            <>
              <span style={{ flex: 1, fontSize: 13 }}>
                <EditableText value={sv.account} onChange={(v) => patch({ account: v })} style={{ fontSize: 13 }} />
              </span>
              <MoneyInput money={sv.balance} onChange={(m) => patch({ balance: m })} />
            </>
          )}
        />

        <ListSection
          title="Investments"
          items={data.investments}
          addLabel="Add account"
          onAdd={investments.onAdd}
          onUpdate={investments.onUpdate}
          onRemove={investments.onRemove}
          render={(inv, patch) => (
            <>
              <span style={{ flex: 1, fontSize: 13 }}>
                <EditableText value={inv.account} onChange={(v) => patch({ account: v })} style={{ fontSize: 13 }} />
                <span style={{ fontSize: 11, color: C.textTertiary, marginLeft: 6 }}>
                  <EditableText value={inv.breakdown || ""} onChange={(v) => patch({ breakdown: v })} placeholder="breakdown" style={{ fontSize: 11 }} />
                </span>
              </span>
              <MoneyInput money={inv.value} onChange={(m) => patch({ value: m })} />
            </>
          )}
        />
      </div>

      <div style={{ marginTop: 18 }}>
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
          Monthly revenue
        </div>
        <RevenueRow
          label="Unify Digital (12% of Churchill)"
          val={fmt(rev.ud?.manualOverride) === "—" ? `${rev.ud?.percent || 0}%` : fmt(rev.ud?.manualOverride)}
          onOverride={(m) => updateRevenue("ud", { manualOverride: m })}
          override={rev.ud?.manualOverride}
        />
        <RevenueRow
          label="Sears Melvin"
          val={fmt(rev.sm?.amount)}
          onOverride={(m) => updateRevenue("sm", { amount: m })}
          override={rev.sm?.amount}
        />
        <RevenueRow
          label="BODDY"
          val={fmt(rev.boddy?.amount)}
          onOverride={(m) => updateRevenue("boddy", { amount: m })}
          override={rev.boddy?.amount}
        />
        <RevenueRow
          label="Personal training (per week)"
          val={fmt(rev.personalTraining?.amount)}
          onOverride={(m) => updateRevenue("personalTraining", { amount: m })}
          override={rev.personalTraining?.amount}
        />
      </div>
    </Project>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ background: C.bgSecondary, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 11, color: C.textSecondary }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, marginTop: 2, fontVariantNumeric: "tabular-nums", color: accent ? C.accent : C.text }}>
        {value}
      </div>
    </div>
  );
}

function RevenueRow({ label, val, onOverride, override }) {
  void val;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `0.5px solid ${C.border}` }}>
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <MoneyInput money={override} onChange={onOverride} />
    </div>
  );
}
