// functions/api/analyze-food.js
//
// Cloudflare Pages Function (migrated from the old Vercel api/analyze-food.js).
// Called by the Health food diary when the user taps "Identify & estimate".
//
// Reads a plain-text meal description (+ optional photo), splits it into
// dishes, and for each tries: (1) match the user's own logged history, then
// (2) verify online via web search, then (3) estimate. Every item carries a
// source and a 0-100 confidence score.
//
// POST body: { text, image, known: [{text,kcal,protein,carbs,fat}] }
// Returns:   { items[], total, confidence }
//
// Requires the ANTHROPIC_API_KEY secret on the Pages project. If it's missing
// the function returns 503 and the component falls back to manual entry.

const MODEL = "claude-haiku-4-5-20251001";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "Estimation not configured" }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { text, image, known } = body || {};
  if (!text || typeof text !== "string") return json({ error: "Missing text" }, 400);

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
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Claude API error:", anthropicRes.status, errText);
      return json({ error: "Claude API error", status: anthropicRes.status }, 502);
    }

    const data = await anthropicRes.json();

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

    const total = items.reduce(
      (acc, it) => ({
        kcal: acc.kcal + it.kcal,
        protein: acc.protein + it.protein,
        carbs: acc.carbs + it.carbs,
        fat: acc.fat + it.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );

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

function nonNeg(v) {
  return Math.max(0, Math.round(Number(v) || 0));
}

function clampInt(v, lo, hi) {
  const n = Math.round(Number(v) || 0);
  return Math.min(hi, Math.max(lo, n));
}
