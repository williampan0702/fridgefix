const CANONICAL_COMPONENTS = [
  "burger", "fries", "soda", "pizza", "fried chicken", "white rice",
  "grilled chicken", "side salad", "water", "brown rice", "pasta",
  "chips", "ice cream", "fruit", "vegetables", "tacos", "yogurt"
];

function readOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const blocks = Array.isArray(payload.output) ? payload.output : [];
  for (const block of blocks) {
    for (const content of Array.isArray(block.content) ? block.content : []) {
      if (typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function parseJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Use POST to analyze a meal photo." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({ error: "Photo analysis needs an OPENAI_API_KEY environment variable on the server." });
  }

  const imageDataUrl = request.body?.imageDataUrl;
  if (typeof imageDataUrl !== "string" || !/^data:image\/(jpeg|png|webp|gif);base64,/i.test(imageDataUrl)) {
    return response.status(400).json({ error: "Send one JPEG, PNG, WEBP, or GIF image as a data URL." });
  }
  if (imageDataUrl.length > 6_000_000) {
    return response.status(413).json({ error: "That photo is too large. Try a smaller image." });
  }

  const prompt = `Analyze this meal photo as an uncertain visual estimate. Identify 1 to 6 visible food or drink components, not plates or utensils. Prefer these exact canonical labels whenever visually plausible: ${CANONICAL_COMPONENTS.join(", ")}. Return only valid JSON in this exact shape: {"items":[{"name":"plain food name","confidence":0.0,"estimatedPortion":"short visual portion estimate"}],"notes":"one short uncertainty note"}. Confidence must be between 0 and 1. Do not claim exact ingredients, calories, vitamins, allergens, or preparation methods that cannot be seen. If the image is not clearly a meal, return an empty items array and explain why in notes.`;

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-5.6-luna",
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageDataUrl, detail: "auto" }
          ]
        }]
      })
    });

    const payload = await apiResponse.json();
    if (!apiResponse.ok) {
      const message = payload?.error?.message || "The vision service could not analyze this photo.";
      return response.status(apiResponse.status).json({ error: message });
    }

    const parsed = parseJson(readOutputText(payload));
    const items = (Array.isArray(parsed.items) ? parsed.items : []).slice(0, 6).map(item => ({
      name: String(item.name || "").trim().slice(0, 60),
      confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
      estimatedPortion: String(item.estimatedPortion || "typical serving").trim().slice(0, 80)
    })).filter(item => item.name);

    return response.status(200).json({
      items,
      notes: String(parsed.notes || "Confirm these visual predictions before continuing.").slice(0, 220)
    });
  } catch (error) {
    return response.status(502).json({ error: "The photo response could not be processed. Try another photo or enter the foods manually." });
  }
};
