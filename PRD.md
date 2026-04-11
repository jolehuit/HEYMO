# Product Requirements Document — HeyMo

## 1. Problem

A patient leaves a doctor's office. Ten minutes later, they've forgotten half of what was said. Nobody calls them back to check if they're taking their medication, if they've booked their follow-up, or if they're experiencing complications.

Alan has automated 100,000+ chat conversations with a 4.5/5 CSAT. Their next declared priority is **automating phone-based customer support** (stated in their March 2026 Medium article). This project is a prototype of that vision.

## 2. Solution

A **proactive voice AI agent** ("Maude") that calls Alan members after a health event to:
- Check on their recovery and symptoms
- Verify medication compliance
- Remind them of upcoming follow-up appointments
- Correlate wearable health data with clinical context
- Provide real-time reimbursement information
- Search for nearby pharmacies and healthcare providers
- Detect warning signs and escalate when needed
- Enable post-call text chat with a doctor who has the full call context

## 3. What is a playbook?

A playbook is a **set of instructions in plain English** that tells the AI agent how to behave
during a call. It's the same concept as the scripts that human call center agents follow — but
for an AI. Alan uses playbooks in production for their chat automation (it increased their
automation rate from 20% to 40%).

The playbook defines:
- **Tone and style** — warm, professional, concise. Like a smart friend at Alan. Not a doctor, not a therapist.
- **Conversation structure** — opening (doctor name + specific question) → react with wearable data → medications → appointments → closing
- **Response pattern** — `[short reaction] + [one info] + [question using health data]`. Every turn ends with a question. Never 2 messages without a patient response.
- **When to use tools** — call tools immediately when relevant: pharmacy search, reimbursement, flag_alert + connect_with_doctor for any pain/symptom
- **CTA behavior** — tools show buttons on screen. Agent says "I'm showing that on your screen. You can tap it after our call." Never "I'll send you an SMS" or "I'm connecting you with a doctor."
- **When to escalate** — any pain/symptom → flag_alert + connect_with_doctor. Urgent → "Call 15 now."
- **Absolute rules** — never diagnose, never prescribe, never invent capabilities, never say "dans l'app" (say "à l'écran"), never mix languages
- **Banned phrases** — "I understand", "I'm sorry to hear that", "Let me see", "I hear you", empathy speeches
- **Pacing** — 3 turns max after greeting, each ending with a data-driven question, then close

The playbook lives in `agent/playbook.py` as a plain text variable. The non-tech teammate
writes and refines it. No code knowledge needed — just edit the English text.

## 4. User flow

The app opens on Sophie Martin's profile (default patient, no selection screen).

### During the call — Patient view

The agent calls. The user answers and has a voice conversation with Maude.
Live CTAs appear on screen as the agent calls tools (pharmacy map, doctor chat button, reimbursement breakdown).
A real Google Maps modal pops up when a nearby provider is found.
Both sides of the conversation are transcribed live (agent via LiveKit, user via browser Speech Recognition).

### After the call — Two post-call screens

**Screen 1: Patient Actions** — Personalized recap for the patient.
Shows Maude's summary, all CTAs from the call (doctor chat, provider maps, reimbursement, appointments, medications).
Patient can tap "Start chat" to text with Dr. Claire Morel (Mistral-powered) who has the full call context.

**Screen 2: Dashboard** — Care team view.
Structured summary: alert level, patient state (pain, mood, general), medication compliance, wearable trends, actions taken, reimbursement discussed. Accessed via a link from the Patient Actions screen.

```
App opens → AlanHomeScreen (Sophie Martin)
    ↓
"Start Call" → incoming call animation (PhoneNotification)
    ↓
Accept call → LiveKit connects (10-20s cold start)
    ↓
┌──────────────────────────────────────────────────┐
│  ACTIVE CALL — voice conversation with Maude     │
│  iPhone frame (PhoneFrame)                       │
│  Maude avatar + audio visualizer (BarVisualizer) │
│  Live transcription (agent + user)               │
│  Live CTAs (pharmacy, doctor, reimbursement)     │
│  Live alerts (orange/red banners)                │
│  Google Maps modal for provider results          │
│  Auto-hangup after 3 minutes                     │
└──────────────────────────────────────────────────┘
    ↓
"End Call" → /api/summarize (Mistral analysis)
    ↓
┌──────────────────────────────────────────────────┐
│  PATIENT ACTIONS — personalized recap            │
│  Maude's summary of the call                     │
│  Doctor chat button → DoctorChat (Mistral)       │
│  Provider cards with Google Maps embeds          │
│  Reimbursement breakdown                         │
│  Scheduled actions (appointments, callbacks)     │
│  Active medications with dosage details          │
│  Alan services (teleconsult, map, claims)        │
└──────────────────────────────────────────────────┘
    ↓
"Full report" link
    ↓
┌──────────────────────────────────────────────────┐
│  DASHBOARD — care team view                      │
│  Alert level (green/orange/red)                  │
│  Patient state: pain, mood, general              │
│  Medication compliance per drug                  │
│  Wearable trends: HR, sleep, steps vs baseline   │
│  All actions taken during call                   │
│  Reimbursement discussed                         │
└──────────────────────────────────────────────────┘
```

