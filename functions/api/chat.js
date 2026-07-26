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
  "You are Arin's personal life assistant, built into his life dashboard. Be concise, direct, and warm — no fluff, no corporate tone. You can see a snapshot of his current tasks, habits, and finances below; use it to give grounded, specific answers. You can take three actions when asked: mark a task done or reopen it (set_task_done), add a new task (add_task), and log a habit as done or skipped for a day (log_habit). Use the [task_id] and (key) values from the context snapshot. After using a tool, confirm briefly in plain language what you did.";

const TOOLS = [
  {
    name: "set_task_done",
    description: "Mark an existing task done, or reopen a done task.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "The [task_id] from the context snapshot." },
        done: { type: "boolean", description: "true to mark done, false to reopen." },
      },
      required: ["task_id", "done"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "add_task",
    description: "Add a new task to the Work or Personal column.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The task text." },
        column: { type: "string", enum: ["work", "personal"] },
        priority: { type: "boolean", description: "Whether to also add it to the priorities bar." },
        due: { type: ["string", "null"], description: "ISO date (YYYY-MM-DD), or null for no due date." },
      },
      required: ["text", "column"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "log_habit",
    description: "Log a habit as done or skipped for a given day.",
    input_schema: {
      type: "object",
      properties: {
        habit_key: { type: "string", description: "The (key) of the habit from the context snapshot." },
        answer: { type: "string", enum: ["yes", "no"] },
        date: { type: "string", description: "ISO date (YYYY-MM-DD). Defaults to today if omitted." },
      },
      required: ["habit_key", "answer"],
      additionalProperties: false,
    },
    strict: true,
  },
];

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
        max_tokens: 1536,
        stream: true,
        system,
        messages,
        tools: TOOLS,
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
