import React, { useState } from "react";
import { C, CHIP_STYLES } from "../lib/tokens";
import SectionShell, { SystemIcon } from "./SectionShell.jsx";
import "./Calendar.css";

// Calendar — three views (list / week / quarter) over a single event source.
// Inline styles use design tokens; pseudo-elements + grab cursor live in
// Calendar.css.
//
// Event sources:
//   - state.projects.travel.trips           → ISO start date, kind="trip"
//   - state.projects.journal.weekly[].date  → kind="prompt"
//   - state.upcoming                        → free-text date string, list-only

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};
const sameYMD = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Convert "2026-W19" → ISO date for that week's Monday.
function isoFromWeekISO(weekISO) {
  if (!weekISO || typeof weekISO !== "string") return null;
  const m = weekISO.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (week - 1) * 7);
  return isoDate(monday);
}

// Returns the ISO Monday for the week containing `d`.
function mondayOf(d) {
  const day = d.getDay() || 7;
  const m = new Date(d);
  m.setDate(d.getDate() - (day - 1));
  m.setHours(0, 0, 0, 0);
  return m;
}

function weekLabel(monday) {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const a = `${SHORT_MONTH[monday.getMonth()]} ${monday.getDate()}`;
  const b = sameMonth ? `${sunday.getDate()}` : `${SHORT_MONTH[sunday.getMonth()]} ${sunday.getDate()}`;
  return `Week of ${a}–${b}`;
}

// Pull every dated thing into a flat list. ISO date events first; free-text
// upcoming items returned separately so the list view can show them inline.
function collectEvents(state) {
  const dated = [];
  for (const t of state.projects?.travel?.trips || []) {
    if (!t.start) continue;
    dated.push({
      isoDate: t.start,
      kind: "trip",
      label: t.name,
      projectKey: "travel",
      end: t.end || null,
    });
  }
  for (const w of state.projects?.journal?.weekly || []) {
    const date = isoFromWeekISO(w.weekISO);
    if (!date) continue;
    dated.push({
      isoDate: date,
      kind: "prompt",
      label: "Weekly review",
      projectKey: "journal",
    });
  }
  const free = (state.upcoming || []).map((u) => ({
    date: u.date,
    label: u.text,
    kind: "personal",
    projectKey: null,
    cat: u.cat,
  }));
  return { dated, free };
}

// ---- Tabs ------------------------------------------------------------------

