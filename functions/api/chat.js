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
  "You are Arin's personal life assistant, built into his life dashboard. Be concise, direct, and warm — no fluff, no corporate tone. You can see a snapshot of his current tasks, habits, and finances below; use it to give grounded, specific answers. You have three write actions — set_task_done, add_task, log_habit — for when he asks you to change something; confirm briefly in plain language after using one. You also have four read tools for anything deeper than the snapshot: get_finance_breakdown (spend by category/merchant for a date range), search_transactions (individual imported transactions by merchant text), get_habit_history (a habit's day-by-day log over a window), and list_tasks (tasks beyond the default snapshot, filterable). Read tools return raw JSON — never paste it verbatim, always summarize it in plain language. Use the [task_id] and (key) values from the context snapshot to address specific tasks and habits.";

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
  {
    name: "get_finance_breakdown",
    description:
      "Get a spend breakdown by category, with each category's top merchants, for a date range. Uses the imported Revolut statement if one exists, otherwise the seeded demo data.",
    input_schema: {
      type: "object",
      properties: {
        start: { type: "string", description: "ISO date (YYYY-MM-DD). Omit for the full imported range." },
        end: { type: "string", description: "ISO date (YYYY-MM-DD). Omit for the full imported range." },
        category: { type: "string", description: "Limit to one category key (from a prior breakdown). Omit for all categories." },
      },
      required: [],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "search_transactions",
    description:
      "Search imported transactions by merchant/description text. Returns individual rows (date, merchant, amount, category), capped at 20. Only returns results if a CSV has been imported — check the note field.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to match against the merchant/description." },
        start: { type: "string", description: "ISO date (YYYY-MM-DD). Omit for no lower bound." },
        end: { type: "string", description: "ISO date (YYYY-MM-DD). Omit for no upper bound." },
        limit: { type: "integer", description: "Max rows to return. Default and max 20." },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_habit_history",
    description: "Get a habit's day-by-day log (yes/no/unanswered) and hit count over a recent window.",
    input_schema: {
      type: "object",
      properties: {
        habit_key: { type: "string", description: "The (key) of the habit from the context snapshot." },
        days: { type: "integer", description: "How many days back from today to include. Default 28, max 90." },
      },
      required: ["habit_key"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "list_tasks",
    description: "List tasks beyond the default context snapshot, optionally filtered by column, status, or category pill.",
    input_schema: {
      type: "object",
      properties: {
        column: { type: "string", enum: ["work", "personal"] },
        status: { type: "string", enum: ["open", "done"] },
        pill: { type: "string", description: "Category pill to filter by, e.g. CM, Admin." },
        limit: { type: "integer", description: "Max tasks to return. Default 30, max 50." },
      },
      required: [],
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
