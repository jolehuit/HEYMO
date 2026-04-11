# Architecture

## Vue d'ensemble

Deux composants déployés séparément. Ils communiquent via LiveKit Cloud (WebRTC + text streams).

```
┌──────────────────────────────────────────────────────┐
│                    NAVIGATEUR                         │
│                                                      │
│  1. Ouvre l'URL Vercel                               │
│  2. Voit le profil Sophie Martin (défaut)            │
│  3. Clique "Start Call" → animation appel entrant    │
│  4. Accepte → parle dans le micro                    │
│  5. Voit les CTA en direct (pharmacie, médecin...)   │
│  6. Raccroche → récapitulatif patient + dashboard    │
│  7. Peut chatter avec Dr. Claire Morel (Mistral)     │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              FRONTEND (Vercel)                        │
│              frontend/                               │
│                                                      │
│  Next.js 15.5 + React 19 + Tailwind 4               │
│                                                      │
│  ┌─────────────────────────────────────────┐         │
│  │ page.tsx                                │         │
│  │  1. AlanHomeScreen (profil Sophie)      │         │
│  │  2. CallInterface (appel vocal —        │         │
│  │     CTAs live, transcription, alertes,  │         │
│  │     modal Google Maps)                  │         │
│  │  3. PatientActions (récap patient —     │         │
│  │     CTAs, chat médecin, médicaments)    │         │
│  │  4. Dashboard (vue équipe soins)        │         │
│  └─────────────────────────────────────────┘         │
│                                                      │
│  ┌─────────────────────────────────────────┐         │
│  │ API Routes                              │         │
│  │                                         │         │
│  │ POST /api/token                         │         │
│  │   → JWT LiveKit avec patient_id +       │         │
│  │     language dans attributes            │         │
│  │                                         │         │
│  │ POST /api/summarize                     │         │
│  │   → Mistral analyse le transcript       │         │
│  │   → retourne CallSummary JSON           │         │
│  │                                         │         │
│  │ POST /api/doctor-chat                   │         │
│  │   → Dr. Claire Morel (Mistral)          │         │
│  │   → conversation avec contexte appel    │         │
│  │                                         │         │
│  │ POST /api/translate                     │         │
│  │   → traduction JSON dynamique FR↔EN     │         │
│  └─────────────────────────────────────────┘         │
│                                                      │
│  Env vars: LIVEKIT_URL, LIVEKIT_API_KEY,             │
│            LIVEKIT_API_SECRET, MISTRAL_API_KEY        │
└──────────────────────┬───────────────────────────────┘
                       │
                       │ WebRTC (audio bidirectionnel)
                       │ + Text Streams (CTAs, alertes)
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              LIVEKIT CLOUD                            │
│                                                      │
│  - Gère les rooms WebRTC                             │
│  - Route l'audio entre le navigateur et l'agent      │
│  - Transporte les text streams :                     │
│    · "live-updates" (CTAs + alertes pendant l'appel) │
│    · "call-summary" (résumé post-appel)              │
│  - Réveille l'agent quand un participant rejoint     │
│  - Free tier: 1000 min/mois, 5 sessions simultanées │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              AGENT PYTHON (LiveKit Cloud)             │
│              agent/                                   │
│                                                      │
│  ┌─────────────────────────────────────────┐         │
│  │ agent.py — Orchestrateur                │         │
│  │                                         │         │
│  │  1. Lit patient_id + language des       │         │
│  │     attributes du participant           │         │
│  │  2. Charge patient + wearable data      │         │
│  │  3. Crée AgentSession avec:             │         │
│  │     - Voxtral STT (realtime)            │         │
│  │     - Mistral Small 4 (LLM)            │         │
│  │     - ElevenLabs TTS (Jessica, v2.5)    │         │
│  │     - Silero VAD                        │         │
│  │     - Multilingual turn detector        │         │
│  │  4. Envoie le greeting personnalisé     │         │
│  │  5. Boucle conversation avec 15 tools   │         │
│  │  6. Auto-hangup après 3 min (démo)      │         │
│  │  7. À la déconnexion → envoie summary   │         │
│  └──────────┬──────────┬───────────────────┘         │
│             │          │                              │
│  ┌──────────▼──┐ ┌────▼────────────────────┐        │
│  │ playbook.py │ │ tools.py                 │        │
│  │             │ │                           │        │
│  │ System      │ │ load_patient()            │        │
│  │ prompt +    │ │   → patients.json         │        │
│  │ patient     │ │                           │        │
│  │ context +   │ │ get_reimbursement_info()  │        │
│  │ wearable    │ │   → Linkup API + parsing  │        │
│  │ data        │ │                           │        │
│  │             │ │ get_wearable_data()        │        │
│  │ (NonTech    │ │   → Thryve QA API         │        │
│  │  écrit le   │ │   (dual Basic Auth)       │        │
│  │  playbook)  │ │                           │        │
│  └─────────────┘ └─────────────┬─────────────┘        │
│                                │                      │
│  Secrets: MISTRAL_API_KEY,     │                      │
│    ELEVEN_API_KEY,             │                      │
│    LINKUP_API_KEY,             │                      │
│    THRYVE_WEB_USER,            │                      │
│    THRYVE_WEB_PASSWORD,        │                      │
│    THRYVE_APP_AUTH_ID,         │                      │
│    THRYVE_APP_AUTH_SECRET      │                      │
└────────────────────────────────┼──────────────────────┘
                                 │
                    ┌────────────┼────────────┬──────────┐
                    ▼            ▼            ▼          ▼
              api.mistral.ai  api.linkup.so  Thryve QA  ElevenLabs
              (STT + LLM)    (recherche)    (wearables) (TTS)
```

