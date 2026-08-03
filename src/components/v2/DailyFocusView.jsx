import React, { useEffect, useState } from "react";
import { C, ACCENT, tint } from "../../lib/tokens";
import { buildDailyFocus } from "../../lib/dailyFocus.js";
import { buildFallbackSentence, fetchDailyNudge } from "../../lib/dailyNudge.js";
import { financeStats } from "../../lib/financeStats.js";
import { FINANCE_SEED } from "../../lib/financeSeed.js";

// C.danger and ACCENT.priorities are literal hexes (tint()-safe); C.border
// is a CSS var() string — used as-is for the neutral track/border, never
// passed through tint(), which would silently produce an invalid
// rgba(NaN,NaN,NaN,…) stroke for anything that isn't a literal hex.
const BAND_COLOR = { red: C.danger, amber: ACCENT.priorities, neutral: C.textSecondary };
const BAND_BG = { red: tint(C.danger, 0.08), amber: tint(ACCENT.priorities, 0.1), neutral: C.bgSecondary };
const BAND_BORDER = { red: C.danger, amber: ACCENT.priorities, neutral: C.border };
const BAND_TRACK = { red: tint(C.danger, 0.16), amber: tint(ACCENT.priorities, 0.16), neutral: C.border };

function Ring({ size, percent, color, track, strokeWidth, children }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = percent == null ? null : Math.max(0, Math.min(100, percent));
  const offset = pct == null ? 0 : circumference - (pct / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={strokeWidth} />
        {pct != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size <= 34 ? 9 : 11, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
        {children}
      </div>
    </div>
  );
}

function ringLabel(item) {
  return item.ringPercent == null ? "!" : `${item.ringPercent}%`;
}

// Streams a short AI-polished sentence in over the deterministic fallback,
// which renders instantly and stays put if the network call errors.
function HeroSentence({ item }) {
  const [text, setText] = useState(() => buildFallbackSentence(item));
  const [streamed, setStreamed] = useState(false);

  // Depend on every field that actually appears in the sentence, not just
  // kind/key — editing a commitment, crossing a severity band, or logging
  // a session (which changes statLine) all change what the hero sentence
  // should say even when the hero item's identity hasn't changed, and a
  // dep on kind/key alone would leave the old sentence stuck on screen.
  const signature = [item.kind, item.key, item.statLine, item.band, item.commitment || "", item.streak || 0].join("|");

  useEffect(() => {
    setText(buildFallbackSentence(item));
    setStreamed(false);
    const controller = new AbortController();
    let buf = "";
    fetchDailyNudge(item, {
      signal: controller.signal,
      onDelta: (chunk) => {
        buf += chunk;
        if (buf.trim()) {
          setText(buf);
          setStreamed(true);
        }
      },
      onDone: ({ stopReason } = {}) => {
        // The model reached for a tool instead of finishing the sentence —
        // whatever streamed in so far is a cut-off fragment, not a real
        // answer. Revert to the deterministic fallback rather than leave a
        // half-sentence on screen styled as if it were complete.
        if (stopReason === "tool_use") {
          setText(buildFallbackSentence(item));
          setStreamed(false);
        }
      },
      onError: () => {}, // fallback sentence already on screen — leave it
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <div
      style={{
        fontSize: 13,
        lineHeight: 1.55,
        marginTop: 12,
        color: C.text,
        animation: streamed ? "focusReveal 0.6s ease" : "none",
      }}
    >
      {text}
    </div>
  );
}

function StreakBadge({ streak }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: C.accent,
        background: C.accentLight,
        borderRadius: 999,
        padding: "2px 8px",
        marginLeft: 8,
        whiteSpace: "nowrap",
      }}
    >
      {streak}-day streak
    </span>
  );
}

function HeroCard({ item, total, onPrimary, onOpenCard, onEditCommitment }) {
  const color = BAND_COLOR[item.band];
  const bg = item.band === "neutral" ? C.card : BAND_BG[item.band];
  const border = item.band === "neutral" ? C.border : BAND_BORDER[item.band];
  return (
    <div
      onClick={onOpenCard}
      style={{ position: "relative", marginTop: 4, borderRadius: 16, padding: "16px 16px 14px", background: bg, border: `0.5px solid ${border}`, cursor: "pointer" }}
    >
      <div style={{ position: "absolute", top: 14, right: 16, fontSize: 10, fontWeight: 700, color, opacity: 0.55, letterSpacing: "0.04em" }}>
        #1 OF {total}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Ring size={46} percent={item.ringPercent} color={color} track={BAND_TRACK[item.band]} strokeWidth={5}>
          {ringLabel(item)}
        </Ring>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
            {item.lossPreview && <StreakBadge streak={item.streak} />}
          </div>
          <div style={{ fontSize: 11.5, color, fontWeight: 600, marginTop: 1, fontVariantNumeric: "tabular-nums" }}>{item.statLine}</div>
        </div>
      </div>

      <HeroSentence item={item} />

      {item.kind === "habit" && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 13, flexWrap: "wrap" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrimary();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: color,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Log a session →
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const next = window.prompt(
                `What are you holding yourself to on ${item.label}? (blank to clear)`,
                item.commitment || ""
              );
              if (next !== null) onEditCommitment(item.key, next.trim() || null);
            }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 11,
              color: C.textTertiary,
              textDecoration: "underline dotted",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {item.commitment ? "edit commitment" : "set a commitment"}
          </button>
        </div>
      )}
    </div>
  );
}

