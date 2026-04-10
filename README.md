# Alan Care Call

Proactive voice AI agent that calls Alan health insurance members after a medical event (surgery, consultation, pregnancy check-up) to check on them, verify medication compliance, discuss wearable health data, and provide reimbursement info.

**Stack:** Mistral (Voxtral STT + Small 4 LLM + Voxtral TTS) + Linkup + Thryve + LiveKit

**Docs:**
- [PRD.md](./PRD.md) — what we're building and why
- [ARCHITECTURE.md](./ARCHITECTURE.md) — how the pieces fit together, data flows, compatibility matrix
- [TASKS.md](./TASKS.md) — who does what, setup commands, checkpoints

---

## How it works

1. The judge opens the URL, picks a patient profile (Sophie, Marc, or Lea)
2. Clicks "Start Call" — the voice agent wakes up and greets by name
3. **The judge plays the patient** — has a voice conversation with the agent (1-3 min)
4. Clicks "End Call"
5. **The admin dashboard appears** — structured summary of the call (what Alan's care team would see in production): patient state, medications, wearable data, alerts, reimbursement, next steps

The agent follows a **playbook** — a set of instructions in plain English that defines its behavior during the call (tone, what to ask, when to escalate). See [PRD.md section 3](./PRD.md) for details.

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
│   ├── agent.py               # Agent skeleton — voice pipeline + function tools
│   ├── playbook.py            # Playbook — Non-tech edits the English text
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
│   │   ├── PatientSelector.tsx  # Pick a patient scenario
│   │   ├── CallInterface.tsx    # Patient view — voice call UI
│   │   └── Dashboard.tsx        # Admin view — post-call summary
│   ├── lib/types.ts           # Data contracts (single source of truth)
│   └── .env.example
│
├── pitch/                     # Pitch materials (Non-tech)
├── PRD.md                     # Product requirements
├── ARCHITECTURE.md            # System architecture + data flows
├── TASKS.md                   # Task distribution ← READ THIS FIRST
└── README.md
```

---

## Who does what

See **[TASKS.md](./TASKS.md)** for the full breakdown with priorities, setup commands, and checkpoints.

| Dev | Area | Entry point | First command |
|-----|------|-------------|---------------|
| **Dev 1** | Agent voice pipeline | `agent/agent.py` | `python agent.py console` |
| **Dev 2** | Data + Linkup + Thryve APIs | `agent/tools.py` | Test Linkup API |
| **Dev 3** | Frontend (patient view + admin dashboard) | `frontend/` | `pnpm dev` |
| **Non-tech** | Playbook + pitch + testing | `agent/playbook.py` | Edit the PLAYBOOK text |

---

## Grep all TODOs

```bash
grep -rn "TODO" agent/ frontend/ --include="*.py" --include="*.ts" --include="*.tsx"
```
