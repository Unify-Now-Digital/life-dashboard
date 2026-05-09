// api/label-image.js
//
// Vercel serverless function. Called by PhotoQuickAdd when the user uploads
// an image — produces a short auto-label and a one-line diary description.
//
// Takes:    { image: string }  // base64 data URL
// Returns:  { label: string, summary: string }
//
// Falls back to a generic label if ANTHROPIC_API_KEY is missing — the client
// already provides a timestamp-based label, so this endpoint is purely
// additive enrichment.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Labelling not configured" });
  }

  const { image } = req.body || {};
  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    return res.status(400).json({ error: "Missing image" });
  }

  const match = image.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: "Invalid image data" });
  }

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

    const jsonMatch = replyText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: "Could not parse labelling" });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      return res.status(502).json({ error: "Invalid JSON in labelling" });
    }

    return res.status(200).json({
      label: String(parsed.label || "").slice(0, 80),
      summary: String(parsed.summary || "").slice(0, 240),
    });
  } catch (err) {
    console.error("Labelling handler error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
