import React, { useState } from "react";
import { C, styles, BIZ_COLORS, tint } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import Project from "./Project.jsx";

// Per-business todo handlers — operate on state.projects.work.businesses[i].todos.
function makeTodoHandlers(setState, businessId) {
  const update = (updater) =>
    setState((s) => ({
      ...s,
      projects: {
        ...s.projects,
        work: {
          ...s.projects.work,
          businesses: s.projects.work.businesses.map((b) =>
            b.id === businessId ? { ...b, todos: updater(b.todos || []) } : b
          ),
        },
      },
    }));
  return {
    onAdd: () =>
      update((todos) => [
        ...todos,
        {
          id: (todos.reduce((m, t) => Math.max(m, t.id || 0), 0) || 0) + 1,
          title: "",
          done: false,
        },
      ]),
    onUpdate: (id, patch) => update((todos) => todos.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    onRemove: (id) => update((todos) => todos.filter((t) => t.id !== id)),
  };
}

// Single business tile. Compact horizontal card. When expanded by the parent,
// caller renders a TodoList directly underneath the row.
function BusinessTile({ business, setState, isExpanded, onClick }) {
  const update = (patch) =>
    setState((s) => ({
      ...s,
      projects: {
        ...s.projects,
        work: {
          ...s.projects.work,
          businesses: s.projects.work.businesses.map((b) =>
            b.id === business.id ? { ...b, ...patch } : b
          ),
        },
      },
    }));
  const bgRest = tint(business.color, 0.06);
  const bgOpen = tint(business.color, 0.12);
  const borderRest = tint(business.color, 0.25);
  const borderOpen = tint(business.color, 0.6);
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        background: isExpanded ? bgOpen : bgRest,
        border: `0.5px solid ${isExpanded ? borderOpen : borderRest}`,
        borderLeft: `2px solid ${business.color}`,
        borderRadius: 8,
        padding: "8px 10px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minHeight: 64,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: C.text,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <EditableText
          value={business.name}
          onChange={(v) => update({ name: v })}
          style={{ fontSize: 12, fontWeight: 500 }}
        />
      </div>
      <div
        style={{ fontSize: 13, fontWeight: 500, color: C.text, fontVariantNumeric: "tabular-nums" }}
        onClick={(e) => e.stopPropagation()}
      >
        <EditableText
          value={business.value}
          onChange={(v) => update({ value: v })}
          style={{ fontSize: 13, fontWeight: 500 }}
        />
      </div>
      <div
        style={{ fontSize: 10, color: C.textTertiary }}
        onClick={(e) => e.stopPropagation()}
      >
        <EditableText
          value={business.meta}
          onChange={(v) => update({ meta: v })}
          style={{ fontSize: 10 }}
        />
      </div>
    </div>
  );
}

function TodoList({ business, setState }) {
  const [editing, setEditing] = useState(false);
  const handlers = makeTodoHandlers(setState, business.id);
  const todos = business.todos || [];
  return (
    <div
      style={{
        background: tint(business.color, 0.04),
        border: `0.5px dashed ${tint(business.color, 0.35)}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginTop: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: C.textTertiary,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {business.name} · tasks
        </span>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            background: editing ? C.accent : "transparent",
            color: editing ? "white" : C.accent,
            border: `0.5px solid ${editing ? C.accent : C.border}`,
            borderRadius: 4,
            padding: "3px 10px",
            fontSize: 10,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {todos.length === 0 && !editing && (
        <div style={{ fontSize: 11, color: C.textTertiary, padding: "4px 0" }}>
          No tasks yet. Tap Edit to add one.
        </div>
      )}

      {todos.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 0",
          }}
        >
          <div
            onClick={() => handlers.onUpdate(t.id, { done: !t.done })}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              border: `1.5px solid ${t.done ? business.color : C.borderStrong}`,
              background: t.done ? business.color : "transparent",
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {t.done && (
              <svg width="10" height="8" viewBox="0 0 10 8">
                <path
                  d="M1 4L4 7L9 1"
                  stroke="white"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span
            style={{
              flex: 1,
              fontSize: 13,
              color: t.done ? C.textTertiary : C.text,
              textDecoration: t.done ? "line-through" : "none",
            }}
          >
            <EditableText
              value={t.title}
              onChange={(v) => handlers.onUpdate(t.id, { title: v })}
              placeholder="new task"
              style={{ fontSize: 13 }}
            />
          </span>
          {editing && (
            <IconBtn onClick={() => handlers.onRemove(t.id)} danger label="Remove">
              ×
            </IconBtn>
          )}
        </div>
      ))}

      {editing && (
        <button
          onClick={handlers.onAdd}
          style={{ ...styles.addBtn, marginTop: 6, fontSize: 11, padding: "5px 10px" }}
        >
          + Add task
        </button>
      )}
    </div>
  );
}

export default function WorkProject({ state, setState, meta, onClose, goalHandlers }) {
  const data = state.projects.work;
  // Default the expanded business to the first one (Unify Digital).
  const [expandedId, setExpandedId] = useState(
    data.businesses?.[0]?.id ?? null
  );
  const expanded = data.businesses.find((b) => b.id === expandedId) || null;

  const onAddBusiness = () =>
    setState((s) => ({
      ...s,
      projects: {
        ...s.projects,
        work: {
          ...s.projects.work,
          businesses: [
            ...s.projects.work.businesses,
            {
              id: (s.projects.work.businesses.reduce((m, b) => Math.max(m, b.id || 0), 0) || 0) + 1,
              key: `biz${Date.now().toString(36).slice(-4)}`,
              name: "New",
              color: BIZ_COLORS[s.projects.work.businesses.length % BIZ_COLORS.length],
              value: "—",
              meta: "—",
              goals: [],
              todos: [],
            },
          ],
        },
      },
    }));

  return (
    <Project
      title="Work"
      color={meta.color}
      onClose={onClose}
      goals={data.goals}
      goalHandlers={goalHandlers}
    >
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
        Businesses · tap to view tasks
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(2, data.businesses.length)}, 1fr)`,
          gap: 8,
        }}
      >
        {data.businesses.map((b) => (
          <BusinessTile
            key={b.id}
            business={b}
            setState={setState}
            isExpanded={expandedId === b.id}
            onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
          />
        ))}
      </div>

      {expanded && <TodoList business={expanded} setState={setState} />}

      <button onClick={onAddBusiness} style={{ ...styles.addBtn, marginTop: 10 }}>
        + Add business
      </button>
    </Project>
  );
}
