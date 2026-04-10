# Architecture

## Vue d'ensemble

Deux composants déployés séparément. Ils communiquent via LiveKit Cloud (WebRTC + text streams).

```
┌─────────────────────────────────────────────────────┐
│                    NAVIGATEUR (juge)                  │
│                                                      │
│  1. Ouvre l'URL Vercel                               │
│  2. Choisit un profil patient                        │
│  3. Clique "Start Call" → parle dans le micro        │
│  4. Raccroche → voit le dashboard                    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              FRONTEND (Vercel)                         │
│              frontend/                                │
│                                                      │
│  Next.js 15.5 + React 19 + Tailwind 4               │
│                                                      │
│  ┌─────────────────────────────────────────┐         │
│  │ page.tsx                                 │         │
│  │  └─ PatientSelector → CallInterface     │         │
│  │      → Dashboard                        │         │
│  └─────────────────────────────────────────┘         │
│                                                      │
│  ┌─────────────────────────────────────────┐         │
│  │ /api/token (route.ts)                   │         │
│  │                                         │         │
│  │  Reçoit: { patientId }                  │         │
│  │  Crée un token LiveKit avec:            │         │
│  │    identity: "patient-sophie_martin"     │         │
│  │    attributes: { patient_id: "..." }    │         │
│  │  Retourne: { token, url, roomName }     │         │
│  └─────────────────────────────────────────┘         │
│                                                      │
│  Env vars: LIVEKIT_URL, LIVEKIT_API_KEY,             │
│            LIVEKIT_API_SECRET                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ WebRTC (audio bidirectionnel)
                       │ + Text Streams (données JSON)
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              LIVEKIT CLOUD                            │
│                                                      │
│  - Gère les rooms WebRTC                             │
│  - Route l'audio entre le navigateur et l'agent      │
│  - Transporte les text streams (summary, alerts)     │
│  - Réveille l'agent quand un participant rejoint     │
│  - Free tier: 1000 min/mois, 5 sessions simultanées  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              AGENT PYTHON (LiveKit Cloud)              │
│              agent/                                   │
│                                                      │
│  ┌─────────────────────────────────────────┐         │
│  │ agent.py — Orchestrateur                │         │
│  │                                         │         │
│  │  1. Lit patient_id des attributes       │         │
│  │  2. Charge patient + wearable data      │         │
│  │  3. Crée AgentSession avec:             │         │
│  │     - Voxtral STT (realtime)            │         │
│  │     - Mistral Small 4 (LLM)            │         │
│  │     - Voxtral TTS                       │         │
│  │     - Silero VAD                        │         │
│  │  4. Envoie le greeting                  │         │
│  │  5. Boucle conversation                 │         │
│  │  6. À la déconnexion → envoie summary   │         │
│  └──────────┬──────────┬───────────────────┘         │
│             │          │                              │
│  ┌──────────▼──┐ ┌────▼────────────────────┐        │
│  │ playbook.py │ │ tools.py                 │        │
│  │             │ │                           │        │
│  │ System      │ │ get_reimbursement_info() │        │
│  │ prompt +    │ │   → Linkup API           │        │
│  │ patient     │ │                           │        │
│  │ context     │ │ get_wearable_data()       │        │
│  │             │ │   → Thryve API            │        │
│  │ (NonTech    │ │                           │        │
│  │  écrit le   │ │ load_patient()            │        │
│  │  texte)     │ │   → patients.json         │        │
│  └─────────────┘ └─────────────┬─────────────┘        │
│                                │                      │
│  Secrets: MISTRAL_API_KEY,     │                      │
│    LINKUP_API_KEY,             │                      │
│    THRYVE_API_KEY              │                      │
└────────────────────────────────┼──────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              api.mistral.ai  api.linkup.so  api.thryve.health
              (STT+LLM+TTS)  (remboursement) (wearables)
```

---

## Flux de données

### 1. Sélection du patient (Frontend → Agent)

```
Juge clique "Sophie"
        │
        ▼
POST /api/token { patientId: "sophie_martin" }
        │
        ▼
Token endpoint crée un JWT LiveKit avec:
  identity: "patient-sophie_martin"
  attributes: { patient_id: "sophie_martin" }    ← C'EST ICI
        │
        ▼
Frontend se connecte au room LiveKit avec ce token
        │
        ▼
LiveKit réveille l'agent Python
        │
        ▼
Agent lit: participant.attributes["patient_id"]   ← ET LÀ
        │
        ▼
Agent charge le profil Sophie depuis patients.json
```

**Fichiers impliqués :**
- `frontend/app/api/token/route.ts` → met patient_id dans attributes
- `agent/agent.py` ligne 226 → lit patient_id des attributes
- `agent/tools.py` → `load_patient()` charge le profil

### 2. Conversation vocale (bidirectionnelle, automatique)

```
Juge parle dans le micro
        │
        ▼ (WebRTC audio)
Voxtral STT transcrit en streaming
        │
        ▼
Silero VAD détecte fin de parole (550ms silence)
        │
        ▼
Mistral Small 4 génère la réponse
  └─ peut appeler des function tools:
     ├─ get_reimbursement_info() → Linkup/mock
     ├─ get_wearable_insights() → Thryve/mock
     ├─ flag_alert() → marque une alerte
     └─ schedule_followup() → planifie un suivi
        │
        ▼
Voxtral TTS convertit le texte en audio
        │
        ▼ (WebRTC audio)
Juge entend la réponse
```

**Zéro code à écrire pour ce flux.** LiveKit + les plugins Mistral gèrent tout. Le seul code c'est la config dans `AgentSession()`.

