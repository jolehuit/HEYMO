# Alan Care Call

Voice AI agent that calls Alan members for post-consultation health follow-up.

**Stack:** Mistral (Voxtral STT + Small 4 LLM + Voxtral TTS) + Linkup + Thryve + LiveKit

---

## Setup

### Prerequisites

- Python 3.12+, Node.js 20+, pnpm 9+
- LiveKit Cloud account → [cloud.livekit.io](https://cloud.livekit.io)
- LiveKit CLI → `brew install livekit-cli`
- Mistral API key → [console.mistral.ai](https://console.mistral.ai) (+ $10 coupon onsite)
- Linkup API key → [linkup.so](https://linkup.so)
- Thryve credentials → given at hackathon (ask mentors)
- (Optional) ElevenLabs → Discord `#🎟️│coupon-codes` for backup TTS

### Agent (Python)

```bash
cd agent/
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
python agent.py console  # test with your mic
```

### Frontend (Next.js)

```bash
cd frontend/
pnpm install
cp .env.example .env.local   # fill in LiveKit keys
pnpm dev                      # http://localhost:3000
```

### Deploy

```bash
# Agent → LiveKit Cloud
cd agent/
lk cloud auth && lk project set-default "your-project"
lk agent create --secrets "MISTRAL_API_KEY=xxx" --secrets "LINKUP_API_KEY=xxx"

# Frontend → Vercel
cd frontend/
vercel deploy --prod
# Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in Vercel dashboard
```

---

## Project Structure

```
alan-care-call/
├── agent/                     # Python voice agent (Dev 1 + Dev 2)
│   ├── agent.py               # Agent skeleton — LiveKit session + function tools
│   ├── playbook.py            # System prompt — Non-tech edits the text
│   ├── tools.py               # Function tools — stubs with mock data
│   ├── patients.json          # 3 patient profiles
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                  # Next.js web interface (Dev 3)
│   ├── app/page.tsx           # Main page — selector → call → dashboard
│   ├── app/api/token/route.ts # Token endpoint (passes patient_id to agent)
│   ├── components/
│   │   ├── PatientSelector.tsx
│   │   ├── CallInterface.tsx
│   │   └── Dashboard.tsx
│   ├── lib/types.ts           # Data contracts (single source of truth)
│   └── .env.example
│
├── TASKS.md                   # Task distribution per dev ← READ THIS
└── README.md
```

---

## Who does what

See **[TASKS.md](./TASKS.md)** for the full breakdown.

| Dev | Area | Entry point | First command |
|-----|------|-------------|---------------|
| **Dev 1** | Agent core + LiveKit | `agent/agent.py` | `python agent.py console` |
| **Dev 2** | Tools + Linkup + Thryve | `agent/tools.py` | Test Linkup API |
| **Dev 3** | Frontend UI | `frontend/` | `pnpm dev` |
| **Non-tech** | Playbook + pitch | `agent/playbook.py` | Edit the PLAYBOOK text |

---

## How it works

```
Judge opens URL → picks patient → clicks Start Call
        ↓
Frontend gets token (with patient_id) → connects to LiveKit room
        ↓
LiveKit wakes the Python agent → agent reads patient_id
        ↓
Agent loads patient data + wearable data → starts conversation
        ↓
During call: Voxtral STT → Mistral Small 4 → Voxtral TTS
        ↓
Judge clicks End Call → agent sends summary JSON via text stream
        ↓
Frontend displays the Dashboard
```

---

## Grep all TODOs

```bash
grep -rn "TODO" agent/ frontend/ --include="*.py" --include="*.ts" --include="*.tsx"
```