function TierCard({ item, tier, onOpenCard, onPrimary }) {
  const color = BAND_COLOR[item.band];
  const bg = item.band === "neutral" ? C.card : BAND_BG[item.band];
  const border = item.band === "neutral" ? C.border : BAND_BORDER[item.band];
  const small = tier === 3;
  return (
    <div
      onClick={onOpenCard}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 8,
        borderRadius: 12,
        padding: "10px 12px",
        background: bg,
        border: `0.5px solid ${border}`,
        opacity: small ? 0.85 : 1,
        cursor: "pointer",
      }}
    >
      <Ring size={30} percent={item.ringPercent} color={color} track={BAND_TRACK[item.band]} strokeWidth={4}>
        {ringLabel(item)}
      </Ring>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: small ? 11.5 : 12.5, fontWeight: small ? 500 : 600, color: C.text, display: "flex", alignItems: "center" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
          {item.lossPreview && <StreakBadge streak={item.streak} />}
        </div>
        <div style={{ fontSize: 10.5, color: C.textSecondary, marginTop: 1 }}>{item.statLine}</div>
      </div>
      {item.kind === "habit" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrimary();
          }}
          aria-label={`Log ${item.label}`}
          title={`Log ${item.label}`}
          style={{
            flexShrink: 0,
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: `1px solid ${color}`,
            background: "transparent",
            color,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </button>
      )}
      <div style={{ marginLeft: item.kind === "habit" ? 4 : "auto", fontSize: 9.5, fontWeight: 700, color, opacity: 0.5, flexShrink: 0 }}>#{tier}</div>
    </div>
  );
}

function NavRow({ label, detail, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "none",
        border: "none",
        borderBottom: `0.5px solid ${C.border}`,
        padding: "11px 2px",
        fontSize: 12.5,
        fontFamily: "inherit",
        color: C.text,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ fontWeight: 500 }}>{label}</span>
      <span style={{ color: C.textSecondary, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
        {detail}
        <span style={{ color: C.textTertiary }}>{"›"}</span>
      </span>
    </button>
  );
}

