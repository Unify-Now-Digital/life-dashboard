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

// Single combined chip: select dropdown styled to look like a colored pill.
// When the row is associated to a Work business, render the business name
// (e.g. "Sears Melvin") instead of "Work" so the specific work project is
// tagged before the task. Any non-Work project falls back to its label.
function ProjectChip({ projectKey, business, onChange, onOpen }) {
  const meta = projectKey ? PROJECT_META.find((m) => m.key === projectKey) : null;
  const color = meta?.color || C.textTertiary;
  const label = business || meta?.label || "— project —";
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 999,
        background: meta ? tint(color, 0.12) : C.bgSecondary,
        border: `0.5px solid ${meta ? tint(color, 0.45) : C.border}`,
        flexShrink: 0,
        cursor: "pointer",
        maxWidth: 140,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: meta ? color : C.textTertiary,
          flexShrink: 0,
        }}
      />
      <span
        onClick={(e) => {
          // Tapping the label (not the dropdown) opens the project page.
          if (meta && onOpen) {
            e.stopPropagation();
            onOpen(projectKey);
          }
        }}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: meta ? color : C.textSecondary,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
      <select
        value={projectKey || ""}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Pick project"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <option value="">— project —</option>
        {PROJECT_META.map((m) => (
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
    update(idx, { title: "", projectKey: null, business: null, done: false });

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

            {/* Project chip — shown BEFORE the title so the specific work
                project (or any project) is tagged in front. */}
            <ProjectChip
              projectKey={slot.projectKey}
              business={slot.business}
              onChange={(k) =>
                update(i, { projectKey: k, business: k === slot.projectKey ? slot.business : null })
              }
              onOpen={onOpenProject}
            />

            {/* Title — directly editable */}
            <span
              style={{
                flex: 1,
                fontSize: 14,
                color: slot.done ? C.textTertiary : C.text,
                textDecoration: slot.done ? "line-through" : "none",
                minWidth: 0,
              }}
            >
              <EditableText
                value={slot.title}
                onChange={(v) => update(i, { title: v })}
                placeholder="Tap to type a priority…"
                style={{ fontSize: 14 }}
              />
            </span>

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