## 5. Patient Profiles

### Sophie Martin (42, Alan Blue) — default
- **Event:** Right knee arthroscopy — March 26, 2026
- **Doctor:** Dr. Girard (surgeon), Clinique du Sport Paris
- **Medications:** Ketoprofen 100mg (completed), Lovenox 4000 IU (7 days left)
- **Follow-up:** Surgeon before April 25 — not booked
- **Wearable:** Elevated HR (78 vs 65 baseline), declining sleep (5.5h vs 7.2h), low activity (2100 vs 8500 steps)
- **Risk:** Post-surgery HR elevation + sleep deficit
- **Location:** Paris 15e

### Marc Dubois (58, Alan Green)
- **Event:** Type 2 diabetes follow-up — April 2, 2026
- **Doctor:** Dr. Laurent Moreau, Endocrinologist
- **Medications:** Metformin, Jardiance, Atorvastatin (all 30-45 days left)
- **Follow-up:** Blood test (HbA1c) before May 15, consult May 20 — booked
- **Wearable:** Stable HR (72 vs 70), stable sleep (6.8h vs 7.0h), slightly reduced activity (5200 vs 6000 steps)
- **Risk:** Low (chronic condition management)

### Lea Chen (31, Alan Blue)
- **Event:** Pregnancy check-up (22 weeks) — April 5, 2026
- **Doctor:** Dr. Marie Lefevre, OB-GYN
- **Medications:** Prenatal vitamins (Gynefam Plus), Iron (Tardyferon 80mg)
- **Follow-up:** Morphology ultrasound before April 20, glucose test before April 30 — not booked
- **Wearable:** Elevated HR (82 vs 68, normal for pregnancy), declining sleep (6.2h vs 7.8h), reduced activity (4800 vs 9000 steps)
- **Risk:** Normal pregnancy patterns, but appointments need booking

## 6. Data Contracts

**Single source of truth:** `frontend/lib/types.ts`

### Call Summary (agent → frontend)
```typescript
interface CallSummary {
  patient_id: string;
  patient_name: string;
  date: string;
  duration_seconds: number;
  alert_level: "green" | "orange" | "red";
  summary: string;
  patient_state: { pain_level: string; mood: string; general: string };
  medications_status: MedicationStatus[];
  wearable_highlights: WearableHighlights;
  actions: Action[];
  reimbursement_discussed: ReimbursementInfo | null;
  escalated: boolean;
}
```

### Action
```typescript
interface Action {
  type: "appointment" | "followup_call" | "flag" | "sms_sent"
      | "teleconsultation_requested" | "doctor_connect" | "provider_search";
  description: string;
  status?: string;
  sms_sent?: boolean;
  scheduled_date?: string;
}
```

### Reimbursement Info (Linkup API → agent → frontend)
```typescript
interface ReimbursementInfo {
  procedure: string;
  average_price: number;
  secu_rate: number;
  secu_reimbursement: number;
  alan_reimbursement: number;
  out_of_pocket: number;
  direct_billing: boolean;
}
```

### Wearable Data (Thryve API → agent → frontend)
```typescript
interface WearableHighlights {
  resting_hr: { value: number; baseline: number; trend: string };
  sleep_hours: { value: number; baseline: number; trend: string };
  steps: { value: number; baseline: number; trend: string };
  risk_patterns: string[];
}
```

### Live Updates (agent → frontend, during call via text stream)
```typescript
interface LiveAlert {
  type: "alert";
  level: "orange" | "red";
  reason: string;
}

interface LiveCTA {
  type: "cta";
  id?: string;        // for deduplication — replace existing CTA with same id
  action: "reimbursement" | "appointment" | "provider" | "teleconsultation" | "doctor_connect";
  label: string;
  data?: Record<string, unknown>;
}
```

CTAs are sent via `room.local_participant.send_text(json, topic="live-updates")` and received via `useTextStream("live-updates")`. CTAs with the same `id` replace the previous version (used for loading → loaded transitions).

## 7. Function Tools (agent)

The LLM calls these during conversation. Each tool can send CTAs to the frontend in real-time.

| Tool | CTA? | Purpose |
|------|------|---------|
| `get_reimbursement_info(procedure)` | Yes | Linkup API → sécu rate + Alan complementary → out-of-pocket |
| `get_wearable_insights()` | No | Returns patient's wearable data (HR, sleep, steps) |
| `flag_alert(level, reason)` | Yes (alert banner) | Marks concerning symptoms, shows alert on screen |
| `schedule_followup(description, days)` | Yes | Shows appointment CTA |
| `find_nearby_provider(specialty)` | Yes (map) | Linkup API + Mistral extraction → pharmacy/doctor card with Google Maps |
| `request_teleconsultation()` | Yes | Shows teleconsultation button (if included in plan) |
| `connect_with_doctor(reason)` | Yes | Shows doctor chat button with full conversation context |
| `send_sms_reminder(message)` | No | Simulated SMS (logged as action) |
| `get_patient_context()` | No | Returns safe patient profile |
| `get_side_effects(medication)` | No | Linkup search for medication side effects |
| `check_drug_interactions(med1, med2)` | No | Linkup search for interactions |
| `get_procedure_price(procedure)` | No | Linkup search for prices |
| `get_condition_info(condition)` | No | Linkup search for recovery info |
| `get_alan_coverage_details(topic)` | No | Linkup search for Alan plan coverage |
| `search_health_info(query)` | No | General Linkup health search (last resort) |