function financeMonthlySpendLabel(finance) {
  try {
    const txns = finance?.transactions || [];
    const hasValidRange = !!(finance?.range?.start && finance?.range?.end);
    // A malformed/legacy blob (transactions present, range missing) doesn't
    // throw inside financeStats — it silently computes NaN — so fall back
    // to the seeded summary the same way an empty-transactions blob does,
    // rather than trust financeStats() to error out on bad input.
    const summary = txns.length > 0 && hasValidRange ? financeStats(txns, finance.range, finance.overrides) : FINANCE_SEED;
    const perMonth = summary.stats.cardSpend.perMonth;
    if (!Number.isFinite(perMonth)) return "—";
    return `€${Math.round(perMonth).toLocaleString()}/mo card spend`;
  } catch {
    return "—";
  }
}

// Daily focus — the default landing screen. Ranks active habits and open
// tasks by severity (dailyFocus.js), headlines the top 3, and demotes
// everything else to a one-line nav list. Structure (ring/stat/decay)
// renders instantly from local state; the hero's sentence streams in a beat
// behind via dailyNudge.js.
export default function DailyFocusView({ state, onNavigate, onOpenTask, onLogHabit, onEditCommitment }) {
  // Refreshed on a timer, not computed once at mount — this is meant to be
  // opened and left open across a session, and a frozen `today` would let
  // the decay bar, "due today" scoring, and the overdue count all go stale
  // (worst case: silently wrong across a midnight rollover).
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const focus = buildDailyFocus(state, today);
  const { items, overflow, decay } = focus;

  const openTasks = (state.tasks || []).filter((t) => t.status !== "done");
  const overdueCount = openTasks.filter((t) => t.due && t.due < focus.todayISO).length;
  const habitsTracked = (state.habits || []).filter((h) => h.active !== false).length;

  const openItem = (item) => {
    if (item.kind === "task") onOpenTask(item.key);
    else onNavigate("habits");
  };

  if (!items.length) {
    return (
      <div style={{ marginTop: 4, borderRadius: 16, padding: "20px 16px", background: C.card, border: `0.5px solid ${C.border}`, textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Nothing urgent right now.</div>
        <div style={{ fontSize: 12.5, color: C.textSecondary, marginTop: 4 }}>Habits are on pace and nothing's overdue.</div>
      </div>
    );
  }

  const [hero, t2, t3] = items;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <HeroCard
        item={hero}
        total={items.length}
        onPrimary={() => onLogHabit(hero.key, "yes")}
        onOpenCard={() => openItem(hero)}
        onEditCommitment={onEditCommitment}
      />

      {hero.kind === "habit" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.bgTertiary, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round(decay.fraction * 100)}%`, background: ACCENT.priorities, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 10.5, color: C.textSecondary, whiteSpace: "nowrap" }}>~{decay.hoursLeft}h left today</div>
        </div>
      )}

      {t2 && <TierCard item={t2} tier={2} onOpenCard={() => openItem(t2)} onPrimary={() => onLogHabit(t2.key, "yes")} />}
      {t3 && <TierCard item={t3} tier={3} onOpenCard={() => openItem(t3)} onPrimary={() => onLogHabit(t3.key, "yes")} />}

      {overflow.length > 0 && (
        <div style={{ fontSize: 10.5, color: C.textTertiary, textAlign: "center", margin: "12px 0 2px" }}>
          {overflow.map((o) => `${o.label} (${o.severity})`).join(" and ")} narrowly missed the cut
        </div>
      )}

      <div style={{ marginTop: 16, borderTop: `0.5px solid ${C.border}`, paddingTop: 4 }}>
        <NavRow
          label="Tasks"
          detail={`${openTasks.length} open${overdueCount ? ` · ${overdueCount} overdue` : ""}`}
          onClick={() => onNavigate("tasks")}
        />
        <NavRow label="Finance" detail={financeMonthlySpendLabel(state.finance)} onClick={() => onNavigate("finance")} />
        <NavRow label="Habits — full view" detail={`${habitsTracked} tracked`} onClick={() => onNavigate("habits")} />
      </div>
    </div>
  );
}
