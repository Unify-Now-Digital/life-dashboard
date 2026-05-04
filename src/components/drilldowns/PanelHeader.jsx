import React from "react";
import { C } from "../../lib/tokens";
import { EditModeToggle } from "../Editable.jsx";

export default function PanelHeader({ title, editing, onToggleEdit, onClose }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {onToggleEdit && <EditModeToggle editing={editing} onToggle={onToggleEdit} />}
        <div
          onClick={onClose}
          style={{ fontSize: 12, color: C.textTertiary, cursor: "pointer", padding: "4px 8px", borderRadius: 4 }}
        >
          close
        </div>
      </div>
    </div>
  );
}
