import React, { useState } from "react";
import { C, CHIP_STYLES, styles } from "../lib/tokens";

// Today at local midnight, returned as a Date object.
const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};
const sameYMD = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Pull every dated item we know about into a flat list of { date, kind, label, projectKey }.
function collectEvents(state) {
  const out = [];
  // Trips
  for (const t of state.projects?.travel?.trips || []) {
    if (!t.start) continue;
    out.push({
      date: t.start,
      kind: "trip",
      label: `✈ ${t.name}`,
      projectKey: "travel",
    });
  }
  // Weekly review prompts (one per recorded week)
  for (const w of state.projects?.journal?.weekly || []) {
    const date = isoFromWeekISO(w.weekISO);
    if (!date) continue;
    out.push({
      date,
      kind: "prompt",
      label: "Weekly review",
      projectKey: "journal",
    });
  }
  return out;
}

// Convert "2026-W19" → ISO date string for the Monday of that week.
function isoFromWeekISO(weekISO) {
  if (!weekISO || typeof weekISO !== "string") return null;
  const m = weekISO.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  // ISO 8601: week 1 is the week containing Jan 4.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (week - 1) * 7);
  return isoDate(monday);
}

export default function Calendar({ state, onOpenProject }) {
  const [open, setOpen] = useState(true);
  const today = startOfToday();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const events = collectEvents(state);

  // Group events by ISO date string, drop ones earlier than today.
  const byDate = new Map();
  for (const e of events) {
    const d = new Date(e.date + "T00:00:00");
    if (d < today) continue;
    const key = e.date;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(e);
  }

  // Items shown in the agenda list — events from byDate sorted asc, then any
  // entries from state.upcoming (ordered as authored, since their dates are free-text).
  const stripIsoSet = new Set(days.map(isoDate));
  const datedAgenda = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, items]) =>
      items.map((it) => ({ ...it, isoDate: date, inStrip: stripIsoSet.has(date) }))
    );
  const upcomingItems = (state.upcoming || []).map((u) => ({
    date: u.date,
    label: u.text,
    kind: u.cat?.toLowerCase() === "fitness" ? "personal" : "personal",
    projectKey: null,
    free: true,
    cat: u.cat,
  }));

  return (
    <div style={styles.card}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          ...styles.sectionH,
          margin: open ? "0 0 12px 0" : 0,
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "inherit",
          color: "inherit",
          textAlign: "left",
        }}
      >
        <span>
          Calendar <span style={styles.sectionSub}>next 2 weeks</span>
        </span>
        <span
          aria-hidden="true"
          style={{
            fontSize: 11,
            color: C.textTertiary,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            display: "inline-block",
          }}
        >
          ▾
        </span>
      </button>

      {!open ? null : <CalendarBody state={state} onOpenProject={onOpenProject} today={today} days={days} byDate={byDate} datedAgenda={datedAgenda} upcomingItems={upcomingItems} />}
    </div>
  );
}

function CalendarBody({ state, onOpenProject, today, days, byDate, datedAgenda, upcomingItems }) {
  return (
    <>
      {/* Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 4, marginBottom: 14 }}>
        {days.map((d, i) => {
          const iso = isoDate(d);
          const dayEvents = byDate.get(iso) || [];
          const isToday = sameYMD(d, today);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const primary = dayEvents[0];
          const chip = primary ? CHIP_STYLES[primary.kind] : null;
          return (
            <button
              key={iso}
              onClick={primary?.projectKey ? () => onOpenProject(primary.projectKey) : undefined}
              title={dayEvents.map((e) => e.label).join("\n") || ""}
              style={{
                background: isToday ? C.accentLight : isWeekend ? C.bgSecondary : C.bg,
                border: `0.5px solid ${isToday ? C.accent : C.border}`,
                borderRadius: 6,
                padding: "6px 0 8px",
                cursor: primary?.projectKey ? "pointer" : "default",
                fontFamily: "inherit",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                minHeight: 56,
              }}
            >
              <span style={{ fontSize: 9, color: C.textTertiary, letterSpacing: "0.04em" }}>
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
              {dayEvents.length > 0 && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: chip?.color || C.accent,
                    marginTop: 1,
                  }}
                />
              )}
              {dayEvents.length > 1 && (
                <span style={{ fontSize: 9, color: C.textTertiary, marginTop: -2 }}>
                  +{dayEvents.length - 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Agenda */}
      {datedAgenda.length === 0 && upcomingItems.length === 0 ? (
        <div style={{ fontSize: 12, color: C.textTertiary, padding: "8px 0" }}>
          Nothing on the calendar yet.
        </div>
      ) : (
        <div>
          {datedAgenda.map((item, i) => {
            const d = new Date(item.isoDate + "T00:00:00");
            const dateLabel = sameYMD(d, today)
              ? "Today"
              : sameYMD(d, addDays(today, 1))
              ? "Tomorrow"
              : `${SHORT_MONTH[d.getMonth()]} ${d.getDate()}`;
            const chip = CHIP_STYLES[item.kind] || { bg: C.bgSecondary, color: C.textSecondary };
            return (
              <div
                key={`${item.isoDate}-${i}`}
                onClick={item.projectKey ? () => onOpenProject(item.projectKey) : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: `0.5px solid ${C.border}`,
                  cursor: item.projectKey ? "pointer" : "default",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: C.textSecondary,
                    minWidth: 64,
                    fontWeight: 500,
                  }}
                >
                  {dateLabel}
                </span>
                <span style={{ fontSize: 13, flex: 1, color: C.text }}>{item.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontWeight: 500,
                    background: chip.bg,
                    color: chip.color,
                    textTransform: "capitalize",
                  }}
                >
                  {item.kind}
                </span>
              </div>
            );
          })}
          {upcomingItems.map((item, i) => {
            const chip = CHIP_STYLES.personal;
            return (
              <div
                key={`u-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom:
                    i < upcomingItems.length - 1 ? `0.5px solid ${C.border}` : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: C.textSecondary,
                    minWidth: 64,
                    fontWeight: 500,
                  }}
                >
                  {item.date}
                </span>
                <span style={{ fontSize: 13, flex: 1, color: C.text }}>{item.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontWeight: 500,
                    background: chip.bg,
                    color: chip.color,
                  }}
                >
                  {item.cat || "Personal"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
