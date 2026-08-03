// AI-polished sentence for the daily focus hero card.
//
// The hero's ring/stat/decay bar render instantly from local computation
// (dailyFocus.js) — never blocked on the network. This module streams in a
// short, sharper sentence a beat behind, reusing the existing /api/chat
// pipeline (chatStream.js) on the "fast" tier. It's a one-off request, not
// a conversation turn: never persisted into `assistant.messages`, and the
// model is asked for exactly one sentence with no tool use.
//
// Always call buildFallbackSentence() first and render it immediately —
// fetchDailyNudge() may error, hang, or simply not be configured
// (no ANTHROPIC_API_KEY), and the hero must never show a spinner or blank.

import { streamChat } from "./chatStream.js";

// A plain, deterministic sentence built entirely from local data — good
// enough to stand alone, and what stays on screen if the AI call fails.
export function buildFallbackSentence(item) {
  if (!item) return "";
  if (item.kind === "habit") {
    const quote = item.commitment ? `You said "${item.commitment}". ` : "";
    const pace = item.band === "red" ? "Off pace." : item.band === "amber" ? "Behind pace." : "On pace.";
    return `${quote}${item.label}: ${item.statLine}. ${pace}`;
  }
  const overdueNote = item.task?.due && item.statLine.startsWith("Overdue") ? ` (was due ${item.task.due})` : "";
  return `${item.label} — ${item.statLine}${overdueNote}.`;
}

function promptFor(item) {
  const facts = [`Item: ${item.label}`, `Kind: ${item.kind}`, `Stat: ${item.statLine}`, `Severity band: ${item.band}`];
  if (item.kind === "habit") {
    if (item.commitment) facts.push(`His own stated commitment on this habit: "${item.commitment}"`);
    if (item.lossPreview) facts.push(`Current streak: ${item.streak} days — a real streak worth naming, don't let him lose it quietly.`);
  } else if (item.kind === "task") {
    if (item.task?.notes) facts.push(`Notes: ${item.task.notes}`);
  }
  return [
    "This is today's #1 focus item on Arin's dashboard — the single thing that most deserves his attention right now.",
    facts.join("\n"),
    'Write exactly one sharp, direct sentence (max ~30 words) telling him where he stands and why it matters today. If he gave a commitment quote, reference it naturally. No preamble, no tools, no markdown — plain text, one sentence only.',
  ].join("\n\n");
}

// fetchDailyNudge(item, { onDelta, onDone, onError, signal })
//   item:   one entry from buildDailyFocus().items
//   onDelta(text): incremental chunks, same contract as streamChat
//   onDone(): called once streaming finishes (successfully or not)
//   onError(err): network/upstream failure — caller should keep the fallback
export function fetchDailyNudge(item, { onDelta, onDone, onError, signal } = {}) {
  if (!item) {
    onDone?.();
    return;
  }
  streamChat({
    messages: [{ role: "user", content: promptFor(item) }],
    context: "",
    tier: "fast",
    signal,
    onDelta: (chunk) => onDelta?.(chunk),
    // A one-off polish request should never take an action — if the model
    // reaches for a tool anyway, just ignore the call; no tool_result is
    // sent back, so the stream ends there with stopReason "tool_use" and
    // whatever text streamed before that point is incomplete, not a full
    // sentence. Pass stopReason through so the caller can tell the two
    // cases apart and discard a cut-off fragment instead of displaying it
    // as if it were a finished sentence.
    onToolCall: () => {},
    onDone: ({ stopReason } = {}) => onDone?.({ stopReason }),
    onError: (err) => onError?.(err),
  });
}
