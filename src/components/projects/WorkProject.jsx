import React, { useState } from "react";
import { C, styles, BIZ_COLORS } from "../../lib/tokens";
import { EditableText, IconBtn } from "../Editable.jsx";
import Project from "./Project.jsx";

// Goals + priorities helpers scoped to a single business's goals array
// (state.projects.work.businesses[i].goals).
function makeBusinessGoalHandlers(setState, businessId) {
  const update = (updater) =>
    setState((s) => ({
      ...s,
      projects: {
        ...s.projects,
        work: {
          ...s.projects.work,
          businesses: s.projects.work.businesses.map((b) =>
            b.id === businessId ? { ...b, goals: updater(b.goals || []) } : b
          ),
        },
      },
    }));
  return {
    onAddGoal: () =>
      update((goals) => [
        ...goals,
        { id: `g-${Date.now().toString(36)}`, label: "New goal", target: null, priorities: [] },
      ]),
    onUpdateGoal: (gid, patch) => update((goals) => goals.map((g) => (g.id === gid ? { ...g, ...patch } : g))),
    onRemoveGoal: (gid) => update((goals) => goals.filter((g) => g.id !== gid)),
    onAddPriority: (gid) =>
      update((goals) =>
        goals.map((g) =>
          g.id !== gid
            ? g
            : {
                ...g,
                priorities: [
                  ...(g.priorities || []),
                  { id: `p-${Date.now().toString(36)}`, label: "", done: false, starred: false, starredAt: null, doneAt: null, notes: "" },
                ],
              }
        )
      ),
    onUpdatePriority: (gid, pid, patch) =>
      update((goals) =>
        goals.map((g) =>
          g.id !== gid ? g : { ...g, priorities: g.priorities.map((p) => (p.id === pid ? { ...p, ...patch } : p)) }
        )
      ),
    onRemovePriority: (gid, pid) =>
      update((goals) =>
        goals.map((g) => (g.id !== gid ? g : { ...g, priorities: g.priorities.filter((p) => p.id !== pid) }))
      ),
  };
}

