/**
 * Translation API — proxy to Mistral for dynamic content translation.
 * Uses mistral-small-latest (fast, cheap) for translation tasks.
 *
 * Owner: Dev 3
 */

import { NextRequest, NextResponse } from "next/server";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MODEL = "mistral-small-latest";

export async function POST(req: NextRequest) {
  if (!MISTRAL_API_KEY) {
    return NextResponse.json({ error: "MISTRAL_API_KEY not configured" }, { status: 500 });
  }

  const { text, targetLang } = await req.json();

  if (!text || !targetLang) {
    return NextResponse.json({ error: "Missing text or targetLang" }, { status: 400 });
  }

  const langNames: Record<string, string> = { fr: "French", en: "English" };
  const langName = langNames[targetLang] || targetLang;

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a medical translator. Translate the following JSON values to ${langName}. Keep JSON keys unchanged. Keep medical terms accurate. Keep numbers, units, dates, and proper nouns unchanged. Return ONLY valid JSON, no explanation.`,
          },
          {
            role: "user",
            content: JSON.stringify(text),
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Mistral API error: ${err}` }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Empty response from Mistral" }, { status: 502 });
    }

    // Parse the JSON from Mistral's response
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const translated = JSON.parse(cleaned);

    return NextResponse.json({ translated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