### 3. Résumé post-appel (Agent → Frontend)

```
Juge clique "End Call"
        │
        ▼
Frontend déconnecte du room LiveKit
        │
        ▼
LiveKit émet "participant_disconnected" sur le room
        │
        ▼
Agent reçoit l'événement (agent.py ligne 250)
        │
        ▼
Agent génère le summary JSON (agent.py ligne 165)
        │
        ▼
Agent envoie via: room.local_participant.send_text(
    json.dumps(summary), topic="call-summary"
)
        │
        ▼ (LiveKit text stream)
Frontend reçoit via: useTextStream("call-summary")
        │
        ▼
Dashboard.tsx affiche le résumé
```

**Contrat de données :** le JSON du summary DOIT correspondre à `CallSummary` dans `frontend/lib/types.ts`. C'est la source de vérité unique.

### 4. Alertes live pendant l'appel (Agent → Frontend)

```
Agent détecte un symptôme inquiétant
        │
        ▼
LLM appelle flag_alert(level="orange", reason="...")
        │
        ▼
Agent envoie via: room.local_participant.send_text(
    json.dumps({"type": "alert", "level": "orange", "reason": "..."}),
    topic="live-updates"
)
        │
        ▼ (LiveKit text stream)
Frontend reçoit via: useTextStream("live-updates")
        │
        ▼
CallInterface.tsx affiche le bandeau d'alerte
```

**Statut :** le frontend est prêt à recevoir. Le `send_text` dans `flag_alert` est un `TODO(Dev1)`.

---

## Ownership des fichiers

```
agent/
├── agent.py           ← Dev 1 (orchestration, session, lifecycle)
├── playbook.py        ← Non-tech (texte) + Dev 1 (builder function)
├── tools.py           ← Dev 2 (function tools, APIs Linkup/Thryve)
├── patients.json      ← Dev 2 + Non-tech (profils médicaux)
├── requirements.txt   ← Dev 1
├── Dockerfile         ← Dev 1
└── .env.example       ← Tous

frontend/
├── app/
│   ├── page.tsx           ← Dev 3
│   ├── api/token/route.ts ← Dev 3
│   ├── layout.tsx         ← Dev 3
│   └── globals.css        ← Dev 3
├── components/
│   ├── PatientSelector.tsx ← Dev 3
│   ├── CallInterface.tsx   ← Dev 3
│   └── Dashboard.tsx       ← Dev 3
├── lib/
│   ├── types.ts           ← TOUS (contrats de données partagés)
│   └── patients.ts        ← Dev 3
└── .env.example           ← Dev 3
```

**Règle :** si tu changes un champ dans `types.ts`, tu DOIS mettre à jour l'agent ET le dashboard.

---

## Dépendances entre devs

```
                    ┌──────────┐
                    │ Non-tech │
                    │ playbook │
                    └────┬─────┘
                         │ texte du playbook
                         ▼
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Dev 2   │─────▶│  Dev 1   │─────▶│  Dev 3   │
│  tools   │      │  agent   │      │ frontend │
│  data    │      │  session │      │  UI      │
└──────────┘      └──────────┘      └──────────┘
  fournit:          consomme:          consomme:
  tools.py          tools.py           text streams
  patients.json     playbook.py        (summary, alerts)
```

- **Dev 2 ne dépend de personne** → peut bosser dès 9h00
- **Dev 3 ne dépend de personne** → peut bosser dès 9h00 (mocks suffisent)
- **Dev 1 dépend de Dev 2** (tools) et **Non-tech** (playbook) mais les stubs marchent en attendant
- **L'intégration** se fait quand Dev 1 + Dev 3 connectent le frontend au vrai agent (checkpoint 13h00)

---

## APIs externes

| API | SDK | Auth | Utilisé par | Fallback si down |
|-----|-----|------|-------------|-----------------|
| Mistral (STT+LLM+TTS) | Via plugin LiveKit | `MISTRAL_API_KEY` env var | agent.py | Aucun (critique) |
| Linkup (remboursement) | `linkup-sdk` Python | `LINKUP_API_KEY` env var | tools.py | Mock data dans `MOCK_REIMBURSEMENTS` |
| Thryve (wearables) | HTTP REST (pas de SDK) | Credentials hackathon | tools.py | Mock data dans `MOCK_WEARABLES` |
| LiveKit Cloud | SDKs Python + JS | Auto-injecté en cloud | agent.py + frontend | Aucun (critique) |

---

## Stack technique vérifiée

### Agent Python (vérifié via `pip install` + import test)

| Package | Version | Vérifié |
|---------|---------|---------|
| livekit-agents | 1.5.2 | ✅ imports OK |
| livekit-plugins-mistralai | 1.5.2 | ✅ STT, TTS, LLM OK |
| livekit-plugins-silero | 1.5.2 | ✅ VAD.load() OK |
| livekit-plugins-turn-detector | 1.5.2 | ✅ MultilingualModel OK |
| linkup-sdk | 0.13.0 | ✅ installé |

### Frontend (vérifié via npm registry)

| Package | Version | Peer deps | Compatible |
|---------|---------|-----------|------------|
| next | 15.5.15 | — | ✅ CVE-2026-23869 fixé |
| @livekit/components-react | ^2.9.20 | react >=18, tslib ^2.6.2 | ✅ |
| livekit-client | ^2.17.2 | — | ✅ |
| livekit-server-sdk | ^2.13.3 | node >=18 | ✅ |
| react | ^19.0.0 | — | ✅ (>= 18 requis par LiveKit) |
| tslib | ^2.6.2 | — | ✅ peer dep de LiveKit React |
