// Client-side helper for the floating assistant widget. Sends the message
// history + context summary to /api/chat and parses Anthropic's native
// Messages-API SSE stream (the server passes those bytes through untouched —
// see api/chat.js / functions/api/chat.js — so all the parsing lives here,
// in exactly one place).
//
// streamChat({ messages, context, onDelta, onDone, onError, signal })
//   messages: [{ role: 'user'|'assistant', content: string }]
//   context:  string — see assistantContext.js
//   onDelta(text): called with each incremental chunk of assistant text
//   onDone(): called once the stream completes normally
//   onError(err): called on a network/parse/upstream error
//   signal:   an AbortController signal, for the panel's stop button

export async function streamChat({ messages, context, onDelta, onDone, onError, signal }) {
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

        if (data.type === "content_block_delta" && data.delta?.type === "text_delta") {
          onDelta(data.delta.text);
        } else if (data.type === "error") {
          onError(new Error(data.error?.message || "Claude API error"));
          return;
        } else if (data.type === "message_stop") {
          onDone();
          return;
        }
      }
    }
    onDone();
  } catch (err) {
    if (err.name === "AbortError") return;
    onError(err);
  }
}
