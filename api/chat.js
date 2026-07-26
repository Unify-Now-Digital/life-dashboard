// api/chat.js
//
// Vercel serverless function. Called by the floating assistant widget.
//
// Thin auth-adding proxy in front of the Anthropic Messages API: the client
// builds the dashboard-state context summary and message history, this
// function just injects ANTHROPIC_API_KEY and streams the upstream SSE bytes
// straight back to the browser unmodified — the client parses the stream.
//
// Takes: { messages: [{role, content}], context: string }
// Streams: text/event-stream (Anthropic's native Messages-API stream)
//
// Required env var (set in Vercel dashboard):
//   ANTHROPIC_API_KEY — your Anthropic API key
//
// If the env var is missing the function returns 503 and the widget shows an
// inline "not configured" state, same convention as api/analyze-food.js.

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Assistant not configured" });
  }

  const { messages, context } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing messages" });
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
      return res.status(502).json({ error: "Claude API error", status: anthropicRes.status });
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const reader = anthropicRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    console.error("chat handler error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal error" });
    }
    res.end();
  }
}
