// api/estimate-macros.js
//
// Vercel serverless function. Called by the Health component when the user
// taps "Estimate with AI" in the food entry modal.
//
// Takes: { text: string, image: string|null }  (image is base64 data URL)
// Returns: { kcal, protein, carbs, fat }  (numbers, grams)
//
// Required env var (set in Vercel dashboard):
//   ANTHROPIC_API_KEY  — your Anthropic API key
//
// If the env var is missing, the function returns 503 and the component
// falls back to manual macro entry. So the Health section works without
// this configured — estimation is just unavailable until you set the key.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Estimation not configured" });
  }

  const { text, image } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing text" });
  }

  // Build the message content. If image present, include it as a vision input.
  const userContent = [];

  if (image && typeof image === "string" && image.startsWith("data:image/")) {
    // Strip the data URL prefix to get the raw base64
    const match = image.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (match) {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: match[1],
          data: match[2],
        },
      });
    }
  }

  userContent.push({
    type: "text",
    text: `Estimate the macronutrients for this meal. Reply with ONLY a JSON object, no other text.

Meal description: ${text}

Required JSON shape:
{ "kcal": <integer>, "protein": <integer grams>, "carbs": <integer grams>, "fat": <integer grams> }

Be realistic. If portion size is ambiguous, assume a typical adult serving. Round to whole numbers.`,
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Claude API error:", anthropicRes.status, errText);
      return res.status(502).json({ error: "Claude API error", status: anthropicRes.status });
    }

    const data = await anthropicRes.json();
    const replyText = data?.content?.[0]?.text || "";

    // Extract the JSON object from the reply (Claude is usually obedient but be safe)
    const jsonMatch = replyText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in reply:", replyText);
      return res.status(502).json({ error: "Could not parse estimation" });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("JSON parse failed:", err, jsonMatch[0]);
      return res.status(502).json({ error: "Invalid JSON in estimation" });
    }

    // Sanity check the fields
    const result = {
      kcal: Math.max(0, Math.round(Number(parsed.kcal) || 0)),
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error("Estimation handler error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
