import React, { useMemo, useRef, useState } from "react";
import { C, ACCENT, PILL } from "../../lib/tokens";
import Segmented from "./Segmented.jsx";
import { Pill } from "./Pill.jsx";
import MerchantLogo from "./MerchantLogo.jsx";
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
function Sparkline({ values, color, width = 56, height = 18 }) {
  if (!Array.isArray(values) || values.length < 2) return <span style={{ width, display: "inline-block" }} />;
  const stepX = width / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - 1 - v * (height - 2)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", flexShrink: 0, opacity: 0.75 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function StatCard({ label, value, note, danger }) {
  return (
    <div
      style={{
        background: C.statBg,
        borderRadius: 12,
        padding: "14px 16px",
        flex: "1 1 150px",
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>{label}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: danger ? C.danger : C.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {note && <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 5 }}>{note}</div>}
    </div>
  );
}

// Second-line cadence for a merchant (day / week / one-off — whichever reads
// best). Honours an explicit `freq` from seed data.
function merchantSub(m) {
  const freq = m.freq || (m.count === 1 ? "one-off" : m.count >= 30 ? "day" : "week");
  if (freq === "one-off") return "one-off";
  if (freq === "day") return `${eur(m.perDay)}/day`;
  return `${eur(m.perWeek)}/wk`;
}

const MERCHANT_LIMIT = 4;

