# Product Requirements Document — Alan Care Call

## 1. Problem

A patient leaves a doctor's office. Ten minutes later, they've forgotten half of what was said. Nobody calls them back to check if they're taking their medication, if they've booked their follow-up, or if they're experiencing complications.

Alan has automated 100,000+ chat conversations with a 4.5/5 CSAT. Their next declared priority is **automating phone-based customer support** (stated in their March 2026 Medium article). This project is a prototype of that vision.

## 2. Solution

A **proactive voice AI agent** that calls Alan members after a health event to:
- Check on their recovery and symptoms
- Verify medication compliance
- Remind them of upcoming follow-up appointments
- Correlate wearable health data with clinical context
- Provide real-time reimbursement information
- Detect warning signs and escalate when needed

## 3. User Flow

```
1. Judge opens the URL
2. Sees 3 patient profiles → picks one
3. Clicks "Start Call" → waits 10-20s (agent cold start)
4. Agent greets by name, references their recent health event
5. Natural voice conversation (1-3 minutes)
6. Judge clicks "End Call"
7. Dashboard appears with structured summary:
   - Patient state, medications, wearable data
   - Alerts, reimbursement info, next steps
```

## 4. Patient Profiles

### Sophie Martin (42, Alan Blue)
- **Event:** Right knee arthroscopy — March 26, 2026
- **Medications:** Ketoprofen (completed), Lovenox (7 days left)
- **Follow-up:** Surgeon before April 25 — not booked
- **Wearable:** Elevated HR (78 vs 65 baseline), declining sleep (5.5h vs 7.2h), low activity (2100 vs 8500 steps)
- **Risk:** Post-surgery HR elevation + sleep deficit

### Marc Dubois (58, Alan Green)
- **Event:** Type 2 diabetes follow-up — April 2, 2026
- **Medications:** Metformin, Jardiance, Atorvastatin (all 30-45 days left)
- **Follow-up:** Blood test before May 15, consult May 20 — booked
- **Wearable:** Stable HR, stable sleep, slightly reduced activity
- **Risk:** Low (chronic condition management)

### Lea Chen (31, Alan Blue)
- **Event:** Pregnancy check-up (22 weeks) — April 5, 2026
- **Medications:** Prenatal vitamins, iron supplement
- **Follow-up:** Morphology ultrasound before April 20, glucose test before April 30 — not booked
- **Wearable:** Elevated HR (82 vs 68, normal for pregnancy), declining sleep, reduced activity
- **Risk:** Normal pregnancy patterns, but appointments need booking

## 5. Data Contracts

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

### Live Alert (agent → frontend, during call)
```typescript
interface LiveAlert {
  type: "alert";
  level: "orange" | "red";
  reason: string;
}
```

## 6. Hackathon Partners

| Partner | Role | Integration |
|---------|------|-------------|
| **Mistral** | Brain + Voice | Voxtral STT (realtime streaming), Mistral Small 4 (LLM + function calling), Voxtral TTS |
| **Linkup** | Reimbursement data | Web search API for French social security rates |
| **Thryve** | Wearable health data | Sandbox API — heart rate, sleep, activity from Fitbit/Apple Watch/Garmin |
| **LiveKit** | Voice infrastructure | WebRTC rooms, agent hosting, text streams |

## 7. Tech Stack (verified April 10, 2026)

### Agent (Python)

| Package | Version | Verified |
|---------|---------|----------|
| livekit-agents | 1.5.2 (April 8) | ✅ Latest on PyPI |
| livekit-plugins-mistralai | 1.5.2 (April 8) | ✅ STT/TTS/LLM confirmed |
| livekit-plugins-silero | 1.5.2 (April 8) | ✅ VAD.load() works |
| livekit-plugins-turn-detector | 1.5.2 (April 8) | ✅ MultilingualModel works |
| linkup-sdk | 0.13.0 | ✅ async_search() verified |
| mistralai | 2.3.2 (April 10) | ✅ Released today |

### Frontend (TypeScript)

| Package | Version | Verified |
|---------|---------|----------|
| next | 15.5.15 | ✅ CVE-2026-23869 fixed |
| @livekit/components-react | ^2.9.20 | ✅ Latest, hooks verified |
| livekit-client | ^2.18.1 | ✅ Latest |
| livekit-server-sdk | ^2.15.1 | ✅ Latest |
| react | ^19.0.0 | ✅ |
| tailwindcss | ^4 | ✅ |
| tslib | ^2.6.2 | ✅ Peer dep of LiveKit React |

### Mistral Models (verified from plugin source)

| Type | Model ID | Status |
|------|----------|--------|
| STT | `voxtral-mini-transcribe-realtime-2602` | ✅ Listed in STTModels |
| LLM | `mistral-small-latest` → Mistral Small 4 | ✅ Listed in ChatModels |
| TTS | Voice `en_paul_confident` | ✅ Listed in TTSVoices (1 of 28) |

### Deployment

| Component | Platform | Cost |
|-----------|----------|------|
| Agent | LiveKit Cloud | Free tier (1000 min/month) |
| Frontend | Vercel | Free |
| WebRTC | LiveKit Cloud | Included |

## 8. Known Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cold start 10-20s | Medium | Loading animation in frontend + warm-up call before demo |
| Voxtral TTS voice quality unknown | Medium | Test tonight, 28 voices available as alternatives |
| Linkup may not return structured reimbursement data | Medium | Hardcoded fallback with 12 common procedures |
| Thryve API docs unavailable until Saturday morning | Low | Hardcoded fallback data for all 3 patients |
| `useTextStream` is @beta | Low | Verified it exists and works, used by LiveKit themselves |
| Network issues at hackathon | Low | 4G hotspot backup |

## 9. Non-Goals

- No real SMS sending (simulated)
- No database (all data in JSON files + LiveKit text streams)
- No user authentication
- No multi-language support (English only for demo)
- No call recording
- No real appointment booking system
