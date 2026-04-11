/**
 * Doctor chat endpoint — Mistral-powered doctor conversation
 * Receives messages + call context, returns doctor response.
 */

import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, patientName, callSummary, language } = await request.json();

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Mistral API key not configured" }, { status: 500 });
    }

    const isFr = language === "fr";

    const systemPrompt = isFr
      ? `Tu es le Dr. Claire Morel, médecin généraliste dans le réseau Alan.
Tu viens de recevoir le contexte d'un appel de suivi entre ${patientName} et Maude, l'assistant santé Alan.

Résumé de l'appel : ${callSummary}

Règles :
- Tu es chaleureuse, professionnelle et concise.
- Tu as accès au contexte de l'appel. Utilise-le pour personnaliser tes réponses.
- Tu peux donner des conseils médicaux généraux mais rappelle que tu ne remplaces pas une consultation en personne.
- Réponds en 2-3 phrases max. C'est un chat, pas une consultation.
- Utilise "vous" (jamais "tu").
- Si le patient a besoin d'une consultation approfondie, propose un rendez-vous via l'app Alan.`
      : `You are Dr. Claire Morel, a general practitioner in the Alan network.
You just received the context of a follow-up call between ${patientName} and Maude, Alan's health assistant.

Call summary: ${callSummary}

Rules:
- You are warm, professional, and concise.
- You have access to the call context. Use it to personalize your responses.
- You can give general medical advice but remind that you don't replace an in-person consultation.
- Respond in 2-3 sentences max. This is a chat, not a consultation.
- If the patient needs a thorough consultation, suggest booking via the Alan app.`;

    const mistralMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: mistralMessages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Mistral API error:", err);
      return NextResponse.json({ error: "Failed to get doctor response" }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || (isFr ? "Je suis désolée, je n'ai pas pu répondre. Réessayez." : "Sorry, I couldn't respond. Please try again.");

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Doctor chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
