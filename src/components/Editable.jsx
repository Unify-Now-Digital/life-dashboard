import React, { useState, useEffect, useRef } from "react";
import { C } from "../lib/tokens";

export function EditableText({ value, onChange, placeholder, style, multiline, type = "text" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !multiline) commit();
    if (e.key === "Escape") { setDraft(value); setEditing(false); }
  };

  if (editing) {
    const sharedProps = {
      ref: inputRef,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKey,
      style: {
        ...style,
        border: `1px solid ${C.accent}`,
        borderRadius: 4,
        padding: "2px 6px",
        background: C.bg,
        outline: "none",
        fontFamily: "inherit",
        boxSizing: "border-box",
        width: multiline ? "100%" : "auto",
      },
    };
    if (multiline) return <textarea {...sharedProps} rows={3} />;
    return <input type={type} {...sharedProps} />;
  }

  return (
    <span
      onClick={() => setEditing(true)}
      style={{
        ...style,
        cursor: "text",
        padding: "2px 6px",
        margin: "-2px -6px",
        borderRadius: 4,
        display: "inline-block",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.bgSecondary)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {value || <span style={{ color: C.textTertiary, fontStyle: "italic" }}>{placeholder || "tap to edit"}</span>}
    </span>
  );
}

export function IconBtn({ children, onClick, danger, label }) {
  // Visible chip stays small; the button itself extends ~44px hit area via an
  // absolutely-positioned transparent overlay that doesn't affect layout.
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        position: "relative",
        background: "transparent",
        border: `0.5px solid ${C.border}`,
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 14,
        lineHeight: 1,
        color: danger ? C.danger : C.textSecondary,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 44,
          height: 44,
        }}
      />
      {children}
    </button>
  );
}

export function EditModeToggle({ editing, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        background: editing ? C.accent : "transparent",
        color: editing ? "white" : C.accent,
        border: `0.5px solid ${editing ? C.accent : C.border}`,
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {editing ? "Done" : "Edit"}
    </button>
  );
}