## 8. Hackathon Partners

| Partner | Role | Integration |
|---------|------|-------------|
| **Mistral** | Brain + Ears | Voxtral STT (realtime streaming), Mistral Small 4 (LLM + function calling + provider extraction + summary analysis) |
| **ElevenLabs** | Voice | TTS — Jessica voice (Flash v2.5 model, ~75ms TTFB, 32 languages) |
| **Linkup** | Search | Web search API for reimbursement, pharmacies, providers, side effects, prices, health info |
| **Thryve** | Wearable health data | QA sandbox API — heart rate, sleep, activity from Fitbit/Apple Watch/Garmin |
| **LiveKit** | Voice infrastructure | WebRTC rooms, agent hosting, text streams for CTAs/alerts/summary |

## 9. Tech Stack (verified April 10, 2026)

### Agent (Python)

| Package | Version | Purpose |
|---------|---------|---------|
| livekit-agents | 1.5.2 | Agent framework + orchestration |
| livekit-plugins-mistralai | 1.5.2 | STT (Voxtral Mini) + LLM (Mistral Small 4) |
| livekit-plugins-elevenlabs | 1.5.2 | TTS — Jessica voice, Flash v2.5 |
| livekit-plugins-silero | 1.5.2 | Voice Activity Detection (VAD) |
| livekit-plugins-turn-detector | 1.5.2 | Multilingual turn detection |
| linkup-sdk | 0.13.0+ | Async web search API |
| mistralai | 2.3.2 | Direct Mistral API (provider name extraction from Linkup results) |
| httpx | 0.23.0+ | Async HTTP client (Thryve API) |
| python-dotenv | 1.0.0+ | Environment variable loading |

### AI Models

| Type | Model | Provider | Details |
|------|-------|----------|---------|
| STT | `voxtral-mini-transcribe-realtime-2602` | Mistral | Streaming realtime, 4B params, <500ms latency |
| LLM | `mistral-small-latest` (Mistral Small 4) | Mistral | 119B MoE, native function calling |
| TTS | Jessica (`cgSgspJ2msm6clMCkdW9`) | ElevenLabs | Flash v2.5, ~75ms TTFB, FR+EN |

### Frontend (TypeScript)

| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.5.15 | React framework |
| react / react-dom | ^19.0.0 | UI library |
| @livekit/components-react | ^2.9.20 | Voice hooks (`useVoiceAssistant`, `useTextStream`, `BarVisualizer`) |
| @livekit/components-styles | ^1.2.0 | Component styles |
| livekit-client | ^2.18.1 | WebRTC client |
| livekit-server-sdk | ^2.15.1 | Server-side token generation |
| tailwindcss | ^4 | CSS framework |
| tslib | ^2.6.2 | Peer dep of LiveKit React |

### Frontend API Routes

| Route | Purpose | Model |
|-------|---------|-------|
| `POST /api/token` | Generate LiveKit JWT with patient_id + language in attributes | — |
| `POST /api/summarize` | Analyze call transcript → structured CallSummary JSON | Mistral Small |
| `POST /api/doctor-chat` | Dr. Claire Morel chat with call context | Mistral Small |
| `POST /api/translate` | Translate dynamic JSON content (FR↔EN) | Mistral Small |

### Deployment

| Component | Platform | Cost |
|-----------|----------|------|
| Agent | LiveKit Cloud | Free tier (1000 min/month) |
| Frontend | Vercel | Free |
| WebRTC | LiveKit Cloud | Included |

## 10. Known Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cold start 10-20s | Medium | Loading animation + avatar pulse in frontend |
| Linkup may not return structured reimbursement data | Medium | Hardcoded fallback with 12 common procedures |
| Linkup provider search may return unstructured text | Medium | Mistral Small extracts name/address/phone; regex fallback if that fails |
| Thryve QA sandbox requires dual Basic Auth | Low | Full auth implemented; mock fallback for all 3 patients |
| `useTextStream` and `BarVisualizer` are `@beta` | Low | Stable in practice, used by LiveKit themselves |
| `mistralai` 2.3.2 active development (3 releases/week) | Low | Pin version if needed |
| Browser Speech Recognition not available everywhere | Low | Graceful fallback — user transcript just won't show |

## 11. Non-Goals

- No real SMS sending (simulated, logged as action)
- No database (all data in JSON files + LiveKit text streams + Mistral API calls)
- No user authentication
- No call recording
- No real appointment booking system (CTAs show info, patient books themselves)
- No real doctor connection (Dr. Claire Morel is Mistral-powered AI)
