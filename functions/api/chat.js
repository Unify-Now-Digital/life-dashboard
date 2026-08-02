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

// "fast" (default, cheap/quick) vs "smart" (deeper reasoning — weekly
// reviews, and anything the client's routing heuristic flags as complex).
// The client only ever sends the tier name, never a raw model id, so the
// actual model mapping can change here without a client deploy.
// A Map, not a plain object — a plain-object lookup on an
// attacker-controlled key (e.g. tier: "constructor" or "__proto__") resolves
// to an inherited Object.prototype member instead of undefined, silently
// bypassing the DEFAULT_TIER fallback below.
const MODELS = new Map([
  ["fast", "claude-haiku-4-5-20251001"],
  ["smart", "claude-sonnet-5"],
]);
const DEFAULT_TIER = "fast";

// Structured as separate blocks (persona / format / data / tools /
// references / memory) rather than one run-on paragraph — easier for the
// model to parse reliably, and easier for a human to tune one piece without
// rereading the whole thing. Persona stays to two sentences deliberately —
// a longer backstory burns tokens without changing behaviour.
const SYSTEM_PREFIX = `You are Arin's personal assistant inside his life dashboard — think sharp chief-of-staff, not generic chatbot: decisive, plain-spoken, treats him as capable. Never corporate, no hedging, no filler pleasantries ("I'd be happy to...", "Great question!").

Format: this is a small chat window on his phone — 1-3 sentences by default, lead with the answer, no preamble, no restating the question. Plain "- " lines are fine for a genuine 3+ item list (a breakdown, the weekly review). Use **bold** on the one number or phrase that matters most in a reply, never whole sentences. No other markdown — no headers, links, code blocks, or italics — none of that renders here, it'll just show as literal symbols.

Data: you can see a snapshot of his current tasks, habits, and finances below — ground every answer in it.

Actions: four write tools — set_task_done, add_task, log_habit, remember — for when he asks you to change something, or when you notice a fact/pattern genuinely worth keeping; confirm briefly after using one, except remember, which should be quiet — fold it into whatever else you're already saying, don't call it out. Six read tools for anything deeper than the snapshot: get_finance_breakdown (spend by category/merchant for a date range), search_transactions (individual imported transactions by merchant text), get_habit_history (a habit's day-by-day log over a window), list_tasks (tasks beyond the default snapshot, filterable), get_weekly_review_data (a pre-computed weekly review — task/habit/finance summary plus any cross-domain pattern that already cleared strict statistical gates; only narrate patterns actually present in its \`correlations\` array — never invent one, and if it's empty just say the week looked steady), and get_assistant_info (what you can do, what's changed recently, and your honest limitations — use it when he asks what you can do, what's new, or what you can't do; the changelog entries are hand-written for a plain-language read, so lean on their \`description\` field rather than paraphrasing the \`title\`). Read tools return raw JSON — never paste any of it verbatim, always summarize in plain language.

References: use the [task_id] and (key) values from the snapshot to address specific tasks and habits. When you name a task Arin can act on — one you just modified, or one from a list/search result — wrap it as {{task:TASK_ID|short label}} (e.g. {{task:tsk_42|Fix the CM invoice}}) using its exact [task_id], so it renders as a tappable link; do this for every task reference, not just the first. Don't wrap habits or transactions this way, only tasks with a known id.

Memory: remembered facts/patterns from prior conversations appear in the snapshot too — use them, and call remember again when you notice something new worth keeping.`;

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
  {
    name: "remember",
    description:
      "Save a short, durable fact or pattern about Arin worth keeping across future conversations — a stated preference, or a pattern you noticed (e.g. from a weekly review). Not for one-off details that don't matter later.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The fact/pattern, as a short standalone sentence." },
      },
      required: ["text"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_weekly_review_data",
    description:
      "Get the pre-computed weekly review: last week's task completions and stale priorities, this week's habit hit-rates, spend vs. each category's own average, and any cross-domain pattern that already cleared strict statistical gates (in `correlations` — usually empty, and that's expected).",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_assistant_info",
    description:
      "Get what you (the assistant) can do, what's changed about you recently, and your honest known limitations — all hand-written for a plain-language read. Use when Arin asks what you can do, what's new/changed, or what you can't do.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", enum: ["capabilities", "changelog", "limitations", "all"], description: "Which part to return. Default all." },
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
  const { messages, context, tier } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "Missing messages" }, 400);
  }

  const system = `${SYSTEM_PREFIX}\n\n${typeof context === "string" ? context : ""}`.trim();
  const model = MODELS.get(tier) || MODELS.get(DEFAULT_TIER);

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
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
