import React from "react";
import { C } from "../lib/tokens";

export default function UndoToast({ label, onUndo }) {
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        color: C.text,
        border: `0.5px solid ${C.borderStrong}`,
        borderRadius: 999,
        padding: "8px 8px 8px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontSize: 13,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        zIndex: 150,
      }}
    >
      <span style={{ color: C.textSecondary }}>{label}</span>
      <button
        onClick={onUndo}
        style={{
          background: "transparent",
          border: `0.5px solid ${C.border}`,
          borderRadius: 999,
          padding: "4px 12px",
          fontSize: 12,
          fontWeight: 500,
          color: C.accent,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Undo
      </button>
    </div>
  );
}
