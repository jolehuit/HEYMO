# HeyMo — Voice AI Health Follow-up by Alan

Test Live : https://heymo.vercel.app

Proactive voice AI agent that calls Alan members after a medical event to check on their recovery, answer questions with real data, and show actionable CTAs on screen during the call.

**One-liner:** A voice agent calls you after surgery, checks your pain/sleep/meds using real wearable data, finds you the nearest pharmacy on a map, and lets you chat with a doctor who has the full call context.

---

## Stack

| Layer | Tech |
|-------|------|
| Voice (STT) | Mistral Voxtral Mini Transcribe |
| LLM | Mistral Small |
| Voice (TTS) | ElevenLabs (eleven_multilingual_v2 FR / eleven_turbo_v2_5 EN) |
| Real-time voice | LiveKit Agents SDK |
| Web search | Linkup API |
| Wearable data | Thryve API (mock fallback) |
| Frontend | Next.js 15 + Tailwind |
| Doctor chat | Mistral Small (via /api/doctor-chat) |

---

## How it works

1. User opens the app, picks a patient profile (Sophie, Marc, or Lea)
2. Taps "Start Call" — Maude (the voice agent) greets by name with a specific question about their recent event
3. **Live conversation** — Maude reacts to answers, uses wearable data (heart rate, sleep, steps), checks medications, and triggers real-time CTAs on screen:
   - **Pharmacy search** with real Google Maps overlay
   - **Doctor chat** button (post-call, Mistral-powered with full call context)
   - **Reimbursement** breakdown
   - **Appointment** reminders
   - **Alert flags** for concerning symptoms
4. After ~3 turns, Maude wraps up
5. **Recap screen** shows all CTAs from the call — clickable maps, doctor chat, actions
6. **Doctor chat** — tap the button, chat with an AI doctor (Mistral) who has the full call context

---

## Setup

### Prerequisites

- Python 3.12+, Node.js 20+
- LiveKit Cloud account + CLI (`brew install livekit-cli`)
- API keys: Mistral, ElevenLabs, Linkup (optional), Thryve (optional)

### Agent

```bash
cd agent/
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
python agent.py dev    # local dev with hot-reload
```

### Frontend

```bash
cd frontend/
npm install
cp .env.example .env.local   # fill in LiveKit + Mistral keys
npm run dev                   # http://localhost:3000
```

### Environment variables

**Agent** (`agent/.env`):
```
MISTRAL_API_KEY=        # Required — STT + LLM + provider name extraction
ELEVEN_API_KEY=         # Required — TTS
LINKUP_API_KEY=         # Optional — live web search (falls back to mock)
THRYVE_API_KEY=         # Optional — wearable data (falls back to mock)
THRYVE_APP_ID=          # Optional
LIVEKIT_URL=            # Required
LIVEKIT_API_KEY=        # Required
LIVEKIT_API_SECRET=     # Required
```

**Frontend** (`frontend/.env.local`):
```
LIVEKIT_URL=            # Required
LIVEKIT_API_KEY=        # Required
LIVEKIT_API_SECRET=     # Required
MISTRAL_API_KEY=        # Required — doctor chat + summarize + translate
```

### Deploy

```bash
# Agent → LiveKit Cloud
cd agent/
lk agent deploy

# Frontend → Vercel (or any Node host)
cd frontend/
vercel deploy --prod
```

---

## Project structure

```
HEYMO/
├── agent/
│   ├── agent.py               # Voice agent — pipeline, tools, CTAs
│   ├── playbook.py            # System prompt — conversation flow, rules
│   ├── tools.py               # Linkup search, Thryve wearables, reimbursement
│   ├── patients.json          # 3 patient profiles (Sophie, Marc, Lea)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Main page — home → call → recap → dashboard
│   │   └── api/
│   │       ├── token/         # LiveKit token with patient_id
│   │       ├── doctor-chat/   # Mistral doctor chat endpoint
│   │       ├── summarize/     # Post-call summary generation
│   │       └── translate/     # Translation helper
│   ├── components/
│   │   ├── CallInterface.tsx  # Active call — avatar, CTAs, map modal, transcription
│   │   ├── PatientActions.tsx # Post-call recap — maps, doctor chat, actions
│   │   ├── DoctorChat.tsx     # Mistral-powered doctor conversation
│   │   ├── Dashboard.tsx      # Care team view — full call summary
│   │   ├── AlanHomeScreen.tsx # App home screen
│   │   └── PhoneFrame.tsx     # iPhone mockup frame
│   ├── lib/
│   │   ├── types.ts           # Shared types (CallSummary, LiveCTA, etc.)
│   │   ├── patients.ts        # Patient profiles for frontend
│   │   └── i18n.tsx           # FR/EN translations
│   └── .env.example
│
├── PRD.md
├── ARCHITECTURE.md
├── TASKS.md
└── README.md
```

---

## Patient profiles

| Patient | Scenario | Key data |
|---------|----------|----------|
| **Sophie Martin** (42) | Right knee arthroscopy | HR elevated, sleep declining, low steps, Lovenox 7 days left |
| **Marc Dubois** (58) | Type 2 diabetes follow-up | Stable vitals, 3 medications, HbA1c test due |
| **Lea Chen** (31) | Pregnancy (22 weeks) | HR elevated (normal), reduced activity, morphology ultrasound due |

---

## Key features

- **Real-time CTAs** — buttons appear on screen during the call as the agent uses tools
- **Google Maps** — pharmacy/provider search shows a real map modal with address + phone
- **Doctor chat** — after the call, patient taps a button to chat with an AI doctor who has the full conversation context
- **Wearable data** — heart rate, sleep, steps woven into the conversation naturally
- **Bilingual** — full FR/EN support (voice, CTAs, recap, doctor chat)
- **Playbook-driven** — conversation behavior is defined in plain English in `playbook.py`, editable by non-engineers
