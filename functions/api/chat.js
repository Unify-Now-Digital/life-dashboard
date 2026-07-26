// functions/api/chat.js
//
// Cloudflare Pages Function (mirrors api/chat.js for Vercel). Called by the
// floating assistant widget.
//
// Thin auth-adding proxy in front of the Anthropic Messages API: the client
// builds the dashboard-state context summary and message history, this
// function just injects ANTHROPIC_API_KEY and streams the upstream SSE bytes
// straight back to the browser unmodified — the client parses the stream.
//
// POST body: { messages: [{role, content}], context: string }
// Returns:   text/event-stream (Anthropic's native Messages-API stream)
//
// Requires the ANTHROPIC_API_KEY secret on the Pages project. If it's missing
// the function returns 503 and the widget shows an inline "not configured"
// state, same convention as functions/api/analyze-food.js.

const MODEL = "claude-haiku-4-5-20251001";
const SYSTEM_PREFIX =
  "You are Arin's personal life assistant, built into his life dashboard. Be concise, direct, and warm — no fluff, no corporate tone. You can see a snapshot of his current tasks, habits, and finances below; use it to give grounded, specific answers. You cannot edit anything yet — you can only discuss and advise.";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "Assistant not configured" }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { messages, context } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "Missing messages" }, 400);
  }

  const system = `${SYSTEM_PREFIX}\n\n${typeof context === "string" ? context : ""}`.trim();

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        stream: true,
        system,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Claude API error:", anthropicRes.status, errText);
      return json({ error: "Claude API error", status: anthropicRes.status }, 502);
    }

    return new Response(anthropicRes.body, {
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
      },
    });
  } catch (err) {
    console.error("chat handler error:", err);
    return json({ error: "Internal error" }, 500);
  }
}
