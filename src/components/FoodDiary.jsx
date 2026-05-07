import React, { useState, useEffect } from "react";
import { C, styles } from "../lib/tokens";
import { EditableText, IconBtn, EditModeToggle } from "./Editable.jsx";

// "HH:MM" for the local clock right now — used for the "stopped now" stamp
// and for defaulting the time on a new food row.
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Minutes between two "HH:MM" strings; b - a, treating b<a as "a was yesterday"
// so the duration since fast-end stays positive past midnight.
function minutesBetween(a, b) {
  if (!a || !b) return null;
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  let diff = bh * 60 + bm - (ah * 60 + am);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function formatDuration(mins) {
  if (mins == null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function FastSection({ fastEndTime, onSet }) {
  // Re-render once a minute so the "ago" label stays current without needing
  // a manual refresh. Cheap — single setInterval.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const ago = fastEndTime ? formatDuration(minutesBetween(fastEndTime, nowHHMM())) : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 0",
        borderBottom: `0.5px solid ${C.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: C.textTertiary }}>Fast ended</span>
        {fastEndTime ? (
          <>
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <EditableText
                value={fastEndTime}
                onChange={(v) => onSet(v)}
                placeholder="HH:MM"
                style={{ fontSize: 16, fontWeight: 500 }}
              />
            </span>
            {ago && (
              <span style={{ fontSize: 11, color: C.textTertiary }}>· {ago} ago</span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 13, color: C.textTertiary, fontStyle: "italic" }}>
            still fasting
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => onSet(nowHHMM())}
          style={{
            background: C.accent,
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "5px 10px",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {fastEndTime ? "Update to now" : "Broke fast now"}
        </button>
        {fastEndTime && (
          <IconBtn onClick={() => onSet(null)} label="Clear fast end time">
            ×
          </IconBtn>
        )}
      </div>
    </div>
  );
}

const numCellStyle = {
  width: 44,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  fontSize: 13,
};

function FoodRow({ item, editing, onUpdate, onRemove }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: `0.5px solid ${C.border}`,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: C.textTertiary,
          minWidth: 44,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <EditableText
          value={item.time}
          onChange={(v) => onUpdate(item.id, "time", v)}
          style={{ fontSize: 11 }}
        />
      </span>
      <span style={{ fontSize: 14, color: C.text, flex: 1, minWidth: 0 }}>
        <EditableText
          value={item.what}
          onChange={(v) => onUpdate(item.id, "what", v)}
          placeholder="what did you eat?"
          style={{ fontSize: 14 }}
        />
      </span>
      <span style={{ ...numCellStyle, color: C.text }}>
        <EditableText
          value={String(item.kcal)}
          onChange={(v) => onUpdate(item.id, "kcal", parseFloat(v) || 0)}
          style={{ ...numCellStyle, color: C.text }}
          type="number"
        />
      </span>
      <span style={{ ...numCellStyle, color: C.textSecondary, width: 32 }}>
        <EditableText
          value={String(item.p)}
          onChange={(v) => onUpdate(item.id, "p", parseFloat(v) || 0)}
          style={{ ...numCellStyle, width: 32, color: C.textSecondary }}
          type="number"
        />
      </span>
      <span style={{ ...numCellStyle, color: C.textSecondary, width: 32 }}>
        <EditableText
          value={String(item.c)}
          onChange={(v) => onUpdate(item.id, "c", parseFloat(v) || 0)}
          style={{ ...numCellStyle, width: 32, color: C.textSecondary }}
          type="number"
        />
      </span>
      <span style={{ ...numCellStyle, color: C.textSecondary, width: 32 }}>
        <EditableText
          value={String(item.f)}
          onChange={(v) => onUpdate(item.id, "f", parseFloat(v) || 0)}
          style={{ ...numCellStyle, width: 32, color: C.textSecondary }}
          type="number"
        />
      </span>
      {editing && (
        <IconBtn onClick={() => onRemove(item.id)} danger label="Remove">
          ×
        </IconBtn>
      )}
    </div>
  );
}

export default function FoodDiary({ data, onSetFastEnd, onAddFood, onUpdateFood, onRemoveFood }) {
  const [editing, setEditing] = useState(false);
  const foods = data.foods || [];
  const totals = foods.reduce(
    (acc, f) => ({
      kcal: acc.kcal + (parseFloat(f.kcal) || 0),
      p: acc.p + (parseFloat(f.p) || 0),
      c: acc.c + (parseFloat(f.c) || 0),
      f: acc.f + (parseFloat(f.f) || 0),
    }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        <span>
          Food diary <span style={styles.sectionSub}>fasting + macros</span>
        </span>
        <EditModeToggle editing={editing} onToggle={() => setEditing(!editing)} />
      </div>

      <FastSection fastEndTime={data.fastEndTime} onSet={onSetFastEnd} />

      {/* Header for food rows — only shown once there is something to total */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 0 6px 0",
          fontSize: 10,
          color: C.textTertiary,
          textTransform: "lowercase",
        }}
      >
        <span style={{ minWidth: 44 }}>time</span>
        <span style={{ flex: 1 }}>food</span>
        <span style={{ ...numCellStyle, color: C.textTertiary }}>kcal</span>
        <span style={{ ...numCellStyle, width: 32, color: C.textTertiary }}>p</span>
        <span style={{ ...numCellStyle, width: 32, color: C.textTertiary }}>c</span>
        <span style={{ ...numCellStyle, width: 32, color: C.textTertiary }}>f</span>
        {editing && <span style={{ width: 28 }} />}
      </div>

      {foods.length === 0 ? (
        <div
          style={{
            fontSize: 12,
            color: C.textTertiary,
            fontStyle: "italic",
            padding: "10px 0",
          }}
        >
          nothing logged yet today.
        </div>
      ) : (
        foods.map((f) => (
          <FoodRow
            key={f.id}
            item={f}
            editing={editing}
            onUpdate={onUpdateFood}
            onRemove={onRemoveFood}
          />
        ))
      )}

      {/* Totals row */}
      {foods.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 0 4px 0",
            fontSize: 12,
            color: C.text,
            fontWeight: 500,
          }}
        >
          <span style={{ minWidth: 44, color: C.textTertiary, fontWeight: 400 }}>total</span>
          <span style={{ flex: 1 }} />
          <span style={{ ...numCellStyle, fontWeight: 500 }}>{Math.round(totals.kcal)}</span>
          <span style={{ ...numCellStyle, width: 32, fontWeight: 500 }}>
            {Math.round(totals.p)}
          </span>
          <span style={{ ...numCellStyle, width: 32, fontWeight: 500 }}>
            {Math.round(totals.c)}
          </span>
          <span style={{ ...numCellStyle, width: 32, fontWeight: 500 }}>
            {Math.round(totals.f)}
          </span>
          {editing && <span style={{ width: 28 }} />}
        </div>
      )}

      <button onClick={onAddFood} style={styles.addBtn}>
        + Log food
      </button>
    </div>
  );
}
