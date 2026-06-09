// functions/api/label-image.js
//
// Cloudflare Pages Function (migrated from the old Vercel api/label-image.js).
// Called by PhotoQuickAdd when the user uploads an image — produces a short
// auto-label and a one-line diary description.
//
// POST body: { image: string }   // base64 data URL
// Returns:   { label: string, summary: string }
//
// Falls back gracefully (503) if ANTHROPIC_API_KEY is unset — the client
// already provides a timestamp label, so this endpoint is purely additive.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "Labelling not configured" }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { image } = body || {};
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
      return json({ error: "Claude API error", status: anthropicRes.status }, 502);
    }

    const data = await anthropicRes.json();
    const replyText = data?.content?.[0]?.text || "";

    const jsonMatch = replyText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return json({ error: "Could not parse labelling" }, 502);

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
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
