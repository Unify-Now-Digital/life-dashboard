import React from "react";
import { C, styles, tint } from "../lib/tokens";
import { EditableText } from "./Editable.jsx";
import { PROJECT_META } from "./Projects.jsx";

// Pad the topThree array to exactly 3 entries.
function ensureLength3(list) {
  const out = [...(list || [])];
  while (out.length < 3) {
    out.push({ id: out.length + 1, title: "", projectKey: null, done: false });
  }
  return out.slice(0, 3);
}

function StarIcon({ filled, color, size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.4"
      style={{ color: filled ? color : C.textTertiary, flexShrink: 0 }}
      aria-hidden="true"
    >
      <path
        d="M8 1.5l1.9 4.1 4.5.5-3.4 3.1.9 4.4L8 11.5 4.1 13.6l.9-4.4L1.6 6.1l4.5-.5L8 1.5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProjectChip({ projectKey, onChange, onOpen }) {
  const meta = projectKey ? PROJECT_META.find((m) => m.key === projectKey) : null;
  const color = meta?.color || C.textTertiary;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        borderRadius: 999,
        background: meta ? tint(color, 0.12) : C.bgSecondary,
        border: `0.5px solid ${meta ? tint(color, 0.45) : C.border}`,
        flexShrink: 0,
      }}
    >
      {meta && (
        <button
          onClick={() => onOpen && onOpen(projectKey)}
          title={`Open ${meta.label}`}
          aria-label={`Open ${meta.label}`}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            margin: 0,
            color,
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: color,
            }}
          />
          {meta.label}
        </button>
      )}
      <select
        value={projectKey || ""}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Pick project"
        style={{
          background: "transparent",
          border: "none",
          fontSize: 10,
          color: meta ? color : C.textSecondary,
          fontFamily: "inherit",
          padding: meta ? "0 0 0 2px" : "1px 2px",
          cursor: "pointer",
          outline: "none",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
        }}
      >
        {!meta && <option value="">— project —</option>}
        {meta && <option value={meta.key}>{meta.label}</option>}
        {PROJECT_META.filter((m) => m.key !== projectKey).map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>
    </span>
  );
}

export default function TopThree({ state, setState, onOpenProject }) {
  const slots = ensureLength3(state.topThree);

  const update = (idx, patch) =>
    setState((s) => ({
      ...s,
      topThree: ensureLength3(s.topThree).map((it, i) =>
        i === idx ? { ...it, ...patch } : it
      ),
    }));

  const clear = (idx) =>
    update(idx, { title: "", projectKey: null, done: false });

  const filledCount = slots.filter((s) => (s.title || "").trim()).length;

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        Today's top 3
        <span style={styles.sectionSub}>
          {filledCount === 0
            ? "tap to type a priority, or star a Work task"
            : `${slots.filter((s) => s.done).length} of ${filledCount} done`}
        </span>
      </div>

      {slots.map((slot, i) => {
        const filled = (slot.title || "").trim().length > 0;
        const meta = slot.projectKey ? PROJECT_META.find((m) => m.key === slot.projectKey) : null;
        const starColor = meta?.color || C.accent;
        return (
          <div
            key={slot.id ?? i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: i < 2 ? `0.5px solid ${C.border}` : "none",
              opacity: filled ? 1 : 0.7,
            }}
          >
            {/* Done checkbox */}
            <div
              onClick={() => filled && update(i, { done: !slot.done })}
              role={filled ? "button" : undefined}
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: `1.5px ${filled ? "solid" : "dashed"} ${
                  slot.done ? C.accent : C.borderStrong
                }`,
                background: slot.done ? C.accent : "transparent",
                flexShrink: 0,
                cursor: filled ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {slot.done && (
                <svg width="9" height="7" viewBox="0 0 9 7">
                  <path
                    d="M1 3.5L3.5 6L8 1"
                    stroke="white"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* Importance star — always shown */}
            <StarIcon filled={filled} color={starColor} size={15} />

            {/* Title — directly editable */}
            <span
              style={{
                flex: 1,
                fontSize: 14,
                color: slot.done ? C.textTertiary : C.text,
                textDecoration: slot.done ? "line-through" : "none",
              }}
            >
              <EditableText
                value={slot.title}
                onChange={(v) => update(i, { title: v })}
                placeholder="Tap to type a priority…"
                style={{ fontSize: 14 }}
              />
            </span>

            {/* Project association */}
            <ProjectChip
              projectKey={slot.projectKey}
              onChange={(k) => update(i, { projectKey: k })}
              onOpen={onOpenProject}
            />

            {/* Clear */}
            {filled && (
              <button
                onClick={() => clear(i)}
                title="Clear"
                aria-label="Clear priority"
                style={{
                  background: "transparent",
                  border: `0.5px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 14,
                  lineHeight: 1,
                  color: C.danger,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
