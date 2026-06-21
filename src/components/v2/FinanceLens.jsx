import React, { useMemo, useRef, useState } from "react";
import { C } from "../../lib/tokens";
import Segmented from "./Segmented.jsx";
import MerchantLogo from "./MerchantLogo.jsx";
import StackedBars from "./StackedBars.jsx";
import { financeStats } from "../../lib/financeStats.js";
import { FINANCE_SEED } from "../../lib/financeSeed.js";
import { parseRevolutCsv } from "../../lib/parseRevolutCsv.js";
import { prettyMerchant } from "../../lib/merchants.js";

const eur = (n) => `${n < 0 ? "−" : ""}€${Math.abs(Math.round(n)).toLocaleString()}`;
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function rangeLabel(summary) {
  if (summary.rangeLabel) return summary.rangeLabel;
  const ms = summary.range?.months || [];
  if (!ms.length) return "";
  const fmt = (m) => MONTHS_SHORT[parseInt(m.slice(5, 7), 10) - 1];
  return `${fmt(ms[0])} – ${fmt(ms[ms.length - 1])} · ${ms.length} mo`;
}

// Per-category trend polyline (spark values 0..1).
function Sparkline({ values, color = C.textTertiary, width = 80, height = 26 }) {
  if (!Array.isArray(values) || values.length < 2) return <span />;
  const stepX = width / (values.length - 1);
  const pts = values.map((v, i) => `${(i * stepX).toFixed(1)},${(height - 2 - v * (height - 4)).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block", flexShrink: 0, opacity: 0.7 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function StatCard({ label, value, note, danger, positive }) {
  return (
    <div style={{ background: C.statBg, borderRadius: 14, padding: "15px 17px", flex: "1 1 150px", minWidth: 140 }}>
      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em", color: danger ? C.danger : positive ? C.success : C.text, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {note && <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 5 }}>{note}</div>}
    </div>
  );
}

// Frequency of a merchant from its count over the period. Only "regular"
// merchants get a per-month/week rate; one-off / occasional ones just show a
// total, so we don't imply a recurring cost that isn't there.
function frequencyOf(count, days) {
  if (!count || count <= 1) return { label: "One-off", regular: false };
  const interval = days / count;
  if (interval <= 3) return { label: "Daily", regular: true };
  if (interval <= 10) return { label: "Weekly", regular: true };
  if (interval <= 45) return { label: "Monthly", regular: true };
  return { label: "Occasional", regular: false };
}

// One category tile in the grid.
function CategoryCard({ cat, rate, onOpen }) {
  const figure = rate === "weekly" ? cat.perWeek : cat.perMonth;
  const suffix = rate === "weekly" ? "/wk" : "/mo";
  return (
    <button
      onClick={onOpen}
      style={{
        textAlign: "left",
        background: C.card,
        border: `0.5px solid ${C.border}`,
        borderRadius: 14,
        padding: "15px 17px",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minHeight: 116,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: C.text, flex: 1, minWidth: 0 }}>{cat.label}</span>
        <Sparkline values={cat.spark} />
      </div>
      <div style={{ fontSize: 25, fontWeight: 600, color: C.text, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
        {eur(figure)}
        <span style={{ fontSize: 14, color: C.textTertiary, fontWeight: 400 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 12.5, color: C.textTertiary }}>{cat.count}×</div>
    </button>
  );
}

// Right-side drawer listing a category's merchants.
function MerchantsDrawer({ cat, rate, days, onClose }) {
  if (!cat) return null;
  const figure = rate === "weekly" ? cat.perWeek : cat.perMonth;
  const suffix = rate === "weekly" ? "/wk" : "/mo";
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 200, display: "flex", justifyContent: "flex-end", animation: "overlayIn 0.15s ease" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          borderLeft: `0.5px solid ${C.borderStrong}`,
          height: "100%",
          width: "min(440px, 100%)",
          boxSizing: "border-box",
          padding: "20px 22px calc(24px + env(safe-area-inset-bottom))",
          overflowY: "auto",
          boxShadow: "-12px 0 40px rgba(0,0,0,0.18)",
          animation: "drawerIn 0.18s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 21, fontWeight: 600, color: C.text }}>{cat.label}</span>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: C.textTertiary, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ fontSize: 14, color: C.textTertiary, marginBottom: 16 }}>
          {eur(figure)}{suffix} · {cat.count}×
        </div>

        {cat.merchants.length === 0 && (
          <div style={{ fontSize: 13.5, color: C.textTertiary }}>No merchant breakdown for this category.</div>
        )}
        {cat.merchants.map((m) => {
          const f = frequencyOf(m.count, days);
          const fig = rate === "weekly" ? m.perWeek : m.perMonth;
          const sfx = rate === "weekly" ? "/wk" : "/mo";
          return (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `0.5px solid ${C.border}` }}>
              <MerchantLogo name={m.name} domain={m.domain} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, background: C.bgTertiary, borderRadius: 5, padding: "1px 7px" }}>{f.label}</span>
                  <span style={{ fontSize: 12.5, color: C.textTertiary }}>{m.count}×</span>
                </div>
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                {f.regular ? (
                  <>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: C.text, fontVariantNumeric: "tabular-nums" }}>
                      {eur(fig)}<span style={{ fontSize: 12, color: C.textTertiary, fontWeight: 400 }}>{sfx}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.textTertiary }}>{eur(m.total)} total</div>
                  </>
                ) : (
                  <div style={{ fontSize: 15.5, fontWeight: 600, color: C.text, fontVariantNumeric: "tabular-nums" }}>{eur(m.total)}</div>
                )}
              </div>
            </div>
          );
        })}
        {cat.extra?.count > 0 && (
          <div style={{ padding: "10px 0", fontSize: 13, color: C.textTertiary }}>
            + {cat.extra.count} more {cat.extra.count === 1 ? "merchant" : "merchants"} in the long tail
          </div>
        )}
      </div>
    </div>
  );
}

export default function FinanceLens({ finance, onImport, onClear }) {
  const [rate, setRate] = useState("monthly");
  const [openKey, setOpenKey] = useState(null);
  const fileRef = useRef(null);

  const summary = useMemo(() => {
    const txns = finance?.transactions || [];
    if (txns.length > 0) return financeStats(txns, finance.range, finance.overrides);
    return FINANCE_SEED;
  }, [finance]);

  const s = summary.stats;
  const get = (slot) => (rate === "weekly" ? slot.perWeek : slot.perMonth);
  const unit = rate === "weekly" ? "/ wk" : "/ mo";
  const dlbl = rate === "weekly" ? "/wk" : "/mo";
  const openCat = summary.categories.find((c) => c.key === openKey) || null;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txns = parseRevolutCsv(String(reader.result)).map((t) => ({ ...t, merchant: prettyMerchant(t.desc) }));
      if (txns.length) {
        const dates = txns.map((t) => t.date).sort();
        onImport(txns, { start: dates[0], end: dates[dates.length - 1] });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{ fontSize: 24, fontWeight: 600, color: C.text }}>Finance</span>
        <span style={{ fontSize: 13, color: C.textTertiary }}>{rangeLabel(summary)}</span>
        <span style={{ flex: 1 }} />
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} style={{ border: `0.5px solid ${C.border}`, background: "transparent", color: C.textSecondary, borderRadius: 8, padding: "6px 12px", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
          Import CSV
        </button>
        {finance?.transactions?.length > 0 && (
          <button onClick={onClear} title="Revert to the seeded export" style={{ border: "none", background: "transparent", color: C.textTertiary, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>reset</button>
        )}
        <Segmented options={[{ value: "monthly", label: "Monthly" }, { value: "weekly", label: "Weekly" }]} value={rate} onChange={setRate} accent={C.accent} size="sm" />
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <StatCard label={`Income ${unit}`} value={eur(get(s.income))} note={s.income.note} positive />
        <StatCard label={`Card spend ${unit}`} value={eur(get(s.cardSpend))} note={s.cardSpend.note} />
        <StatCard label={`Rent ${unit} (net)`} value={eur(get(s.rentNet))} note={s.rentNet.note} />
        <StatCard label={`Net ${unit}`} value={eur(get(s.net))} note={s.net.note} danger={s.net.perMonth < 0} positive={s.net.perMonth >= 0} />
      </div>

      {/* Excluded note */}
      <div style={{ margin: "14px 2px 12px" }}>
        <span style={{ fontSize: 12.5, color: C.textTertiary }}>
          {eur(rate === "weekly" ? Math.round((summary.excluded.perMonth * 12) / 52) : summary.excluded.perMonth)}{dlbl} of transfers & round-ups excluded from spend
        </span>
      </div>

      {/* Monthly spend stacked by category (+ flat rent at the base) */}
      <StackedBars months={summary.range?.months} categories={summary.categories} rent={1500} />

      {/* Category card grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
        {summary.categories.map((cat) => (
          <CategoryCard key={cat.key} cat={cat} rate={rate} onOpen={() => setOpenKey(cat.key)} />
        ))}
      </div>

      <MerchantsDrawer cat={openCat} rate={rate} days={summary.range?.days || 199} onClose={() => setOpenKey(null)} />
    </div>
  );
}
