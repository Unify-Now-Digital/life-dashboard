// worker/index.js
//
// Cloudflare Workers entry. Two responsibilities:
//   1. Serve /api/estimate-macros — same contract as api/estimate-macros.js
//      (the Vercel serverless route), but written in the Workers Fetch API
//      (Request / Response) so it runs on the Workers runtime.
//   2. Fall through every other request to the static-assets binding (the
//      Vite build output in ./dist).
//
// Required env var: ANTHROPIC_API_KEY (set as a Worker secret).

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/estimate-macros") {
      return estimateMacros(request, env);
    }

    // Everything else is the SPA — Workers Static Assets handle index.html
    // routing via wrangler.toml's `not_found_handling = "single-page-application"`.
    return env.ASSETS.fetch(request);
  },
};

async function estimateMacros(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Health component falls back to manual macro entry when this returns
    // 503, so the app keeps working without the integration configured.
    return jsonResponse({ error: "Estimation not configured" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const { text, image } = body || {};
  if (!text || typeof text !== "string") {
    return jsonResponse({ error: "Missing text" }, 400);
  }

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
    text:
      `Estimate the macronutrients for this meal. Reply with ONLY a JSON object, no other text.\n\n` +
      `Meal description: ${text}\n\n` +
      `Required JSON shape:\n` +
      `{ "kcal": <integer>, "protein": <integer grams>, "carbs": <integer grams>, "fat": <integer grams> }\n\n` +
      `Be realistic. If portion size is ambiguous, assume a typical adult serving. Round to whole numbers.`,
  });

  let claudeRes;
  try {
    claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
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
  } catch (err) {
    return jsonResponse({ error: "Internal error" }, 500);
  }
  if (!claudeRes.ok) {
    return jsonResponse({ error: "Claude API error", status: claudeRes.status }, 502);
  }

  const data = await claudeRes.json();
  const replyText = data?.content?.[0]?.text || "";
  const jsonMatch = replyText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return jsonResponse({ error: "Could not parse estimation" }, 502);
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return jsonResponse({ error: "Invalid JSON in estimation" }, 502);
  }

  const result = {
    kcal: Math.max(0, Math.round(Number(parsed.kcal) || 0)),
    protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
    carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
    fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
  };
  return jsonResponse(result, 200);
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