---

## Flux de données

### 1. Sélection du patient (Frontend → Agent)

Sophie Martin est le patient par défaut. Pas d'écran de sélection.

```
App s'ouvre → AlanHomeScreen avec Sophie
        │
        ▼
Clic "Start Call" → animation appel entrant
        │
        ▼
POST /api/token { patientId: "sophie_martin", language: "fr" }
        │
        ▼
Token endpoint crée un JWT LiveKit avec:
  identity: "patient-sophie_martin"
  attributes: { patient_id: "sophie_martin", language: "fr" }
        │
        ▼
Frontend se connecte au room LiveKit avec ce token
        │
        ▼
LiveKit réveille l'agent Python
        │
        ▼
Agent lit: participant.attributes["patient_id"]
          participant.attributes["language"]
        │
        ▼
Agent charge le profil Sophie + données wearable
```

**Fichiers impliqués :**
- `frontend/app/page.tsx` → hardcode Sophie, passe au CallInterface
- `frontend/app/api/token/route.ts` → met patient_id + language dans attributes
- `agent/agent.py` entrypoint → lit patient_id + language des attributes
- `agent/tools.py` → `load_patient()` + `get_wearable_data()`

### 2. Conversation vocale (bidirectionnelle)

```
Patient parle dans le micro
        │
        ├──▶ WebRTC audio vers l'agent
        │         │
        │         ▼
        │    Voxtral STT transcrit en streaming
        │         │
        │         ▼
        │    Silero VAD détecte fin de parole
        │         │
        │         ▼
        │    Mistral Small 4 génère la réponse
        │      └─ peut appeler 15 function tools :
        │         ├─ get_reimbursement_info() → Linkup/mock → CTA remboursement
        │         ├─ get_wearable_insights() → données wearable
        │         ├─ flag_alert() → alerte orange/red → bannière sur écran
        │         ├─ schedule_followup() → CTA rendez-vous
        │         ├─ find_nearby_provider() → Linkup + Mistral extraction → CTA carte
        │         ├─ connect_with_doctor() → CTA chat médecin (avec contexte appel)
        │         ├─ request_teleconsultation() → CTA téléconsultation
        │         ├─ send_sms_reminder() → SMS simulé (logué)
        │         ├─ get_patient_context() → profil patient
        │         ├─ get_side_effects() → Linkup
        │         ├─ check_drug_interactions() → Linkup
        │         ├─ get_procedure_price() → Linkup
        │         ├─ get_condition_info() → Linkup
        │         ├─ get_alan_coverage_details() → Linkup
        │         └─ search_health_info() → Linkup (dernier recours)
        │         │
        │         ▼
        │    ElevenLabs TTS convertit le texte en audio (Jessica, Flash v2.5)
        │         │
        │         ▼ (WebRTC audio)
        │    Patient entend la réponse
        │
        └──▶ Browser Speech Recognition (en parallèle)
                  │
                  ▼
             Transcription côté patient affichée dans le chat
```

