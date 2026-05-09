import React from "react";
import { C, styles } from "../lib/tokens";
import { allPriorities } from "../lib/defaultState";
import PriorityStar from "./PriorityStar.jsx";

// Derived view of all starred priorities across every project.
// Read-only — to add/remove priorities, edit them inside the relevant project.
// Clicking a card opens that project.
export default function TopThree({ state, onOpenProject, onTogglePriority, onUnstar }) {
  const today = new Date().toISOString().slice(0, 10);
  const starred = allPriorities(state)
    .filter(({ priority }) => priority.starred && !priority.done)
    .sort((a, b) => (b.priority.starredAt || "").localeCompare(a.priority.starredAt || ""));
  const done = allPriorities(state).filter(({ priority }) => priority.starred && priority.done).length;
  const total = starred.length + done;

  return (
    <div style={styles.card}>
      <div style={styles.sectionH}>
        Today's top 3
        <span style={styles.sectionSub}>
          {total === 0 ? "star a priority anywhere to pin it here" : `${done} of ${total} done`}
        </span>
      </div>

      {starred.length === 0 && done === 0 && (
        <div style={{ fontSize: 12, color: C.textTertiary, padding: "12px 0" }}>
          Open any project, star a priority, and it shows up here.
        </div>
      )}

      {starred.map(({ projectKey, goalLabel, priority }, i) => (
        <div
          key={priority.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 0",
            borderBottom: i < starred.length - 1 ? `0.5px solid ${C.border}` : "none",
          }}
        >
          <div
            onClick={() => onTogglePriority(projectKey, priority.id, today)}
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: `1.5px solid ${priority.done ? C.accent : C.borderStrong}`,
              background: priority.done ? C.accent : "transparent",
              flexShrink: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {priority.done && (
              <svg width="9" height="7" viewBox="0 0 9 7">
                <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span
            style={{ flex: 1, cursor: "pointer", fontSize: 14, color: priority.done ? C.textTertiary : C.text }}
            onClick={() => onOpenProject(projectKey.split(":")[0])}
          >
            <div style={{ textDecoration: priority.done ? "line-through" : "none" }}>{priority.label}</div>
            <div style={{ fontSize: 10, color: C.textTertiary, marginTop: 2 }}>
              {projectKey.replace(":", " · ")} · {goalLabel}
            </div>
          </span>
          <PriorityStar starred={true} onToggle={() => onUnstar(projectKey, priority.id)} />
        </div>
      ))}
    </div>
  );
}
