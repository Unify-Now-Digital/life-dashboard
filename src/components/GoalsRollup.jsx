import React, { useState } from "react";
import { C } from "../lib/tokens";
import SectionShell, { SystemIcon } from "./SectionShell.jsx";

// Read-only roll-up of every goal across every project. Derived from the
// project structure — to change a goal, open the project page.
function gatherGoals(state) {
  const out = [];
  const projects = state.projects || {};
  for (const [pk, p] of Object.entries(projects)) {
    for (const g of p.goals || []) out.push({ projectKey: pk, goal: g });
    if (pk === "work") {
      for (const b of p.businesses || []) {
        for (const g of b.goals || []) out.push({ projectKey: `work:${b.key}`, goal: g });
      }
    }
  }
  return out;
}

export default function GoalsRollup({ state, onOpenProject }) {
  const [open, setOpen] = useState(true);
  const all = gatherGoals(state);
  const total = all.length;
  const completed = all.reduce((acc, { goal }) => {
    const done = goal.priorities?.filter((p) => p.done).length || 0;
    const denom = goal.target ?? (goal.priorities?.length || 0);
    return acc + (denom > 0 && done >= denom ? 1 : 0);
  }, 0);

  const meta =
    total === 0 ? "none yet" : `${completed}/${total} complete`;

  return (
    <SectionShell
      icon={<SystemIcon kind="objectives" color={C.accent} size={18} />}
      label="Objectives"
      color={C.accent}
      meta={meta}
      expanded={open}
      onToggle={() => setOpen(!open)}
    >
      {all.length === 0 ? (
        <div style={{ fontSize: 12, color: C.textTertiary, padding: "8px 0" }}>
          No goals yet. Open a project to add one.
        </div>
      ) : (
        all.map(({ projectKey, goal }, i) => {
          const totalP = goal.priorities?.length || 0;
          const done = goal.priorities?.filter((p) => p.done).length || 0;
          const denominator = goal.target ?? totalP;
          const pct = denominator > 0 ? Math.min(100, Math.round((done / denominator) * 100)) : 0;
          return (
            <div
              key={`${projectKey}-${goal.id}`}
              onClick={() => onOpenProject(projectKey.split(":")[0])}
              style={{
                padding: "10px 0",
                borderBottom: i < all.length - 1 ? `0.5px solid ${C.border}` : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 13 }}>{goal.label}</span>
                <span style={{ fontSize: 12, color: C.textSecondary, fontVariantNumeric: "tabular-nums" }}>
                  {done}/{denominator || 0}
                </span>
              </div>
              <div style={{ fontSize: 10, color: C.textTertiary, marginTop: 2 }}>
                {projectKey.replace(":", " · ")}
              </div>
              <div style={{ height: 3, background: C.bgTertiary, borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: C.accent }} />
              </div>
            </div>
          );
        })
      )}
    </SectionShell>
  );
}
