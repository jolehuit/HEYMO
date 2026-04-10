# Alan Care Call

Proactive voice AI agent that calls Alan members for post-consultation health follow-up.

Built with **Mistral** (Voxtral STT + Small 4 LLM + Voxtral TTS), **Linkup** (reimbursement data), **Thryve** (wearable health data), and **LiveKit** (real-time voice infrastructure).

---

## Architecture

Two components. Both in the cloud. Zero laptop dependency after deploy.

```
Browser (judge)
    │
    ▼
Vercel ─── Next.js frontend
    │       ├── Patient selector
    │       ├── Call interface (LiveKit React)
    │       ├── Post-call dashboard
    │       └── /api/token endpoint
    │
    │  WebRTC
    ▼
LiveKit Cloud
    │   WebRTC SFU — rooms, audio, tracks
    │
    ▼
LiveKit Cloud — Agent (Python)
    ├── Voxtral STT (realtime streaming)
    ├── Mistral Small 4 (LLM + function calling)
    ├── Voxtral TTS (voice: en_paul_confident)
    ├── Silero VAD
    ├── Function tools:
    │   ├── get_patient_context() → local JSON
    │   ├── get_reimbursement_info() → Linkup API
    │   └── get_wearable_insights() → Thryve API
    └── Post-call summary → text stream to frontend
```

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+, pnpm 9+
- LiveKit Cloud account ([cloud.livekit.io](https://cloud.livekit.io))
- LiveKit CLI (`brew install livekit/tap/lk`)
- Mistral API key
- Linkup API key (optional — hardcoded fallback available)
- Thryve credentials (optional — hardcoded fallback available)

### 1. Agent (Python)

```bash
cd agent/
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Copy .env.example to .env and fill in your keys
cp .env.example .env

# Test locally (speaks through your mic)
python agent.py console
```

### 2. Frontend (Next.js)

```bash
cd frontend/
pnpm install

# Copy .env.example to .env.local and fill in LiveKit keys
cp .env.example .env.local

# Run dev server
pnpm dev
# Open http://localhost:3000
```

### 3. Deploy

```bash
# Set your LiveKit Cloud project as default
lk cloud auth
lk project set-default "your-project-name"

# Deploy agent to LiveKit Cloud (first time)
cd agent/
lk agent create \
  --secrets "MISTRAL_API_KEY=xxx" \
  --secrets "LINKUP_API_KEY=xxx" \
  --secrets "THRYVE_API_KEY=xxx"
# NOTE: LIVEKIT_URL/API_KEY/API_SECRET are auto-injected by LiveKit Cloud

# Subsequent deploys (after code changes)
lk agent deploy

# Check agent status / logs
lk agent status
lk agent logs

# Deploy frontend to Vercel
cd frontend/
vercel deploy --prod
# Set env vars in Vercel dashboard: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
```

---

## Project Structure

```
alan-care-call/
│
├── agent/                          # COMPONENT 1 — Python voice agent
│   ├── agent.py                    # LiveKit agent — main entrypoint (~180 lines)
│   ├── playbook.py                 # System prompt builder with medical playbook
│   ├── tools.py                    # Function tools (Linkup, Thryve, patient data)
│   ├── patients.json               # 3 patient profiles (Sophie, Marc, Léa)
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Docker image for LiveKit Cloud
│   ├── .dockerignore               # Excludes .env, .venv, __pycache__
│   ├── livekit.toml                # LiveKit Cloud config (auto-updated on first deploy)
│   └── .env.example                # Environment variables template
│
├── frontend/                       # COMPONENT 2 — Next.js web interface
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main page (patient selector → call → dashboard)
│   │   ├── globals.css             # Tailwind + custom styles
│   │   └── api/token/route.ts      # LiveKit token generation endpoint
│   ├── components/
│   │   ├── PatientSelector.tsx     # Patient profile cards
│   │   ├── CallInterface.tsx       # LiveKit voice call UI + transcription
│   │   └── Dashboard.tsx           # Post-call summary display
│   ├── lib/
│   │   ├── patients.ts             # Patient display data
│   │   └── types.ts                # TypeScript types (data contracts)
│   ├── package.json                # Next.js 15 + LiveKit React
│   ├── vercel.json                 # Vercel config
│   └── .env.example                # Environment variables template
│
├── pitch/                          # Pitch materials
├── .gitignore
└── README.md                       # This file
```

---

## Role Distribution

### Dev 1 — Agent Core + LiveKit Orchestration

**Works in:** `agent/agent.py`

**Owns:**
- LiveKit Cloud setup + Mistral plugin configuration
- `AgentSession` with Mistral Small 4, Voxtral STT/TTS, Silero VAD
- Playbook integration (imports from `playbook.py`)
- Function tools hookup (imports from `tools.py`)
- Patient context reading from participant attributes
- Post-call summary generation + text stream to frontend
- Call end detection (participant disconnect event)
- Deploy to LiveKit Cloud via `lk agent create`

**Key file:** `agent/agent.py` — this is where the voice pipeline lives.

**Integration points with other devs:**
- Imports `build_system_prompt()` from Dev 2's `playbook.py`
- Imports function tools from Dev 2's `tools.py`
- Sends summary JSON to Dev 3's frontend via `send_text(topic="call-summary")`
- Reads `patient_id` from token attributes set by Dev 3's `/api/token`

**Test command:** `python agent.py console`

---

### Dev 2 — Patient Data + Linkup + Thryve + Function Tools

**Works in:** `agent/tools.py`, `agent/patients.json`, `agent/playbook.py`

**Owns:**
- 3 patient profile JSONs (`patients.json`)
- Linkup API integration for reimbursement search
- Thryve API integration for wearable health data
- Hardcoded fallbacks for both APIs
- Function tool implementations: `get_patient_context()`, `get_reimbursement_info()`, `get_wearable_insights()`
- Playbook content (system prompt text)

**Key files:**
- `agent/tools.py` — all function tool logic, API integrations, fallback data
- `agent/patients.json` — patient profiles
- `agent/playbook.py` — system prompt content

**Integration points with other devs:**
- Dev 1 imports and calls the tools from `tools.py`
- Dev 1 imports `build_system_prompt()` from `playbook.py`
- Tools return JSON matching the data contracts in `frontend/lib/types.ts`

**What to test first:**
```python
# Test Linkup
from tools import search_reimbursement_linkup
import asyncio
result = asyncio.run(search_reimbursement_linkup("consultation spécialiste"))
print(result)

# Test patient loading
from tools import load_patient
print(load_patient("sophie_martin"))
```

---

### Dev 3 — Frontend Next.js

**Works in:** `frontend/`

**Owns:**
- Patient profile selector page (`PatientSelector.tsx`)
- Call interface with LiveKit components (`CallInterface.tsx`)
- Post-call dashboard (`Dashboard.tsx`)
- Token endpoint with patient_id in attributes (`/api/token/route.ts`)
- Cold start UX (connecting animation)
- Vercel deployment

**Key files:**
- `frontend/app/page.tsx` — main page orchestration
- `frontend/components/CallInterface.tsx` — voice call UI
- `frontend/components/Dashboard.tsx` — summary display
- `frontend/app/api/token/route.ts` — token generation

**Integration points with other devs:**
- Token endpoint puts `patient_id` in participant attributes → Dev 1 reads it
- `useTextStream({ topic: "call-summary" })` receives JSON from Dev 1's agent
- `useTextStream({ topic: "live-updates" })` receives live alerts
- Types in `lib/types.ts` match the data contracts from Dev 2's tools

**Test command:** `pnpm dev` → open http://localhost:3000

---

### Non-tech — Playbook, Pitch, Testing

**Works in:** `agent/playbook.py` (content only), `pitch/`

**Owns:**
- Medical playbook content (the actual text in `playbook.py`)
- Patient profile medical details (co-write with Dev 2)
- Testing the agent in a loop — find bugs, inconsistencies
- Test edge cases: off-topic questions, silence, interruptions
- Pitch preparation and demo structure
- Demo rehearsal with the team

**How to edit the playbook:**
The playbook is plain English text in `agent/playbook.py`. Edit the text inside the triple-quoted string. No code knowledge needed — just change the instructions the agent follows.

---

## Data Flow

### How the frontend tells the agent which patient was selected

```
1. Judge clicks "Sophie" → frontend calls /api/token with patientId="sophie_martin"
2. Token endpoint embeds patient_id in participant attributes
3. Frontend connects to LiveKit room with that token
4. Agent wakes up, reads participant.attributes["patient_id"]
5. Agent loads Sophie's profile and starts the conversation
```

### How the dashboard gets call data

| Data | When | Mechanism | Agent → Frontend |
|------|------|-----------|------------------|
| Transcription | During call | Automatic (LiveKit) | `useVoiceAssistant()` |
| Live alerts | During call | Text stream | `send_text(topic="live-updates")` → `useTextStream()` |
| Full summary | End of call | Text stream | `send_text(topic="call-summary")` → `useTextStream()` |

No REST API. No database. Everything flows through LiveKit.

---

## Environment Variables

### Agent (`agent/.env`)

| Variable | Required | Source |
|----------|----------|--------|
| `MISTRAL_API_KEY` | Yes | [console.mistral.ai](https://console.mistral.ai) |
| `LINKUP_API_KEY` | No (has fallback) | [linkup.so](https://linkup.so) |
| `THRYVE_API_KEY` | No (has fallback) | Provided at hackathon |
| `THRYVE_APP_ID` | No (has fallback) | Provided at hackathon |
| `LIVEKIT_URL` | Local dev only | [cloud.livekit.io](https://cloud.livekit.io) |
| `LIVEKIT_API_KEY` | Local dev only | Auto-injected on LiveKit Cloud |
| `LIVEKIT_API_SECRET` | Local dev only | Auto-injected on LiveKit Cloud |

### Frontend (`frontend/.env.local`)

| Variable | Required | Source |
|----------|----------|--------|
| `LIVEKIT_URL` | Yes | [cloud.livekit.io](https://cloud.livekit.io) |
| `LIVEKIT_API_KEY` | Yes | Same LiveKit project |
| `LIVEKIT_API_SECRET` | Yes | Same LiveKit project |

---

## Hackathon Partners

| Partner | Integration |
|---------|------------|
| **Mistral** | STT (Voxtral), LLM (Small 4), TTS (Voxtral) — the brain and voice |
| **Linkup** | Web search API for social security reimbursement rates |
| **Thryve** | Wearable health data API — real activity, sleep, heart rate |
| **LiveKit** | Real-time voice infrastructure — WebRTC, rooms, agent hosting |

---

## Tech Stack

### Agent (Python)

| Package | Version | Purpose |
|---------|---------|---------|
| `livekit-agents` | ~1.5 | Voice agent framework |
| `livekit-plugins-mistralai` | ~1.5 | Voxtral STT + TTS + Mistral LLM |
| `livekit-plugins-silero` | ~1.5 | Voice Activity Detection |
| `livekit-plugins-turn-detector` | ~1.5 | Multilingual turn detection |
| `linkup-sdk` | >=0.13.0 | Linkup web search API |

### Frontend (TypeScript)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.5.14 | React framework |
| `react` | ^19.0.0 | UI library |
| `@livekit/components-react` | ^2.9.20 | LiveKit React components |
| `livekit-client` | ^2.17.2 | LiveKit client SDK |
| `livekit-server-sdk` | ^2.13.3 | Token generation |
| `tailwindcss` | ^4 | Styling |
