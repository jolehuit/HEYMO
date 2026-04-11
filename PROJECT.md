# HeyMo
Voice AI agent that calls Alan members after a medical event to check on them, show live CTAs on screen, and connect them with a doctor who has the full call context.

## Team
| Name | LinkedIn Profile Link |
| ---- | --------------------- |
| Gabriel Leulmi | https://www.linkedin.com/in/gabriel-leulmi-727047271/ |
| Lenny N. | https://www.linkedin.com/in/lenny-n-52b886278/ |
| Max Penso | https://www.linkedin.com/in/maxpenso/ |
| Mohammad Mujtaba | https://www.linkedin.com/in/mohammad-mujtaba/ |

## The Problem
After a surgery, consultation, or health event, patients are left alone. They forget medications, miss follow-up appointments, don't know what's reimbursed, and hesitate to call a doctor for small concerns. Alan reimburses — but doesn't actively follow up. The gap between "your surgery went well" and "are you actually recovering well?" is where patients fall through the cracks.

## What It Does
Maude, an AI voice agent, proactively calls Alan members a few days after a health event. During the call:

- She asks specific questions about recovery using real patient data (wearable heart rate, sleep, steps)
- She searches for the nearest pharmacy with a real Google Maps overlay shown on screen
- She flags pain or symptoms and shows a button to chat with a doctor after the call
- She checks medication compliance and appointment status
- She looks up reimbursement breakdowns in real time

Everything the agent does appears as a live CTA button on the patient's screen during the call. After the call, the patient gets a recap with all buttons still clickable — including a chat with an AI doctor (Mistral-powered) who has the full conversation context.

## Tech Stack
- **Mistral** 🚀 — Voxtral STT (real-time transcription), Mistral Small (conversation LLM + doctor chat + provider name extraction)
- **ElevenLabs** 🚀 — Text-to-speech (eleven_multilingual_v2 for French, eleven_turbo_v2_5 for English)
- **LiveKit** 🚀 — Real-time voice agent infrastructure (Agents SDK)
- **Linkup** 🚀 — Live web search for pharmacies, providers, reimbursement info, health data
- **Thryve** 🚀 — Wearable health data (heart rate, sleep, activity) with mock fallback
- Next.js 15 + Tailwind — Frontend with iPhone mockup UI
- Google Maps — Real map overlays for provider/pharmacy results

## Special Track
- [x] ElevenLabs

## What We'd Do Next
- Real appointment booking (Doctolib API integration) instead of just showing provider info
- Push notifications — Maude schedules a call and the patient gets a real phone notification
- Multi-turn doctor chat with memory across sessions
- Real SMS reminders for medication compliance
- Integration with Alan's actual member database and reimbursement engine
- Voice cloning for brand-consistent Maude voice across languages
