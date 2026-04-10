# Task Distribution

---

## Étape 0 — Arrivée (9h00, tous ensemble, 30 min)

### Pré-requis : comptes et crédits à créer/redeem

**Comptes à créer (la veille ou le matin) :**

| Service | URL | Ce qu'on récupère | Qui |
|---------|-----|-------------------|-----|
| LiveKit Cloud | [cloud.livekit.io](https://cloud.livekit.io) | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Un dev |
| Mistral | [console.mistral.ai](https://console.mistral.ai) | `MISTRAL_API_KEY` | Un dev |
| Linkup | [linkup.so](https://linkup.so) | `LINKUP_API_KEY` | Un dev |

**Crédits à redeem au hackathon :**

| Partenaire | Comment | Détails |
|-----------|---------|---------|
| Mistral | Coupons $10 distribués sur place | En plus du free tier |
| ElevenLabs | Rejoindre Discord → `#🎟️│coupon-codes` → "Start Redemption" | 1 mois Creator Tier (backup TTS si Voxtral sonne mal) |
| Nebius | [Lien de claim](https://nebius.com) → $50 crédits TokenFactory | Pas utilisé dans notre stack mais bon à avoir |

**Credentials récupérées sur place :**

| Service | Quand | Qui va les chercher |
|---------|-------|-------------------|
| Thryve sandbox | Samedi matin, auprès des mentors | Non-tech → donne à Dev 2 |

**À installer (la veille) :**
1. LiveKit CLI → `brew install livekit-cli`
2. Partager les clés avec l'équipe (Slack, Discord — pas dans le repo)

### 9h00 — Clone + install (chacun sur son laptop, 10 min)

```bash
git clone <repo-url>
cd alan-care-call
```

**Dev 1 + Dev 2** (agent Python) :
```bash
cd agent/
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Remplir .env avec les clés partagées : MISTRAL_API_KEY, LIVEKIT_*, LINKUP_API_KEY
```

**Dev 3** (frontend) :
```bash
cd frontend/
pnpm install
cp .env.example .env.local
# Remplir .env.local avec : LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
```

**Non-tech** : ouvrir `agent/playbook.py` dans un éditeur de texte.

### 9h15 — Premier test (vérifier que ça tourne, 15 min)

**Dev 1** teste l'agent :
```bash
cd agent/
python agent.py console
# → Parler dans le micro. L'agent répond ? La voix est bien ?
```

**Dev 3** teste le frontend :
```bash
cd frontend/
pnpm dev
# → Ouvrir http://localhost:3000. Les cartes patients s'affichent ?
```

**Dev 2** teste les outils :
```bash
cd agent/
python -c "from tools import load_patient; print(load_patient('sophie_martin')['name'])"
# → Affiche "Sophie Martin" ?
```

### 9h30 — Alignement rapide (15 min, tous ensemble)

1. **Ça marche ?** Tour de table : agent parle ✅/❌, frontend charge ✅/❌, tools OK ✅/❌
2. **Blocker ?** Si quelque chose ne marche pas, on debug ensemble maintenant
3. **Lire TASKS.md** : chacun lit SA section, pose ses questions
4. **Clés Thryve** : Non-tech va les chercher auprès des mentors et les donne à Dev 2
5. **Go** : chacun part sur ses tâches

### Après 9h30 — chacun bosse sur ses TODOs

```bash
# Dev 1 : voir ses tâches
grep -rn "TODO(Dev1)" agent/

# Dev 2 : voir ses tâches
grep -rn "TODO(Dev2)" agent/

# Dev 3 : voir ses tâches
grep -rn "TODO(Dev3)" frontend/

# Non-tech : ouvrir agent/playbook.py, éditer le texte PLAYBOOK
```

### Règles Git

- **Chacun travaille sur ses fichiers** (voir ownership dans ARCHITECTURE.md)
- **Commit souvent** avec des messages clairs
- **Dev 1 + Dev 2 partagent `agent/`** → se coordonner pour éviter les conflits sur `agent.py`
- **`frontend/lib/types.ts` est partagé** → prévenir les autres si on change un champ

---

## Grep tous les TODOs

```bash
grep -rn "TODO" agent/ frontend/ --include="*.py" --include="*.ts" --include="*.tsx"
```

---

## Dev 1 — Agent Core + LiveKit Orchestration

**Works in:** `agent/agent.py`

**Depends on:** Dev 2 (tools.py), Non-tech (playbook.py)

### Setup (9h00)
```bash
cd agent/
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in MISTRAL_API_KEY + LIVEKIT credentials
python agent.py console   # talk to the agent through your mic
```

### Tasks

| Priority | Task | File | Line to find |
|----------|------|------|-------------|
| P0 | Test the agent works: `python agent.py console` | `agent.py` | — |
| P0 | Test voice quality of `en_paul_confident`. If bad, try other voices | `agent.py` | `TODO(Dev1): Test voice quality` |
| P1 | Send live alerts to frontend via text stream when flag_alert is called | `agent.py` | `TODO(Dev1): Send live alert` |
| P1 | Make summary generation smarter — use LLM to summarize actual conversation | `agent.py` | `TODO(Dev1): Make this smarter` |
| P2 | Test function tools trigger during conversation (ask about reimbursement, ask about wearable data) | — | — |
| P2 | Test the full flow: call → conversation → hang up → summary appears on frontend | — | — |
| P3 | Deploy to LiveKit Cloud: `lk agent create --secrets "MISTRAL_API_KEY=xxx"` | — | — |

### Interfaces you use (owned by other devs)

```python
# From tools.py (Dev 2):
load_patient(patient_id: str) -> dict          # returns patient profile
get_wearable_data(patient_id, thryve_id) -> dict  # returns wearable data

# From playbook.py (Non-tech + Dev 1):
build_system_prompt(patient, wearable_data) -> str  # returns system prompt
```

### Data you send to frontend (Dev 3 consumes)

```python
# Text stream topic="call-summary" → JSON matching CallSummary in frontend/lib/types.ts
# Text stream topic="live-updates" → JSON: {"type": "alert", "level": "orange", "reason": "..."}
```

---

## Dev 2 — Patient Data + Linkup + Thryve + Function Tools

**Works in:** `agent/tools.py`, `agent/patients.json`, `agent/playbook.py` (content)

**Depends on:** Nothing (stubs work independently)

### Setup (9h00)
```bash
cd agent/
source .venv/bin/activate  # reuse Dev 1's venv
cp .env.example .env       # fill in LINKUP_API_KEY (+ THRYVE when available)
python -c "from tools import load_patient; print(load_patient('sophie_martin')['name'])"
```

### Tasks

| Priority | Task | File | Line to find |
|----------|------|------|-------------|
| P0 | Review + adjust 3 patient profiles (medical details, medications) | `patients.json` | — |
| P0 | Test Linkup API: does it return useful reimbursement data? | `tools.py` | `TODO(Dev2): Replace this mock with real Linkup` |
| P1 | If Linkup works → replace mock in `get_reimbursement_info()` | `tools.py` | `STUB: returns mock data` |
| P1 | If Linkup doesn't work → keep mock, mention Linkup in pitch as production source | — | — |
| P1 | When Thryve credentials arrive → replace mock in `get_wearable_data()` | `tools.py` | `TODO(Dev2): Replace this mock with real Thryve` |
| P2 | Add more function tools if needed (send_sms, get_patient_context) | `agent.py` | `TODO(Dev2): Add more function tools` |
| P2 | Help Non-tech refine playbook content | `playbook.py` | — |

### Test Linkup API
```python
import asyncio
from linkup import LinkupClient

async def test():
    client = LinkupClient()  # reads LINKUP_API_KEY from env
    result = await client.async_search(
        query="taux remboursement sécurité sociale consultation spécialiste France",
        depth="standard",
        output_type="sourcedAnswer",
        timeout=10.0,
    )
    print(result.answer)
    for s in result.sources:
        print(f"  {s.name}: {s.url}")

asyncio.run(test())
```

### Interfaces you provide (consumed by Dev 1)

```python
load_patient(patient_id: str) -> dict
# Returns: { patient_id, name, age, plan, recent_event, medications, contract, ... }

get_reimbursement_info(procedure: str, patient: dict) -> dict
# Returns: { procedure, average_price, secu_rate, secu_reimbursement,
#            alan_reimbursement, out_of_pocket, direct_billing }

get_wearable_data(patient_id: str, thryve_user_id: str) -> dict
# Returns: { source, period, heart_rate{...}, sleep{...}, activity{...}, risk_patterns[] }
```

---

## Dev 3 — Frontend Next.js

**Works in:** `frontend/`

**Depends on:** Dev 1 (text streams from agent)

### Setup (9h00)
```bash
cd frontend/
pnpm install
cp .env.example .env.local   # fill in LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
pnpm dev
# Open http://localhost:3000
```

### Tasks

| Priority | Task | File | Line to find |
|----------|------|------|-------------|
| P0 | `pnpm install && pnpm dev` — confirm the page loads | — | — |
| P0 | Test token generation: click a patient → check network tab for /api/token | `app/api/token/route.ts` | — |
| P1 | Polish PatientSelector — better card design, gradients, hover effects | `PatientSelector.tsx` | `TODO(Dev3): Improve card design` |
| P1 | Polish Dashboard — this is what the judge sees after the call | `Dashboard.tsx` | `TODO(Dev3):` (multiple) |
| P1 | Cold start UX — nice animation while agent wakes up (10-20 sec) | `CallInterface.tsx` | `TODO(Dev3): Make this a nice animation` |
| P2 | Show wearable data with trend arrows, colors, risk badges | `Dashboard.tsx` | `TODO(Dev3): Show values with baselines` |
| P2 | Show reimbursement as a clear breakdown (sécu + alan + out-of-pocket) | `Dashboard.tsx` | `TODO(Dev3): Nice breakdown` |
| P3 | Deploy to Vercel: `vercel deploy --prod` | — | — |

### Data you receive from the agent

```typescript
// Text stream topic="call-summary" → CallSummary (see lib/types.ts)
// Text stream topic="live-updates" → { type: "alert", level: "orange"|"red", reason: string }

// Automatic from LiveKit:
// useVoiceAssistant() → { state, audioTrack, agentTranscriptions }
```

### Token endpoint — how patient_id reaches the agent

```
1. User clicks patient → CallInterface fetches POST /api/token { patientId }
2. Token endpoint puts patient_id in participant attributes
3. LiveKit sends the token to the room
4. Agent reads: participant.attributes.get("patient_id")
```

---

## Non-tech — Playbook, Pitch, Testing

**Works in:** `agent/playbook.py` (text content only), `pitch/`

**Depends on:** Nothing

### Tasks

| Priority | Task | File |
|----------|------|------|
| P0 | Talk to Alan + Mistral mentors at breakfast — get judging criteria | — |
| P0 | Get Thryve sandbox credentials → give to Dev 2 | — |
| P1 | Review + adjust playbook text | `agent/playbook.py` → `PLAYBOOK` variable |
| P1 | Co-write patient profiles with Dev 2 | `agent/patients.json` |
| P2 | Test the agent in a loop — find bugs, note inconsistencies | — |
| P2 | Test edge cases: off-topic questions, silence, interruptions | — |
| P3 | Prepare pitch (30 sec intro + live demo) | `pitch/` |
| P3 | Rehearse demo with whole team | — |

### How to edit the playbook

Open `agent/playbook.py`. Find the `PLAYBOOK = """..."""` variable. Edit the English text inside. That's it — the agent follows these instructions during every call. No code knowledge needed.

---

## Integration Checkpoints

| Time | Check | Who |
|------|-------|-----|
| **10h00** | Agent speaks and responds via `console` mode? | Dev 1 |
| **10h00** | `pnpm dev` → page loads, patient cards show? | Dev 3 |
| **10h00** | `load_patient()` returns valid data? | Dev 2 |
| **13h00** | Agent + frontend connected — can hear the agent? | Dev 1 + Dev 3 |
| **13h00** | Function tools trigger during conversation? | Dev 1 + Dev 2 |
| **13h00** | Playbook reviewed and adjusted? | Non-tech |
| **16h00** | Full flow works: select patient → call → dashboard shows summary? | All |
| **16h00** | Linkup and/or Thryve integrated (or mocks confirmed)? | Dev 2 |
| **18h00** | CODE FREEZE — deployed on LiveKit Cloud + Vercel? | Dev 1 + Dev 3 |
| **18h00-19h00** | Test demo 5x + rehearse pitch | All |

---

## Data Contracts

All types are defined in `frontend/lib/types.ts`. The agent MUST return JSON matching these types. The frontend MUST display them.

If you change a field in the agent → update `types.ts` → update the Dashboard.
If you add a field in Dashboard → update `types.ts` → update the agent summary.

**Single source of truth:** `frontend/lib/types.ts`