### 3. CTA live pendant l'appel (Agent → Frontend)

```
LLM appelle un tool (ex: find_nearby_provider)
        │
        ▼
Tool envoie un CTA "loading" :
  room.local_participant.send_text(
    json.dumps({"type":"cta","id":"provider-pharmacie","action":"provider",
                "label":"Pharmacie — Paris","data":{"loading":true}}),
    topic="live-updates"
  )
        │
        ▼ (LiveKit text stream)
Frontend reçoit via: useTextStream("live-updates")
CallInterface.tsx affiche le CTA avec indicateur de chargement
        │
        ▼
Tool termine la recherche → envoie le CTA final (même id = remplacement) :
  {"type":"cta","id":"provider-pharmacie","action":"provider",
   "label":"Pharmacie Centrale du 11e",
   "data":{"address":"12 rue Oberkampf","phone":"01 43 57 12 34",
           "show_map":true}}
        │
        ▼
Frontend remplace le CTA loading par les résultats
Si show_map=true → modal Google Maps pendant 5 secondes
```

**Déduplication :** les CTAs avec le même `id` remplacent le précédent. Utilisé pour la transition chargement → résultat.

### 4. Alertes live pendant l'appel (Agent → Frontend)

```
Agent détecte un symptôme inquiétant (patient mentionne douleur)
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
CallInterface.tsx affiche le bandeau d'alerte orange/red
```

### 5. Résumé post-appel (deux chemins parallèles)

