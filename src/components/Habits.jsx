import React, { useState } from "react";
import { C } from "../lib/tokens";
import HabitRing from "./HabitRing.jsx";
import HabitConfirm from "./HabitConfirm.jsx";
import SectionShell, { SystemIcon } from "./SectionShell.jsx";
import { isoYesterday, isoDate, statusFor, streakFor, hasUnanswered } from "../lib/habits";
import "./Habits.css";

// Habits taxonomy + targets. `target` hits expected per `period` days. Sub
// renders below the name. Inline so the file stays self-contained; can be
// promoted into defaultState.js later if Arin wants to edit targets in-app.
const HABITS = [
  { key: "spanish", label: "Spanish", target: 7, period: 7, sub: "daily" },
  { key: "gym", label: "Gym", target: 5, period: 7, sub: "5x / week" },
  { key: "clean", label: "Clean", target: 3, period: 7, sub: "3x / week" },
  { key: "sleep", label: "Sleep", target: 7, period: 7, sub: "8h+ daily" },
];

const STRIP_DAYS = 21;
const DOW_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const HABITS_COLOR = "#3B6D11"; // green — same family as Health, distinct row.

// Today at local midnight.
function startOfToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Build the 21-day window ending today. Index 0 = oldest, 20 = today.
function stripDates() {
  const today = startOfToday();
  const out = [];
  for (let i = STRIP_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

// Hits over the last `period` days for a habit.
function hitsInPeriod(habit, habitLog, days) {
  const today = startOfToday();
  let n = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if ((habitLog[habit] || []).includes(isoDate(d))) n++;
  }
  return n;
}

export default function Habits({ habitLog, habitNoLog, onConfirm }) {
  const [expanded, setExpanded] = useState(false);
  const [pop, setPop] = useState(null); // { habit, dateISO, x, y }
  const [confirmOpen, setConfirmOpen] = useState(null);
  const yesISO = isoYesterday();
  const anyUnanswered = HABITS.some((h) => hasUnanswered(h.key, habitLog, habitNoLog));
  const meta = expanded
    ? "last 21 days"
    : anyUnanswered
    ? "tap a ring to confirm yesterday"
    : "all caught up";

  const dates = stripDates();

  const openPop = (habitKey, date, evt) => {
    const rect = evt.currentTarget.getBoundingClientRect();
    setPop({
      habit: habitKey,
      dateISO: isoDate(date),
      x: Math.min(window.innerWidth - 220, rect.left + rect.width / 2 - 100),
      y: rect.bottom + 6,
    });
  };

  const answer = (val) => {
    if (!pop) return;
    onConfirm(pop.habit, pop.dateISO, val);
    setPop(null);
  };

  return (
    <SectionShell
      icon={<SystemIcon kind="habits" color={HABITS_COLOR} size={18} />}
      label="Habits"
      color={HABITS_COLOR}
      meta={meta}
      // Click row toggles between compact rings (collapsed) and the full
      // 21-day grid view (expanded).
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
    >
      {!expanded ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {HABITS.map((h) => {
            const status = statusFor(h.key, yesISO, habitLog, habitNoLog);
            const streak = streakFor(h.key, habitLog, habitNoLog);
            return (
              <div
                key={h.key}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
              >
                <HabitRing
                  habit={h.key}
                  status={status}
                  streak={streak}
                  size={44}
                  onClick={() => setConfirmOpen(h.key)}
                />
                <div style={{ fontSize: 11, color: C.text, fontWeight: 500 }}>{h.label}</div>
                <div style={{ fontSize: 10, color: C.textTertiary, fontVariantNumeric: "tabular-nums" }}>
                  {streak}d
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Day-of-week header strip */}
          <div className="habit-dow-strip">
            <div /> {/* ring col */}
            <div /> {/* name col */}
            <div className="habit-dow-cells">
              {dates.map((d, i) => (
                <div key={i} className="habit-dow-mark">
                  {DOW_LETTERS[d.getDay()]}
                </div>
              ))}
            </div>
            <div className="habit-dow-rh">Streak</div>
            <div className="habit-dow-rh">Goal</div>
          </div>

          {/* Rows */}
          <div className="habit-rows">
            {HABITS.map((h) => {
              const status = statusFor(h.key, yesISO, habitLog, habitNoLog);
              const streak = streakFor(h.key, habitLog, habitNoLog);
              const ringPulse = status === "unanswered";
              const hits = hitsInPeriod(h.key, habitLog, h.period);
              const delta = hits - h.target;
              const goalCls =
                delta > 0 ? "habit-goal-above" : delta < 0 ? "habit-goal-below" : "habit-goal-ontrack";
              const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;

              return (
                <div key={h.key} className="habit-row">
                  <div className={ringPulse ? "habit-ring-pulse" : ""}>
                    <HabitRing
                      habit={h.key}
                      status={status}
                      streak={streak}
                      size={36}
                      onClick={() => setConfirmOpen(h.key)}
                    />
                  </div>

                  <div className="habit-name-col">
                    <div className="habit-name">{h.label}</div>
                    <div className="habit-name-sub">{h.sub}</div>
                  </div>

                  <div className="habit-strip-wrap">
                    {dates.map((d, i) => {
                      const iso = isoDate(d);
                      const s = statusFor(h.key, iso, habitLog, habitNoLog);
                      const isToday = i === STRIP_DAYS - 1;
                      const cls = [
                        "habit-cell",
                        s === "yes" ? "habit-cell-hit" : "",
                        s === "no" ? "habit-cell-miss" : "",
                        isToday ? "habit-cell-today" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <button
                          key={iso}
                          className={cls}
                          title={`${iso} — ${s}`}
                          onClick={(evt) => openPop(h.key, d, evt)}
                        />
                      );
                    })}
                  </div>

                  <div className={`habit-streak${streak === 0 ? " habit-streak-zero" : ""}`}>
                    <div className="habit-streak-num">{streak}</div>
                    <div className="habit-streak-lbl">day streak</div>
                  </div>

                  <div className="habit-goal">
                    <div className={`habit-goal-delta ${goalCls}`}>
                      {hits}/{h.target} {delta !== 0 && `(${deltaStr})`}
                    </div>
                    <div className="habit-goal-target">last {h.period}d</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="habit-footer">
            <div className="habit-legend">
              <span className="habit-legend-item">
                <span className="habit-legend-sw" style={{ background: C.accent }} />
                hit
              </span>
              <span className="habit-legend-item">
                <span className="habit-legend-sw habit-legend-miss" />
                miss
              </span>
              <span className="habit-legend-item">
                <span className="habit-legend-sw habit-legend-today" />
                today
              </span>
            </div>
            <span className="habit-footer-hint">tap any cell to backfill</span>
          </div>

          {/* Backfill popover */}
          {pop && (
            <>
              <div className="habit-pop-overlay" onClick={() => setPop(null)} />
              <div className="habit-pop" style={{ left: pop.x, top: pop.y }}>
                <div className="habit-pop-title">{HABITS.find((h) => h.key === pop.habit)?.label}</div>
                <div className="habit-pop-sub">{pop.dateISO}</div>
                <div className="habit-pop-row">
                  <button className="habit-pop-btn habit-pop-yes" onClick={() => answer("yes")}>
                    Yes
                  </button>
                  <button className="habit-pop-btn habit-pop-no" onClick={() => answer("no")}>
                    No
                  </button>
                  <button
                    className="habit-pop-btn habit-pop-clear"
                    onClick={() => answer("clear")}
                    title="Clear answer"
                  >
                    ×
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Big confirm modal still used if you tap the ring */}
      {confirmOpen && (
        <HabitConfirm
          label={HABITS.find((h) => h.key === confirmOpen).label}
          status={statusFor(confirmOpen, yesISO, habitLog, habitNoLog)}
          onAnswer={(a) => {
            onConfirm(confirmOpen, yesISO, a);
            setConfirmOpen(null);
          }}
          onClose={() => setConfirmOpen(null)}
        />
      )}
    </SectionShell>
  );
}
