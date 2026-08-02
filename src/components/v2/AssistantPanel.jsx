import React, { useEffect, useRef, useState } from "react";
import { C } from "../../lib/tokens";

// The model wraps a task reference as {{task:TASK_ID|short label}} (see
// SYSTEM_PREFIX in api/chat.js / functions/api/chat.js) so it renders as a
// tappable chip instead of plain text. Only ever applied to assistant
// messages — a user typing this syntax literally should never turn into a
// live chip.
// Label is `*` (allow empty), not `+` — an empty label ({{task:id|}}) still
// falls through to a sensible fallback below rather than failing to match
// entirely and leaking the raw {{...}} markup into the chat.
const TASK_CHIP_RE = /\{\{task:([^|}]+)\|([^}]*)\}\}/g;

function renderContent(text, onOpenTask) {
  if (!text.includes("{{task:")) return text;
  const nodes = [];
  let lastIndex = 0;
  let i = 0;
  TASK_CHIP_RE.lastIndex = 0;
  let match;
  while ((match = TASK_CHIP_RE.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const [, taskId, rawLabel] = match;
    const label = rawLabel.trim() || "Open task";
    nodes.push(
      <button
        key={`chip-${i++}`}
        onClick={(e) => {
          e.stopPropagation();
          onOpenTask?.(taskId.trim());
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          background: C.card,
          border: `0.5px solid ${C.accent}`,
          color: C.accent,
          borderRadius: 999,
          padding: "1px 8px",
          margin: "0 1px",
          fontSize: 12.5,
          fontWeight: 500,
          fontFamily: "inherit",
          cursor: "pointer",
          verticalAlign: "middle",
        }}
      >
        {label}
        <span aria-hidden="true" style={{ fontSize: 11 }}>›</span>
      </button>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

// Cheap, static follow-up suggestions keyed on what the last reply touched —
// no extra API call, no model round-trip to decide. A reply that doesn't
// match any rule just shows no suggestions, which is the right default
// (not every answer needs a nudge to keep going).
const SUGGESTION_RULES = [
  { test: /spend|category|categories|transaction|budget|merchant/i, replies: ["Compare to last month", "Biggest category this month?"] },
  { test: /habit|streak|gym|logged|hit.rate/i, replies: ["How's my week overall?", "Any habit at risk?"] },
  { test: /weekly review|correlation|pattern/i, replies: ["Any task overdue?", "How's my spend this week?"] },
  { test: /task|priority|priorities|decision/i, replies: ["What's overdue?", "Any pending decisions?"] },
];

function suggestedRepliesFor(text) {
  if (!text) return [];
  const rule = SUGGESTION_RULES.find((r) => r.test.test(text));
  return rule ? rule.replies : [];
}

// Floating assistant chat panel. Reuses TaskFocus's overlay+panel pattern
// (backdrop click-to-close, C.overlay, matching animation timings) but opens
// from the bottom-right corner rather than the right edge, and goes
// full-screen on mobile per chat-widget UX convention (a floating mini-window
// is unusable on a phone beyond a single exchange).
export default function AssistantPanel({
  open,
  onClose,
  messages,
  streamingText,
  isStreaming,
  error,
  onSend,
  onStop,
  onOpenTask,
  isCompact,
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, streamingText, open]);

  useEffect(() => {
    if (open && !isStreaming) inputRef.current?.focus();
  }, [open, isStreaming]);

  if (!open) return null;

  const send = () => {
    const text = draft.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setDraft("");
  };

  const bubble = (role, text, key) => (
    <div key={key} style={{ display: "flex", justifyContent: role === "user" ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "82%",
          background: role === "user" ? C.accentLight : C.bgSecondary,
          color: role === "user" ? C.accentDark : C.text,
          borderRadius: 12,
          padding: "8px 12px",
          fontSize: 13.5,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {role === "assistant" ? renderContent(text, onOpenTask) : text}
      </div>
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 210, display: "flex", alignItems: "flex-end", justifyContent: isCompact ? "stretch" : "flex-end", animation: "overlayIn 0.15s ease" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          border: `0.5px solid ${C.borderStrong}`,
          borderRadius: isCompact ? 0 : 16,
          width: isCompact ? "100%" : "min(400px, 100%)",
          height: isCompact ? "100%" : "min(70vh, 640px)",
          margin: isCompact ? 0 : "0 max(12px, env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom))",
          boxSizing: "border-box",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.22)",
          animation: "panelIn 0.18s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `0.5px solid ${C.border}` }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Assistant</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", color: C.textTertiary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.length === 0 && !streamingText && !error && (
            <div style={{ fontSize: 12.5, color: C.textTertiary, textAlign: "center", marginTop: 24 }}>
              Ask me about your tasks, habits, or spend.
            </div>
          )}

          {messages.map((m) => bubble(m.role, m.text, m.id))}

          {!isStreaming && !error && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
            (() => {
              const suggestions = suggestedRepliesFor(messages[messages.length - 1].text);
              return suggestions.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 2 }}>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => onSend(s)}
                      style={{
                        border: `0.5px solid ${C.border}`,
                        background: C.bgSecondary,
                        color: C.textSecondary,
                        borderRadius: 999,
                        padding: "5px 11px",
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null;
            })()
          )}

          {isStreaming && !streamingText && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ background: C.bgSecondary, borderRadius: 12, padding: "9px 13px", display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: C.textTertiary, animation: "habitPulse 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {streamingText && bubble("assistant", streamingText, "streaming")}

          {error && (
            <div style={{ fontSize: 12, color: C.danger, background: "rgba(153,60,29,0.08)", borderRadius: 10, padding: "8px 11px" }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 12px calc(10px + env(safe-area-inset-bottom))", borderTop: `0.5px solid ${C.border}` }}>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Message the assistant…"
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: `0.5px solid ${C.border}`,
              borderRadius: 9,
              background: C.bgSecondary,
              color: C.text,
              fontSize: 13.5,
              fontFamily: "inherit",
              padding: "8px 11px",
              lineHeight: 1.4,
              outline: "none",
              maxHeight: 100,
            }}
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              style={{ border: `0.5px solid ${C.border}`, background: C.bgSecondary, color: C.textSecondary, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
            >
              Stop
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!draft.trim()}
              style={{ border: "none", background: draft.trim() ? C.accent : C.bgSecondary, color: draft.trim() ? "#fff" : C.textTertiary, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 500, cursor: draft.trim() ? "pointer" : "default", fontFamily: "inherit" }}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
