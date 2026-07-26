// Client-side helper for the floating assistant widget. Sends the message
// history + context summary to /api/chat and parses Anthropic's native
// Messages-API SSE stream (the server passes those bytes through untouched —
// see api/chat.js / functions/api/chat.js — so all the parsing lives here,
// in exactly one place).
//
// streamChat({ messages, context, onDelta, onToolCall, onDone, onError, signal })
//   messages: [{ role: 'user'|'assistant', content: string|array }]
//   context:  string — see assistantContext.js
//   (tool definitions are hardcoded server-side in api/chat.js /
//   functions/api/chat.js, so the client never sends them)
//   onDelta(text): called with each incremental chunk of assistant text
//   onToolCall({id, name, input, error}): called once per tool_use block,
//     once its input JSON is fully streamed. `error` + `input: null` on a
//     JSON.parse failure (never thrown out of here).
//   onDone({stopReason}): called once the stream completes normally
//   onError(err): called on a network/parse/upstream error
//   signal:   an AbortController signal, for the panel's stop button

export async function streamChat({ messages, context, onDelta, onToolCall, onDone, onError, signal }) {
  let res;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, context }),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") return;
    onError(err);
    return;
  }

  if (!res.ok || !res.body) {
    let message = "Something went wrong.";
    try {
      const data = await res.json();
      if (res.status === 503) message = "Assistant isn't configured yet.";
      else if (data?.error) message = data.error;
    } catch {
      // ignore — use default message
    }
    onError(new Error(message));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  // Per content-block-index accumulators for tool_use blocks.
  const toolBlocks = new Map();
  let stopReason = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const block of events) {
        const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        let data;
        try {
          data = JSON.parse(dataLine.slice(5).trim());
        } catch {
          continue;
        }

        if (data.type === "content_block_start" && data.content_block?.type === "tool_use") {
          toolBlocks.set(data.index, { id: data.content_block.id, name: data.content_block.name, json: "" });
        } else if (data.type === "content_block_delta" && data.delta?.type === "text_delta") {
          onDelta(data.delta.text);
        } else if (data.type === "content_block_delta" && data.delta?.type === "input_json_delta") {
          const block = toolBlocks.get(data.index);
          if (block) block.json += data.delta.partial_json || "";
        } else if (data.type === "content_block_stop" && toolBlocks.has(data.index)) {
          const block = toolBlocks.get(data.index);
          toolBlocks.delete(data.index);
          let input = null;
          let error;
          try {
            input = JSON.parse(block.json || "{}");
          } catch (err) {
            error = "Couldn't parse tool input: " + err.message;
          }
          onToolCall?.({ id: block.id, name: block.name, input, error });
        } else if (data.type === "message_delta" && data.delta?.stop_reason) {
          stopReason = data.delta.stop_reason;
        } else if (data.type === "error") {
          onError(new Error(data.error?.message || "Claude API error"));
          return;
        } else if (data.type === "message_stop") {
          onDone({ stopReason });
          return;
        }
      }
    }
    onDone({ stopReason });
  } catch (err) {
    if (err.name === "AbortError") return;
    onError(err);
  }
}