function CategoryRow({ cat, rate, expanded, onToggle }) {
  const [showAll, setShowAll] = useState(false);
  const figure = rate === "weekly" ? cat.perWeek : cat.perMonth;
  const suffix = rate === "weekly" ? "/wk" : "/mo";
  const shownMerchants = showAll ? cat.merchants : cat.merchants.slice(0, MERCHANT_LIMIT);
  const hiddenInArray = Math.max(0, cat.merchants.length - MERCHANT_LIMIT); // itemised but collapsed
  const tailCount = cat.extra?.count || 0; // long tail, not itemised
  const collapsedMore = hiddenInArray + tailCount;
  return (
    <div style={{ borderBottom: `0.5px solid ${C.border}` }}>
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 2px", cursor: "pointer" }}
      >
        <span style={{ color: C.textTertiary, fontSize: 13, width: 12, flexShrink: 0, transition: "transform 0.15s", transform: expanded ? "rotate(90deg)" : "none" }}>
          ›
        </span>
        <span style={{ fontSize: 17, color: C.text, fontWeight: expanded ? 600 : 400 }}>{cat.label}</span>
        {cat.business && <Pill name="deductible" size="sm" />}
        {expanded && <span style={{ fontSize: 13, color: C.textTertiary }}>{cat.count}×</span>}
        <span style={{ flex: 1 }} />
        <Sparkline values={cat.spark} color={C.textTertiary} />
        <span style={{ fontSize: 18, fontWeight: 600, color: C.text, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {eur(figure)}
          <span style={{ fontSize: 13, color: C.textTertiary, fontWeight: 400 }}>{suffix}</span>
        </span>
      </div>

      {expanded && (
        <div style={{ paddingBottom: 10 }}>
          {cat.merchants.length === 0 && (
            <div style={{ fontSize: 13, color: C.textTertiary, padding: "4px 2px 12px 24px" }}>
              No merchant breakdown for this category.
            </div>
          )}
          {shownMerchants.map((m) => {
            const fig = rate === "weekly" ? m.perWeek : m.perMonth;
            const sfx = rate === "weekly" ? "/wk" : "/mo";
            return (
              <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 2px 9px 24px" }}>
                <MerchantLogo name={m.name} domain={m.domain} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                  <div style={{ fontSize: 12.5, color: C.textTertiary }}>
                    {m.count} {m.count === 1 ? "order" : "orders"} · {eur(m.total)} total
                  </div>
                </div>
                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600, color: C.text, fontVariantNumeric: "tabular-nums" }}>
                    {eur(fig)}
                    <span style={{ fontSize: 12, color: C.textTertiary, fontWeight: 400 }}>{sfx}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.textTertiary }}>{merchantSub(m)}</div>
                </div>
              </div>
            );
          })}
          {/* Collapsed: reveal the rest of the itemised merchants. */}
          {!showAll && collapsedMore > 0 && (
            <button
              onClick={() => setShowAll(true)}
              style={{ padding: "6px 2px 4px 24px", fontSize: 13.5, color: C.accent, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "block" }}
            >
              + {collapsedMore} more {collapsedMore === 1 ? "merchant" : "merchants"}
            </button>
          )}
          {/* Expanded: long tail isn't itemised; show it as a muted count. */}
          {showAll && tailCount > 0 && (
            <div style={{ padding: "6px 2px 4px 24px", fontSize: 13, color: C.textTertiary }}>
              + {tailCount} more {tailCount === 1 ? "merchant" : "merchants"} in the long tail
            </div>
          )}
          {showAll && hiddenInArray > 0 && (
            <button
              onClick={() => setShowAll(false)}
              style={{ padding: "2px 2px 4px 24px", fontSize: 13.5, color: C.textSecondary, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "block" }}
            >
              show fewer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function FinanceLens({ finance, onImport, onClear }) {
  const [rate, setRate] = useState("monthly");
  const [openKey, setOpenKey] = useState("eating_out");
  const fileRef = useRef(null);

  const summary = useMemo(() => {
    const txns = finance?.transactions || [];
    if (txns.length > 0) {
      return financeStats(txns, finance.range, finance.overrides);
    }
    return FINANCE_SEED;
  }, [finance]);

  const s = summary.stats;
  const get = (slot) => (rate === "weekly" ? slot.perWeek : slot.perMonth);
  const unit = rate === "weekly" ? "/ wk" : "/ mo";
  const dlbl = rate === "weekly" ? "/wk" : "/mo";

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
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: C.text }}>Finance</span>
        <span style={{ fontSize: 13, color: C.textTertiary }}>{rangeLabel(summary)}</span>
        <span style={{ flex: 1 }} />
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: "none" }} />
        <button
          onClick={() => fileRef.current?.click()}
          style={{ border: `0.5px solid ${C.border}`, background: "transparent", color: C.textSecondary, borderRadius: 8, padding: "5px 12px", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          Import CSV
        </button>
        {finance?.transactions?.length > 0 && (
          <button
            onClick={onClear}
            title="Revert to the seeded 6-month export"
            style={{ border: "none", background: "transparent", color: C.textTertiary, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            reset
          </button>
        )}
        <Segmented
          options={[{ value: "monthly", label: "Monthly" }, { value: "weekly", label: "Weekly" }]}
          value={rate}
          onChange={setRate}
          accent={ACCENT.finance}
          size="sm"
        />
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <StatCard label={`Income ${unit}`} value={eur(get(s.income))} note={s.income.note} />
        <StatCard label={`Card spend ${unit}`} value={eur(get(s.cardSpend))} note={s.cardSpend.note} />
        <StatCard label={`Rent ${unit} (net)`} value={eur(get(s.rentNet))} note={s.rentNet.note} />
        <StatCard label={`Net ${unit}`} value={eur(get(s.net))} note={s.net.note} danger={s.net.perMonth < 0} />
      </div>

      {/* Excluded note + deductible */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", margin: "12px 2px 4px" }}>
        <span style={{ fontSize: 12.5, color: C.textTertiary }}>
          {eur(rate === "weekly" ? Math.round((summary.excluded.perMonth * 12) / 52) : summary.excluded.perMonth)}{dlbl} of transfers & round-ups excluded from spend
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: PILL.deductible.color }}>
          <Pill name="deductible" size="sm" />
          {eur(rate === "weekly" ? summary.deductible.perWeek : summary.deductible.perMonth)}{dlbl}
        </span>
      </div>

      {/* Category rows */}
      <div style={{ marginTop: 8 }}>
        {summary.categories.map((cat) => (
          <CategoryRow
            key={cat.key}
            cat={cat}
            rate={rate}
            expanded={openKey === cat.key}
            onToggle={() => setOpenKey(openKey === cat.key ? null : cat.key)}
          />
        ))}
      </div>
    </div>
  );
}
