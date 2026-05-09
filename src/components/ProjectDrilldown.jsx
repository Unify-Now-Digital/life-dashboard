import React from "react";
import { C } from "../lib/tokens";
import HealthProject from "./projects/HealthProject.jsx";
import FinanceProject from "./projects/FinanceProject.jsx";
import TravelProject from "./projects/TravelProject.jsx";
import WorkProject from "./projects/WorkProject.jsx";
import LearningProject from "./projects/LearningProject.jsx";
import JournalProject from "./projects/JournalProject.jsx";
import RelationshipsProject from "./projects/RelationshipsProject.jsx";
import CharityProject from "./projects/CharityProject.jsx";
import { nextId } from "../lib/defaultState";
import { PROJECT_META, makeGoalHandlers } from "./Projects.jsx";

// Renders the open project's full drilldown panel. Pulled out of Projects.jsx
// so the sticky right-rail of cards stays narrow while the drilldown can take
// the full width of the main column.
//
// `embedded`: when true, skip the outer card chrome and the project's own
// title/close header — the parent (e.g. MainSection) provides those.
export default function ProjectDrilldown({ state, setState, projectKey, onClose, embedded = false }) {
  const meta = PROJECT_META.find((m) => m.key === projectKey);
  if (!meta) return null;
  const baseGoalHandlers = makeGoalHandlers(setState, ["projects", projectKey, "goals"]);
  const props = {
    state,
    setState,
    meta,
    // In embedded mode the section header IS the close target, so suppress
    // the duplicate "close" affordance inside <Project>.
    onClose: embedded ? null : onClose,
    goalHandlers: baseGoalHandlers,
    makeGoalHandlers: (path) => makeGoalHandlers(setState, path),
    nextId,
    hideHeader: embedded,
  };

  let body = null;
  switch (projectKey) {
    case "health":        body = <HealthProject {...props} />; break;
    case "finance":       body = <FinanceProject {...props} />; break;
    case "travel":        body = <TravelProject {...props} />; break;
    case "work":          body = <WorkProject {...props} />; break;
    case "learning":      body = <LearningProject {...props} />; break;
    case "journal":       body = <JournalProject {...props} />; break;
    case "relationships": body = <RelationshipsProject {...props} />; break;
    case "charity":       body = <CharityProject {...props} />; break;
    default:              body = null;
  }

  if (embedded) return body;
  return (
    <div
      style={{
        background: C.bg,
        border: `0.5px solid ${C.border}`,
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      {body}
    </div>
  );
}
