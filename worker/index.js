// Cloudflare Worker entry.
//
// Mirrors the two Vercel serverless functions in /api so the app deploys the
// same way on Cloudflare Workers:
//   POST /api/analyze-food  — food diary "Identify & estimate" (web-search aided)
//   POST /api/label-image   — PhotoQuickAdd auto-label
// Everything else is served from the bound static assets (the Vite build).
//
// The handlers are line-for-line equivalent to api/analyze-food.js and
// api/label-image.js, rewritten against the Workers fetch API. Keep the two in
// sync. ANTHROPIC_API_KEY is a Worker secret; when it's missing both endpoints
// return 503 and the UI falls back to manual entry.

const MODEL = "claude-haiku-4-5-20251001";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/analyze-food") return analyzeFood(request, env);
    if (url.pathname === "/api/label-image") return labelImage(request, env);
    return env.ASSETS.fetch(request);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function callClaude(apiKey, body) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
}

// ----- POST /api/analyze-food ------------------------------------------------
async function analyzeFood(request, env) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "Estimation not configured" }, 503);

  const { text, image, known } = (await readBody(request)) || {};
  if (!text || typeof text !== "string") return json({ error: "Missing text" }, 400);

  // Trim the known-foods list to something small and clean — the user's own
  // past entries, the "diary" source the model prefers.
  const knownList = Array.isArray(known)
    ? known
        .filter((k) => k && typeof k.text === "string" && Number(k.kcal) > 0)
        .slice(0, 40)
        .map((k) => ({
          text: String(k.text).slice(0, 120),
          kcal: Math.round(Number(k.kcal) || 0),
          protein: Math.round(Number(k.protein) || 0),
          carbs: Math.round(Number(k.carbs) || 0),
          fat: Math.round(Number(k.fat) || 0),
        }))
    : [];

  const knownBlock = knownList.length
    ? `KNOWN FOODS — the user's own previously logged meals (already confirmed by them). If an item clearly matches one of these, reuse its macros (scaling for portion) and set source "diary":\n${JSON.stringify(knownList)}`
    : `KNOWN FOODS: (none logged yet)`;

  const userContent = [];

  if (image && typeof image === "string" && image.startsWith("data:image/")) {
    const match = image.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (match) {
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: match[1], data: match[2] },
      });
    }
  }

  userContent.push({
    type: "text",
    text: `You are a nutrition analyst. Identify what the user ate, verify the real dishes, and estimate macros.

MEAL (free text, may name a restaurant, city, or several items): ${text}

${knownBlock}

Method — follow this order for EACH distinct dish/item:
1. If it matches one of the KNOWN FOODS above, reuse those macros (scale to portion). source = "diary".
2. Otherwise, USE WEB SEARCH to find the real dish. Prefer the restaurant's own menu/nutrition page (search the restaurant + city + dish), then reputable nutrition databases. When you find a credible source, use it and set source = "web" with sourceLabel = the site/brand you used.
3. If nothing reliable is found, estimate a typical adult serving. source = "estimate".

Set confidence (0-100) per item: high (80-100) for a diary match or an exact menu/nutrition source; medium (50-79) for a close web match or a well-known generic dish; low (<50) for a guess.

Reply with ONLY a JSON object, no prose before or after:
{
  "items": [
    {
      "name": "short dish name",
      "portion": "portion/size assumption, e.g. '1 bowl' or '200g'",
      "source": "diary" | "web" | "estimate",
      "sourceLabel": "where it came from (menu/site/brand), or '' ",
      "confidence": <integer 0-100>,
      "kcal": <integer>,
      "protein": <integer grams>,
      "carbs": <integer grams>,
      "fat": <integer grams>
    }
  ]
}
Round all numbers to whole integers. Do not include a totals field — it will be computed from the items.`,
  });

  try {
    const claudeRes = await callClaude(apiKey, {
      model: MODEL,
      max_tokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      messages: [{ role: "user", content: userContent }],
    });

    if (!claudeRes.ok) {
      console.error("Claude API error:", claudeRes.status, await claudeRes.text());
      return json({ error: "Claude API error", status: claudeRes.status }, 502);
    }

    const data = await claudeRes.json();

    // With web search enabled the assistant turn can contain several content
    // blocks (search calls + results + text). Concatenate the text blocks and
    // pull the JSON object out of the combined reply.
    const replyText = (data?.content || [])
      .filter((b) => b && b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("\n");

    const jsonMatch = replyText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in reply:", replyText.slice(0, 500));
      return json({ error: "Could not parse estimation" }, 502);
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("JSON parse failed:", err, jsonMatch[0].slice(0, 500));
      return json({ error: "Invalid JSON in estimation" }, 502);
    }

    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    const items = rawItems.map((it) => {
      const source = ["diary", "web", "estimate"].includes(it?.source) ? it.source : "estimate";
      return {
        name: String(it?.name || "Item").slice(0, 120),
        portion: String(it?.portion || "").slice(0, 80),
        source,
        sourceLabel: String(it?.sourceLabel || "").slice(0, 80),
        confidence: clampInt(it?.confidence, 0, 100),
        kcal: nonNeg(it?.kcal),
        protein: nonNeg(it?.protein),
        carbs: nonNeg(it?.carbs),
        fat: nonNeg(it?.fat),
      };
    });

    if (items.length === 0) return json({ error: "No items identified" }, 502);

    // Totals summed server-side rather than trusting the model's own math.
    const total = items.reduce(
      (acc, it) => ({
        kcal: acc.kcal + it.kcal,
        protein: acc.protein + it.protein,
        carbs: acc.carbs + it.carbs,
        fat: acc.fat + it.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Overall confidence = kcal-weighted mean of item confidences (a tiny side
    // dish shouldn't drag down a confident main). Falls back to a plain mean.
    const kcalSum = total.kcal || 0;
    const confidence =
      kcalSum > 0
        ? Math.round(items.reduce((s, it) => s + it.confidence * it.kcal, 0) / kcalSum)
        : Math.round(items.reduce((s, it) => s + it.confidence, 0) / items.length);

    return json({ items, total, confidence }, 200);
  } catch (err) {
    console.error("analyze-food handler error:", err);
    return json({ error: "Internal error" }, 500);
  }
}

// ----- POST /api/label-image -------------------------------------------------
async function labelImage(request, env) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "Labelling not configured" }, 503);

  const { image } = (await readBody(request)) || {};
  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    return json({ error: "Missing image" }, 400);
  }

  const match = image.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return json({ error: "Invalid image data" }, 400);

  const userContent = [
    {
      type: "image",
      source: { type: "base64", media_type: match[1], data: match[2] },
    },
    {
      type: "text",
      text: `Look at this photo and produce a JSON object describing it for a personal diary.

Required JSON shape:
{ "label": "<3-5 word title, sentence case, no trailing punctuation>", "summary": "<one short sentence — what the photo shows, neutral tone>" }

Reply with ONLY the JSON object, no other text.`,
    },
  ];

  try {
    const claudeRes = await callClaude(apiKey, {
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: "user", content: userContent }],
    });

    if (!claudeRes.ok) {
      console.error("Claude API error:", claudeRes.status, await claudeRes.text());
      return json({ error: "Claude API error", status: claudeRes.status }, 502);
    }

    const data = await claudeRes.json();
    const replyText = data?.content?.[0]?.text || "";

    const jsonMatch = replyText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return json({ error: "Could not parse labelling" }, 502);

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return json({ error: "Invalid JSON in labelling" }, 502);
    }

    return json({
      label: String(parsed.label || "").slice(0, 80),
      summary: String(parsed.summary || "").slice(0, 240),
    }, 200);
  } catch (err) {
    console.error("Labelling handler error:", err);
    return json({ error: "Internal error" }, 500);
  }
}

function nonNeg(v) {
  return Math.max(0, Math.round(Number(v) || 0));
}

function clampInt(v, lo, hi) {
  const n = Math.round(Number(v) || 0);
  return Math.min(hi, Math.max(lo, n));
}
