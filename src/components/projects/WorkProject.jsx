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

// Single business tile. Compact horizontal card. Read-only display; tap to
// expand. Editable name/meta lives in the expansion below — keeps the
// tile click-target clean so the expansion always switches.
function BusinessTile({ business, isExpanded, onClick }) {
  const bgRest = tint(business.color, 0.06);
  const bgOpen = tint(business.color, 0.12);
  const borderRest = tint(business.color, 0.25);
  const borderOpen = tint(business.color, 0.6);
  return (
    <button
      onClick={onClick}
      style={{
        background: isExpanded ? bgOpen : bgRest,
        border: `0.5px solid ${isExpanded ? borderOpen : borderRest}`,
        borderLeft: `2px solid ${business.color}`,
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minHeight: 56,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {business.name}
      </div>
      <div
        style={{
          fontSize: 11,
          color: C.textTertiary,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {business.meta}
      </div>
    </button>
  );
}

// Pad topThree to exactly 3 slots — mirror of helper in TopThree.jsx so we
// don't import across boundary.
function ensureTopThreeLength(list) {
  const out = [...(list || [])];
  while (out.length < 3) {
    out.push({ id: out.length + 1, title: "", projectKey: null, done: false });
  }
  return out.slice(0, 3);
}

function TodoList({ business, setState }) {
  const handlers = makeTodoHandlers(setState, business.id);
  const todos = business.todos || [];
  // Patch business meta (name/value/meta) directly from the expansion so
  // the tile stays a clean click-target.
  const updateBusiness = (patch) =>
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

  // Star toggle on a Work todo. Turning ON the star pushes the task into
  // the next empty Top 3 slot (no-op if all 3 are full); turning it OFF
  // removes any matching Top 3 row. The business name is stored on the
  // topThree item so the chip on the dashboard can read "Sears Melvin"
  // (specific work project) instead of just "Work".
  const toggleStar = (todo) => {
    const willBeStarred = !todo.starred;
    setState((s) => {
      let topThree = ensureTopThreeLength(s.topThree);
      if (willBeStarred && (todo.title || "").trim()) {
        const empty = topThree.findIndex((it) => !(it.title || "").trim());
        if (empty !== -1) {
          topThree = topThree.map((it, i) =>
            i === empty
              ? {
                  ...it,
                  title: todo.title,
                  projectKey: "work",
                  business: business.name,
                  done: false,
                }
              : it
          );
        }
      } else if (!willBeStarred) {
        topThree = topThree.map((it) =>
          it.projectKey === "work" && it.title === todo.title
            ? { ...it, title: "", projectKey: null, business: null, done: false }
            : it
        );
      }
      return {
        ...s,
        topThree,
        projects: {
          ...s.projects,
          work: {
            ...s.projects.work,
            businesses: s.projects.work.businesses.map((b) =>
              b.id === business.id
                ? {
                    ...b,
                    todos: (b.todos || []).map((t) =>
                      t.id === todo.id ? { ...t, starred: willBeStarred } : t
                    ),
                  }
                : b
            ),
          },
        },
      };
    });
  };
  return (
    <div
      key={business.id}
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
          fontSize: 10,
          fontWeight: 500,
          color: C.textTertiary,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {business.name} · edit
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: C.text, flex: 1 }}>
          <EditableText
            value={business.name}
            onChange={(v) => updateBusiness({ name: v })}
            style={{ fontSize: 14, fontWeight: 500 }}
          />
        </span>
      </div>
      <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 10 }}>
        <EditableText
          value={business.meta}
          onChange={(v) => updateBusiness({ meta: v })}
          placeholder="meta"
          style={{ fontSize: 11 }}
        />
      </div>

      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: C.textTertiary,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: 6,
          paddingTop: 6,
          borderTop: `0.5px solid ${C.border}`,
        }}
      >
        Tasks
      </div>

      {todos.length === 0 && (
        <div style={{ fontSize: 11, color: C.textTertiary, padding: "4px 0" }}>
          No tasks yet. Tap + Add to start.
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
          <button
            onClick={() => toggleStar(t)}
            title={t.starred ? "Unstar (removes from Top 3)" : "Star — add to Top 3"}
            aria-label={t.starred ? "Unstar" : "Star"}
            style={{
              background: "transparent",
              border: "none",
              padding: 2,
              lineHeight: 0,
              cursor: "pointer",
              color: t.starred ? business.color : C.textTertiary,
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill={t.starred ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <path
                d="M8 1.5l1.9 4.1 4.5.5-3.4 3.1.9 4.4L8 11.5 4.1 13.6l.9-4.4L1.6 6.1l4.5-.5L8 1.5z"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div
            onClick={() => handlers.onUpdate(t.id, { done: !t.done })}
            style={{
              width: 20,
              height: 20,
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
              <svg width="11" height="9" viewBox="0 0 10 8">
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
          <IconBtn onClick={() => handlers.onRemove(t.id)} danger label="Remove">
            ×
          </IconBtn>
        </div>
      ))}

      <button
        onClick={handlers.onAdd}
        style={{ ...styles.addBtn, marginTop: 6, fontSize: 11, padding: "5px 10px" }}
      >
        + Add task
      </button>
    </div>
  );
}

export default function WorkProject({ state, setState, meta, onClose, goalHandlers, hideHeader }) {
  const data = state.projects.work;
  // No business expanded by default — show only the row of subcards. Tap
  // a tile to open its task list inline beneath.
  const [expandedId, setExpandedId] = useState(null);
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
      hideHeader={hideHeader}
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
