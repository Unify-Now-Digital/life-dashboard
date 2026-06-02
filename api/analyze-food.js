// api/analyze-food.js
//
// Vercel serverless function. Called by the Health food diary when the user
// taps "Identify & estimate" in the add-entry modal.
//
// This is the brain behind the food diary: it reads a plain-text meal
// description (and optional photo), splits it into individual dishes, then
// for each dish tries — in order — to:
//   1. match it against the user's OWN logged history ("with us"), or
//   2. verify it online via web search (restaurant menus / nutrition dbs), or
//   3. fall back to a sensible estimate.
// Every item comes back with a source and a 0–100 confidence score so the UI
// can show how trustworthy each line is.
//
// Takes: {
//   text:  string,
//   image: string|null,                 // base64 data URL
//   known: [{ text, kcal, protein, carbs, fat }]   // user's prior entries
// }
// Returns: {
//   items: [{ name, portion, source, sourceLabel, confidence,
//             kcal, protein, carbs, fat }],
//   total: { kcal, protein, carbs, fat },
//   confidence: <integer 0-100>          // overall, kcal-weighted
// }
//
// Required env var (set in Vercel dashboard):
//   ANTHROPIC_API_KEY  — your Anthropic API key
//
// If the env var is missing the function returns 503 and the component falls
// back to manual macro entry, exactly like the old estimate-macros endpoint.

const MODEL = "claude-haiku-4-5-20251001";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Estimation not configured" });
  }

  const { text, image, known } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing text" });
  }

  // Trim the known-foods list to something small and clean. These are the
  // user's own past entries — the "with us" source the model prefers.
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
      return res.status(502).json({ error: "Claude API error", status: anthropicRes.status });
    }

    const data = await anthropicRes.json();

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
      return res.status(502).json({ error: "Could not parse estimation" });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("JSON parse failed:", err, jsonMatch[0].slice(0, 500));
      return res.status(502).json({ error: "Invalid JSON in estimation" });
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

    if (items.length === 0) {
      return res.status(502).json({ error: "No items identified" });
    }

    // Totals are summed server-side rather than trusting the model's own math.
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

    return res.status(200).json({ items, total, confidence });
  } catch (err) {
    console.error("analyze-food handler error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

function nonNeg(v) {
  return Math.max(0, Math.round(Number(v) || 0));
}

function clampInt(v, lo, hi) {
  const n = Math.round(Number(v) || 0);
  return Math.min(hi, Math.max(lo, n));
}