function Tabs({ tab, setTab }) {
  const items = [
    { id: "fortnight", label: "2 weeks" },
    { id: "list", label: "List" },
    { id: "quarter", label: "Quarter" },
  ];
  return (
    <div className="cal-tabs">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`cal-tab${tab === t.id ? " cal-tab-active" : ""}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---- List view -------------------------------------------------------------

function ListView({ dated, free, onOpenProject }) {
  const today = startOfToday();
  // Group dated events by Monday-of-week. Then append free-text items as a
  // single trailing "Other" group so they're not lost.
  const groups = new Map(); // Map<isoMonday, { label, items: [] }>
  const futureDated = dated
    .filter((e) => new Date(e.isoDate + "T00:00:00") >= today)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  for (const e of futureDated) {
    const d = new Date(e.isoDate + "T00:00:00");
    const monday = mondayOf(d);
    const key = isoDate(monday);
    if (!groups.has(key)) groups.set(key, { label: weekLabel(monday), items: [] });
    groups.get(key).items.push(e);
  }

  return (
    <div className="cal-list-card">
      <div className="cal-list-scroll">
        {[...groups.entries()].map(([key, g]) => (
          <React.Fragment key={key}>
            <div className="cal-week-h">{g.label}</div>
            {g.items.map((e, i) => {
              const d = new Date(e.isoDate + "T00:00:00");
              const dateLabel = sameYMD(d, today)
                ? "Today"
                : sameYMD(d, addDays(today, 1))
                ? "Tomorrow"
                : `${DOW[d.getDay()]} ${SHORT_MONTH[d.getMonth()]} ${d.getDate()}`;
              const chip = CHIP_STYLES[e.kind] || { bg: C.bgSecondary, color: C.textSecondary };
              return (
                <div
                  key={`${key}-${i}`}
                  className="cal-row"
                  onClick={e.projectKey ? () => onOpenProject(e.projectKey) : undefined}
                  style={{ cursor: e.projectKey ? "pointer" : "default" }}
                >
                  <span className="cal-date-col">{dateLabel}</span>
                  <span className="cal-title-col">{e.label}</span>
                  <span className="cal-dot" style={{ background: chip.color }} />
                  <span className="cal-pill" style={{ background: chip.bg, color: chip.color }}>
                    {e.kind}
                  </span>
                </div>
              );
            })}
          </React.Fragment>
        ))}

        {free.length > 0 && (
          <>
            <div className="cal-week-h">Other</div>
            {free.map((e, i) => {
              const chip = CHIP_STYLES.personal;
              return (
                <div key={`f-${i}`} className="cal-row">
                  <span className="cal-date-col">{e.date}</span>
                  <span className="cal-title-col">{e.label}</span>
                  <span className="cal-dot" style={{ background: chip.color }} />
                  <span className="cal-pill" style={{ background: chip.bg, color: chip.color }}>
                    {e.cat || "personal"}
                  </span>
                </div>
              );
            })}
          </>
        )}

        {groups.size === 0 && free.length === 0 && (
          <div style={{ fontSize: 12, color: C.textTertiary, padding: "8px 0" }}>
            Nothing on the calendar yet.
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Fortnight view (14 days × per-day event chips, 7-col × 2-row grid) ---

function FortnightView({ dated, onOpenProject }) {
  const today = startOfToday();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  // Helper: events that touch a given day (handles multi-day trip spans).
  const eventsOn = (day) =>
    dated.filter((e) => {
      const start = new Date(e.isoDate + "T00:00:00");
      const end = e.end ? new Date(e.end + "T00:00:00") : start;
      return start <= day && day <= end;
    });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
      {days.map((d) => {
        const events = eventsOn(d);
        const isToday = sameYMD(d, today);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        return (
          <div
            key={isoDate(d)}
            style={{
              background: isToday ? C.accentLight : isWeekend ? C.bgSecondary : C.bg,
              border: `0.5px solid ${isToday ? C.accent : C.border}`,
              borderRadius: 6,
              padding: "6px 5px 7px",
              minHeight: 80,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                lineHeight: 1,
              }}
            >
              <span style={{ fontSize: 9, color: C.textTertiary, letterSpacing: "0.04em", fontWeight: 500 }}>
                {DOW[d.getDay()].toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: isToday ? C.accent : C.text,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {d.getDate()}
              </span>
            </div>
            {events.length === 0 ? (
              <div style={{ fontSize: 9, color: C.textTertiary, fontStyle: "italic", marginTop: 2 }}>
                —
              </div>
            ) : (
              events.map((e, i) => {
                const chip = CHIP_STYLES[e.kind] || { bg: C.bgSecondary, color: C.textSecondary };
                // Mark trip days that aren't the start with a small "·" prefix
                const start = new Date(e.isoDate + "T00:00:00");
                const isStart = sameYMD(start, d);
                const labelPrefix = e.kind === "trip" ? (isStart ? "✈ " : "· ") : "";
                return (
                  <button
                    key={i}
                    onClick={e.projectKey ? () => onOpenProject(e.projectKey) : undefined}
                    title={e.label}
                    style={{
                      background: chip.bg,
                      color: chip.color,
                      border: "none",
                      borderRadius: 3,
                      padding: "3px 5px",
                      fontSize: 10,
                      fontWeight: 500,
                      fontFamily: "inherit",
                      cursor: e.projectKey ? "pointer" : "default",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {labelPrefix}
                    {e.label}
                  </button>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Quarter view (12-week horizontal Gantt with swim-lanes) --------------

function QuarterView({ dated, onOpenProject }) {
  const today = startOfToday();
  const WEEKS = 12;
  const DAY_W = 16;
  const LANE_LABEL_W = 64;
  const totalDays = WEEKS * 7;
  const totalW = totalDays * DAY_W + LANE_LABEL_W;

  // Lane assignment by kind. Order matters — first lane renders on top.
  const lanes = [
    { id: "trip", label: "Travel" },
    { id: "prompt", label: "Journal" },
    { id: "personal", label: "Personal" },
    { id: "deadline", label: "Deadlines" },
  ];
  const eventsByLane = new Map(lanes.map((l) => [l.id, []]));
  for (const e of dated) {
    const start = new Date(e.isoDate + "T00:00:00");
    const offset = Math.floor((start - today) / 86400000);
    if (offset < 0 || offset >= totalDays) continue;
    const end = e.end ? new Date(e.end + "T00:00:00") : null;
    const span = end ? Math.max(1, Math.ceil((end - start) / 86400000) + 1) : 1;
    if (!eventsByLane.has(e.kind)) continue;
    eventsByLane.get(e.kind).push({ ...e, offset, span });
  }

  // Month boundaries — show month names along the top so the eye can locate
  // events without counting weeks.
  const months = [];
  let cursor = today;
  for (let i = 0; i < totalDays; i++) {
    if (i === 0 || cursor.getDate() === 1) {
      months.push({
        x: i * DAY_W + LANE_LABEL_W,
        label: cursor.toLocaleString("en-GB", { month: "short", year: "2-digit" }),
      });
    }
    cursor = addDays(cursor, 1);
  }
  // Week ticks (every 7 days), light vertical lines.
  const weekTicks = Array.from({ length: WEEKS }, (_, i) => {
    const d = addDays(today, i * 7);
    return { x: i * 7 * DAY_W + LANE_LABEL_W, dateLabel: `${SHORT_MONTH[d.getMonth()]} ${d.getDate()}` };
  });

  const totalEvents = lanes.reduce((acc, l) => acc + eventsByLane.get(l.id).length, 0);

  return (
    <>
      <div
        style={{
          fontSize: 10,
          color: C.textTertiary,
          marginBottom: 4,
          padding: "0 2px",
        }}
      >
        Next 12 weeks · {totalEvents} {totalEvents === 1 ? "event" : "events"} across {lanes.length} lanes
      </div>
      <div className="cal-scroll-x" style={{ paddingBottom: 8 }}>
        <div style={{ width: totalW, position: "relative" }}>
          {/* Month labels */}
          <div style={{ position: "relative", height: 14, marginBottom: 2 }}>
            {months.map((m, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: m.x,
                  fontSize: 10,
                  color: C.textSecondary,
                  fontWeight: 500,
                  borderLeft: `0.5px solid ${C.borderStrong}`,
                  paddingLeft: 4,
                  lineHeight: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Week ticks */}
          <div style={{ position: "relative", height: 14, marginBottom: 4 }}>
            {weekTicks.map((t, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: t.x,
                  fontSize: 9,
                  color: C.textTertiary,
                  fontVariantNumeric: "tabular-nums",
                  borderLeft: `0.5px solid ${C.border}`,
                  paddingLeft: 3,
                  lineHeight: "12px",
                }}
              >
                {t.dateLabel}
              </div>
            ))}
          </div>

          {/* Lanes */}
          {lanes.map((l) => (
            <div
              key={l.id}
              style={{
                position: "relative",
                height: 28,
                borderTop: `0.5px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  position: "sticky",
                  left: 0,
                  width: LANE_LABEL_W,
                  fontSize: 10,
                  color: C.textTertiary,
                  background: C.bg,
                  paddingLeft: 2,
                  zIndex: 1,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {l.label}
              </span>
              {eventsByLane.get(l.id).map((e, i) => {
                const chip = CHIP_STYLES[e.kind] || { bg: C.bgSecondary, color: C.textSecondary };
                const dayLabel =
                  e.offset === 0
                    ? "today"
                    : e.offset === 1
                    ? "tomorrow"
                    : `in ${e.offset}d`;
                const richLabel = e.span > 1 ? `${e.label} · ${e.span}d` : `${e.label} · ${dayLabel}`;
                return (
                  <div
                    key={i}
                    onClick={e.projectKey ? () => onOpenProject(e.projectKey) : undefined}
                    title={`${e.label} (${e.isoDate}${e.end ? ` → ${e.end}` : ""})`}
                    style={{
                      position: "absolute",
                      left: e.offset * DAY_W + LANE_LABEL_W,
                      width: Math.max(60, e.span * DAY_W - 2),
                      height: 20,
                      background: chip.bg,
                      border: `0.5px solid ${chip.color}`,
                      borderRadius: 4,
                      fontSize: 10,
                      color: chip.color,
                      fontWeight: 500,
                      padding: "0 6px",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      cursor: e.projectKey ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {richLabel}
                  </div>
                );
              })}
              {eventsByLane.get(l.id).length === 0 && (
                <span
                  style={{
                    position: "absolute",
                    left: LANE_LABEL_W + 4,
                    fontSize: 9,
                    color: C.textTertiary,
                    fontStyle: "italic",
                  }}
                >
                  nothing scheduled
                </span>
              )}
            </div>
          ))}

          {/* Today marker */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: LANE_LABEL_W,
              bottom: 0,
              width: 2,
              background: C.accent,
              opacity: 0.7,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 14,
              left: LANE_LABEL_W - 14,
              fontSize: 9,
              color: C.accent,
              fontWeight: 500,
              pointerEvents: "none",
            }}
          >
            today
          </div>
        </div>
      </div>
    </>
  );
}

// ---- Calendar shell --------------------------------------------------------

export default function Calendar({ state, onOpenProject }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState("fortnight");
  const { dated, free } = collectEvents(state);
  const total = dated.length + free.length;

  return (
    <SectionShell
      icon={<SystemIcon kind="calendar" color={C.accent} size={18} />}
      label="Calendar"
      color={C.accent}
      meta={`${total} upcoming`}
      expanded={open}
      onToggle={() => setOpen(!open)}
    >
      <div style={{ marginBottom: 8 }}>
        <Tabs tab={tab} setTab={setTab} />
      </div>
      {tab === "fortnight" && (
        <FortnightView dated={dated} onOpenProject={onOpenProject} />
      )}
      {tab === "list" && (
        <ListView dated={dated} free={free} onOpenProject={onOpenProject} />
      )}
      {tab === "quarter" && (
        <QuarterView dated={dated} onOpenProject={onOpenProject} />
      )}
    </SectionShell>
  );
}