function BusinessSection({ business, state, setState }) {
  const handlers = makeBusinessGoalHandlers(setState, business.id);
  const [editing, setEditing] = useState(false);
  return (
    <div
      style={{
        background: C.bgSecondary,
        borderRadius: 8,
        padding: "14px 16px",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: business.color }} />
        <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>
          <EditableText
            value={business.name}
            onChange={(v) =>
              setState((s) => ({
                ...s,
                projects: {
                  ...s.projects,
                  work: {
                    ...s.projects.work,
                    businesses: s.projects.work.businesses.map((b) => (b.id === business.id ? { ...b, name: v } : b)),
                  },
                },
              }))
            }
            style={{ fontSize: 14, fontWeight: 500 }}
          />
        </span>
        <span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
          <EditableText
            value={business.value}
            onChange={(v) =>
              setState((s) => ({
                ...s,
                projects: {
                  ...s.projects,
                  work: {
                    ...s.projects.work,
                    businesses: s.projects.work.businesses.map((b) => (b.id === business.id ? { ...b, value: v } : b)),
                  },
                },
              }))
            }
            style={{ fontSize: 14, fontWeight: 500 }}
          />
        </span>
      </div>
      <div style={{ fontSize: 11, color: C.textSecondary }}>
        <EditableText
          value={business.meta}
          onChange={(v) =>
            setState((s) => ({
              ...s,
              projects: {
                ...s.projects,
                work: {
                  ...s.projects.work,
                  businesses: s.projects.work.businesses.map((b) => (b.id === business.id ? { ...b, meta: v } : b)),
                },
              },
            }))
          }
          style={{ fontSize: 11 }}
        />
      </div>

      {/* Mini goals + priorities for this business */}
      {(business.goals?.length > 0 || editing) && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: C.textTertiary,
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Goals
          </div>
          {(business.goals || []).map((g) => (
            <MiniGoalBlock
              key={g.id}
              goal={g}
              handlers={handlers}
              editing={editing}
            />
          ))}
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            background: "transparent",
            border: `0.5px solid ${C.border}`,
            borderRadius: 4,
            padding: "3px 8px",
            fontSize: 10,
            color: C.textSecondary,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {editing ? "Done" : "Edit goals"}
        </button>
        {editing && (
          <button
            onClick={handlers.onAddGoal}
            style={{
              background: "transparent",
              border: `0.5px dashed ${C.borderStrong}`,
              borderRadius: 4,
              padding: "3px 8px",
              fontSize: 10,
              color: C.accent,
              cursor: "pointer",
              fontFamily: "inherit",
              marginLeft: 6,
            }}
          >
            + Goal
          </button>
        )}
      </div>
    </div>
  );
}

function MiniGoalBlock({ goal, handlers, editing }) {
  const total = goal.priorities?.length || 0;
  const done = goal.priorities?.filter((p) => p.done).length || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, flex: 1 }}>
          <EditableText value={goal.label} onChange={(v) => handlers.onUpdateGoal(goal.id, { label: v })} style={{ fontSize: 12 }} />
        </span>
        <span style={{ fontSize: 10, color: C.textSecondary, fontVariantNumeric: "tabular-nums" }}>
          {done}/{total}
        </span>
        {editing && (
          <IconBtn onClick={() => handlers.onRemoveGoal(goal.id)} danger label="Remove">×</IconBtn>
        )}
      </div>
      <div style={{ height: 2, background: C.bgTertiary, borderRadius: 1, overflow: "hidden", marginTop: 4 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: C.accent }} />
      </div>
      {(goal.priorities || []).map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0 4px 8px" }}>
          <input
            type="checkbox"
            checked={!!p.done}
            onChange={() =>
              handlers.onUpdatePriority(goal.id, p.id, { done: !p.done, doneAt: !p.done ? today : null })
            }
            style={{ width: 12, height: 12 }}
          />
          <button
            onClick={() =>
              handlers.onUpdatePriority(goal.id, p.id, { starred: !p.starred, starredAt: !p.starred ? today : null })
            }
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              lineHeight: 0,
              color: p.starred ? C.accent : C.textTertiary,
            }}
            title={p.starred ? "Pinned to Top 3" : "Pin to Top 3"}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill={p.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4">
              <path d="M8 1.5l1.9 4.1 4.5.5-3.4 3.1.9 4.4L8 11.5 4.1 13.6l.9-4.4L1.6 6.1l4.5-.5L8 1.5z" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={{ flex: 1, fontSize: 12, color: p.done ? C.textTertiary : C.text, textDecoration: p.done ? "line-through" : "none" }}>
            <EditableText value={p.label} onChange={(v) => handlers.onUpdatePriority(goal.id, p.id, { label: v })} placeholder="new priority" style={{ fontSize: 12 }} />
          </span>
          {editing && <IconBtn onClick={() => handlers.onRemovePriority(goal.id, p.id)} danger label="Remove">×</IconBtn>}
        </div>
      ))}
      {editing && (
        <button
          onClick={() => handlers.onAddPriority(goal.id)}
          style={{
            background: "transparent",
            border: `0.5px dashed ${C.borderStrong}`,
            borderRadius: 4,
            padding: "2px 8px",
            fontSize: 10,
            color: C.accent,
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: 2,
            marginLeft: 8,
          }}
        >
          + Priority
        </button>
      )}
    </div>
  );
}

export default function WorkProject({ state, setState, meta, onClose, goalHandlers }) {
  const data = state.projects.work;

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
        Businesses
      </div>
      {data.businesses.map((b) => (
        <BusinessSection key={b.id} business={b} state={state} setState={setState} />
      ))}
      <button onClick={onAddBusiness} style={styles.addBtn}>
        + Add business
      </button>
    </Project>
  );
}