**Chemin A — Frontend (principal pour l'affichage) :**
```
Patient clique "End Call"
        │
        ▼
Frontend POST /api/summarize avec :
  - transcriptions (côté agent uniquement)
  - patientId, patientName, eventDescription
  - medications, language
        │
        ▼
/api/summarize appelle Mistral Small (response_format: json_object)
  → analyse le transcript
  → génère CallSummary JSON complet
        │
        ▼
Frontend reçoit le summary → affiche PatientActions
```

**Chemin B — Agent (summary envoyé par text stream) :**
```
LiveKit émet "participant_disconnected"
        │
        ▼
Agent reçoit l'événement → generate_summary()
  └─ Source 1 : profil patient + wearable data (chargés au démarrage)
  └─ Source 2 : données accumulées pendant l'appel
     (_alert_level, _actions[], _reimbursement_discussed)
  └─ Source 3 : Mistral analyse le transcript de conversation
     → pain_level, mood, general, summary, medication_compliance
        │
        ▼
Agent envoie via: room.local_participant.send_text(
    json.dumps(summary), topic="call-summary"
)
```

### 6. Chat médecin post-appel (Frontend ↔ Mistral)

```
Patient clique "Start chat" sur PatientActions
        │
        ▼
DoctorChat.tsx s'ouvre
        │
        ▼
POST /api/doctor-chat avec :
  - messages: [{ role: "user", content: "[instruction de greeting]" }]
  - patientName, callSummary (texte du résumé), language
        │
        ▼
/api/doctor-chat injecte un system prompt :
  "Tu es Dr. Claire Morel. Résumé de l'appel : [callSummary].
   Chaleureuse, concise, 2-3 phrases max."
        │
        ▼
Mistral Small génère la réponse du médecin
        │
        ▼
DoctorChat affiche la réponse dans un chat iMessage-style
        │
        ▼
Patient tape un message → POST /api/doctor-chat (avec historique)
→ Mistral répond → affiché → etc.
```

---

## Fichiers du projet

```
agent/
├── agent.py           ← Orchestrateur : AgentSession, 15 tools, greeting, summary, auto-hangup
├── playbook.py        ← Playbook texte + builder qui injecte le contexte patient
├── tools.py           ← load_patient, get_reimbursement_info (Linkup), get_wearable_data (Thryve)
├── patients.json      ← 3 profils patients (Sophie, Marc, Lea) avec données médicales complètes
├── requirements.txt   ← Dépendances Python
├── Dockerfile         ← Python 3.13 slim, pre-cache Silero VAD
├── livekit.toml       ← Config LiveKit
└── .env.example       ← Template des variables d'environnement

frontend/
├── app/
│   ├── page.tsx                    ← Page principale : Home → Call flow (Sophie par défaut)
│   ├── layout.tsx                  ← Root layout
│   ├── globals.css                 ← Styles globaux + animations
│   └── api/
│       ├── token/route.ts          ← JWT LiveKit avec patient_id + language
│       ├── summarize/route.ts      ← Analyse transcript → CallSummary via Mistral
│       ├── doctor-chat/route.ts    ← Dr. Claire Morel (Mistral) avec contexte appel
│       └── translate/route.ts      ← Traduction JSON dynamique FR↔EN via Mistral
├── components/
│   ├── AlanHomeScreen.tsx          ← Écran d'accueil : profil patient + déclencheur appel
│   ├── CallInterface.tsx           ← Appel actif : LiveKit, transcription, CTAs, alertes, maps
│   ├── PatientActions.tsx          ← Récap patient post-appel : CTAs, médecin, médicaments
│   ├── Dashboard.tsx               ← Vue équipe soins : résumé structuré
│   ├── DoctorChat.tsx              ← Chat texte avec Dr. Claire Morel (Mistral)
│   ├── PhoneFrame.tsx              ← Wrapper iPhone pour toutes les vues
│   ├── PhoneNotification.tsx       ← Animation appel entrant
│   ├── PatientSelector.tsx         ← Sélecteur de patient (non utilisé dans le flow par défaut)
│   ├── LanguageSelector.tsx        ← Toggle FR/EN
│   ├── AlanIcons.tsx               ← Icônes SVG custom
│   └── AlanLogo.tsx                ← Logo Alan
├── lib/
│   ├── types.ts                    ← Contrats de données (CallSummary, LiveCTA, etc.)
│   ├── patients.ts                 ← Profils patients pour le frontend
│   └── i18n.tsx                    ← Système i18n FR/EN (React context + dictionnaires)
└── public/
    └── maude.png                   ← Avatar de Maude
```

---

## APIs externes

| API | Auth | Utilisé par | Fallback si down |
|-----|------|-------------|-----------------|
| **Mistral** (STT + LLM) | `MISTRAL_API_KEY` env var | agent.py (via plugin LiveKit) | Aucun (critique) |
| **Mistral** (extraction provider) | `MISTRAL_API_KEY` env var | agent.py `find_nearby_provider` | Regex extraction |
| **Mistral** (summary, doctor chat, translate) | `MISTRAL_API_KEY` env var | frontend /api/* routes | Fallback generics |
| **ElevenLabs** (TTS) | `ELEVEN_API_KEY` env var | agent.py (via plugin LiveKit) | Aucun (critique) |
| **Linkup** (recherche web) | `LINKUP_API_KEY` env var | agent.py tools + tools.py | Mock data (12 procédures, données wearable) |
| **Thryve QA** (wearables) | Dual Basic Auth (4 env vars) | tools.py | Mock data pour les 3 patients |
| **LiveKit Cloud** (WebRTC) | Auto-injecté en cloud | agent.py + frontend | Aucun (critique) |

### Thryve API — détails d'auth

L'API QA Thryve utilise un double système Basic Auth (non standard) :

```
POST https://api-qa.thryve.de/v5/dailyDynamicValues
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(THRYVE_WEB_USER:THRYVE_WEB_PASSWORD)
AppAuthorization: Basic base64(THRYVE_APP_AUTH_ID:THRYVE_APP_AUTH_SECRET)

Body (form-urlencoded) :
  authenticationToken = endUserId du sandbox
  startDay / endDay = YYYY-MM-DD
  valueTypes = 1000,2000,3001 (steps, sleep, resting HR)
  displayTypeName = true
  detailed = true
```

Biomarkers utilisés : Steps (1000), SleepDuration (2000, en minutes), RestingHR (3001).
L'agent fetch 7 jours (current) et 30 jours (baseline) pour calculer les trends.

---

## Stack technique — audit complet (10 avril 2026)

### Agent Python

| Package | Version | Rôle |
|---------|---------|------|
| livekit-agents | 1.5.2 | Framework agent + orchestration |
| livekit-plugins-mistralai | 1.5.2 | STT (Voxtral Mini) + LLM (Mistral Small 4) |
| livekit-plugins-elevenlabs | 1.5.2 | TTS — Jessica voice, Flash v2.5 (~75ms TTFB) |
| livekit-plugins-silero | 1.5.2 | VAD (Voice Activity Detection) |
| livekit-plugins-turn-detector | 1.5.2 | Multilingual turn detection |
| linkup-sdk | 0.13.0+ | Recherche web async |
| mistralai | 2.3.2 | API directe Mistral (extraction noms providers) |
| httpx | 0.23.0+ | Client HTTP async (Thryve API) |
| python-dotenv | 1.0.0+ | Chargement .env |

### Frontend npm

| Package | Version | Rôle |
|---------|---------|------|
| next | 15.5.15 | Framework React (CVE-2026-23869 fixé) |
| @livekit/components-react | ^2.9.20 | Hooks : useVoiceAssistant, useTextStream, BarVisualizer |
| @livekit/components-styles | ^1.2.0 | Styles composants LiveKit |
| livekit-client | ^2.18.1 | Client WebRTC |
| livekit-server-sdk | ^2.15.1 | Génération tokens côté serveur |
| react / react-dom | ^19.0.0 | UI |
| tailwindcss | ^4 | CSS |
| tslib | ^2.6.2 | Peer dep LiveKit React |

### Hooks et composants React LiveKit

| Export | Status | Usage |
|--------|--------|-------|
| `useVoiceAssistant()` | @beta | `{ state, audioTrack, videoTrack, agentTranscriptions }` |
| `useTextStream(topic)` | @beta | Reçoit CTAs + alertes sur "live-updates", summary sur "call-summary" |
| `BarVisualizer` | @beta | Visualiseur audio pendant l'appel |
| `LiveKitRoom` | stable | Connexion WebRTC |
| `RoomAudioRenderer` | stable | Rendu audio de l'agent |
| `VideoTrack` | stable | Rendu vidéo avatar (si disponible) |

### Modèles AI

| Type | ID | Provider | Détails |
|------|----|----------|---------|
| STT | `voxtral-mini-transcribe-realtime-2602` | Mistral | Streaming, 4B params, <500ms |
| LLM | `mistral-small-latest` → Mistral Small 4 | Mistral | 119B MoE, function calling natif |
| TTS | Jessica (`cgSgspJ2msm6clMCkdW9`) / `eleven_flash_v2_5` | ElevenLabs | ~75ms TTFB, 32 langues |
| Provider extraction | `mistral-small-latest` | Mistral | JSON extraction de résultats Linkup |
| Summary analysis | `mistral-small-latest` | Mistral | Analyse transcript → patient_state + compliance |
| Doctor chat | `mistral-small-latest` | Mistral | Dr. Claire Morel avec contexte appel |
| Translation | `mistral-small-latest` | Mistral | Traduction JSON dynamique FR↔EN |
