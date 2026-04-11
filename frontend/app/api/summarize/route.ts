/**
 * Summarize API — generates a CallSummary from conversation transcriptions
 * Uses Mistral to analyze the call and produce structured data.
 *
 * Owner: Dev 3
 */

import { NextRequest, NextResponse } from "next/server";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

export async function POST(req: NextRequest) {
  if (!MISTRAL_API_KEY) {
    return NextResponse.json({ error: "MISTRAL_API_KEY not configured" }, { status: 500 });
  }

  const { transcriptions, patientId, patientName, eventDescription, medications, language } = await req.json();

  const transcript = (transcriptions as string[])
    .map((t: string) => `Maude: ${t}`)
    .join("\n");

  const medsInfo = (medications as { name: string; remaining_days: number }[] || [])
    .map((m) => `${m.name} (${m.remaining_days} days left)`)
    .join(", ");

  const langInstruction = language === "fr"
    ? "Respond in French for the summary and general fields."
    : "Respond in English.";

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{
          role: "user",
          content: `Analyze this health follow-up call transcript between Maude (AI agent) and a patient.

Patient: ${patientName} (ID: ${patientId})
Event: ${eventDescription}
Medications: ${medsInfo || "unknown"}

Transcript (only Maude's side is available):
${transcript || "No transcript available — generate a plausible summary based on the patient context."}

Generate a JSON object with this EXACT structure:
{
  "patient_id": "${patientId}",
  "patient_name": "${patientName}",
  "date": "${new Date().toISOString().split("T")[0]}",
  "duration_seconds": ${Math.max(60, (transcriptions as string[]).length * 15)},
  "alert_level": "green" or "orange" or "red",
  "summary": "1-2 sentence summary of the call",
  "patient_state": { "pain_level": "none/mild/moderate/severe", "mood": "positive/neutral/anxious", "general": "one sentence" },
  "medications_status": [{ "name": "med name", "status": "completed" or "in_progress", "compliance": "full/partial/unknown", "remaining_days": number }],
  "wearable_highlights": { "resting_hr": { "value": number, "baseline": number, "trend": "up/down/stable" }, "sleep_hours": { "value": number, "baseline": number, "trend": "up/down/stable" }, "steps": { "value": number, "baseline": number, "trend": "up/down/stable" }, "risk_patterns": ["string"] },
  "actions": [{ "type": "appointment" or "followup_call" or "flag" or "sms_sent", "description": "string", "sms_sent": boolean, "scheduled_date": "string or null" }],
  "reimbursement_discussed": { "procedure": "${eventDescription}", "average_price": 1850, "secu_rate": 0.7, "secu_reimbursement": 1295, "alan_reimbursement": 480, "out_of_pocket": 75, "direct_billing": true } or null,
  "escalated": false
}

${langInstruction}
Respond with JSON only, no markdown.`,
        }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Mistral error: ${err}` }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const summary = JSON.parse(cleaned);

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Summarize failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
