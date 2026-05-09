import React from "react";
import { C } from "../../lib/tokens";
import Project from "./Project.jsx";

export default function CharityProject({ state, meta, onClose, goalHandlers, hideHeader }) {
  const data = state.projects.charity;
  return (
    <Project title="Charity" color={meta.color} onClose={onClose} goals={data.goals} goalHandlers={goalHandlers} hideHeader={hideHeader}>
      <div style={{ fontSize: 12, color: C.textTertiary, padding: "8px 0" }}>
        Donation tracking, causes, and giving plans land here. For now, set goals + priorities above.
      </div>
    </Project>
  );
}
