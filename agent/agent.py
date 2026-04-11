"""
Maude — Voice AI Agent for Alan health follow-up calls

Run locally:  uv run agent.py dev
Deploy:       lk agent create --secrets MISTRAL_API_KEY=xxx,ELEVEN_API_KEY=xxx,LINKUP_API_KEY=xxx
"""

import asyncio
import json
import logging
import os
from datetime import datetime

FRENCH_MONTHS = [
    "", "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]


def format_date_fr(iso_date: str) -> str:
    """'2026-03-26' → '26 mars'"""
    d = datetime.strptime(iso_date, "%Y-%m-%d")
    return f"{d.day} {FRENCH_MONTHS[d.month]}"


ENGLISH_MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def format_date_en(iso_date: str) -> str:
    """'2026-03-26' → 'March 26th'"""
    d = datetime.strptime(iso_date, "%Y-%m-%d")
    day = d.day
    suffix = "th" if 11 <= day <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
    return f"{ENGLISH_MONTHS[d.month]} {day}{suffix}"


MAX_CALL_DURATION = 180  # 3 minutes max for demo

from dotenv import load_dotenv
load_dotenv()

from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RoomInputOptions,
    RunContext,
    cli,
    function_tool,
)
from livekit.agents import room_io
from livekit.plugins import elevenlabs, mistralai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Avatar image — hosted in the repo (frontend/public/maude.png)
AVATAR_IMAGE_URL = "https://raw.githubusercontent.com/jolehuit/HEYMO/claude/voice-ai-health-followup-YTtvx/frontend/public/maude.png"

from playbook import build_system_prompt
from tools import load_patient, get_wearable_data

logger = logging.getLogger("heymo-agent")
logger.setLevel(logging.INFO)


# ==========================================================================
# PREWARM — loads models once at startup (Dev 1)
# ==========================================================================

def prewarm(proc: JobProcess):
    """Pre-load Silero VAD model at worker startup for faster cold starts."""
    proc.userdata["vad"] = silero.VAD.load()


# ==========================================================================
# AGENT CLASS (Dev 1 + Dev 2)
#
# Dev 1: owns the class structure, session config, lifecycle
# Dev 2: owns the @function_tool implementations
# ==========================================================================

class AlanHealthAgent(Agent):
    """Alan health follow-up voice agent."""

    def __init__(self, patient: dict, wearable_data: dict, lang: str = "en"):
        self._patient = patient
        self._wearable_data = wearable_data
        self._call_start = datetime.now()
        self._alert_level = "green"
        self._actions: list[dict] = []
        self._reimbursement_discussed: dict | None = None
        self._room = None  # Set in entrypoint after agent creation
        self._lang = lang

        instructions = build_system_prompt(patient, wearable_data, language=lang)
        super().__init__(instructions=instructions)

    # ------------------------------------------------------------------
    # CTA HELPER — sends live call-to-action cards to the frontend
    # ------------------------------------------------------------------

    async def _send_cta(self, action: str, label: str, data: dict | None = None, cta_id: str | None = None):
        """Send a call-to-action card to the frontend during the call.
        If cta_id is provided, the frontend should replace any existing CTA with the same id."""
        if self._room:
            cta: dict = {"type": "cta", "action": action, "label": label}
            if cta_id:
                cta["id"] = cta_id
            if data:
                cta["data"] = data
            await self._room.local_participant.send_text(
                json.dumps(cta), topic="live-updates",
            )

    # ------------------------------------------------------------------
    # FUNCTION TOOLS (Dev 2)
    #
    # These are called by the LLM during conversation.
    # The decorator exposes the function name + docstring to the LLM.
    # The LLM decides when to call them based on conversation context.
    #
    # Each tool MUST return a string (the LLM reads the return value).
    # ------------------------------------------------------------------

    @function_tool
    async def get_reimbursement_info(
        self,
        context: RunContext,
        procedure: str,
    ) -> str:
        """Look up reimbursement information for a medical procedure.
        Returns how much social security covers, how much Alan covers,
        and the patient's out-of-pocket cost.

        Args:
            procedure: The medical procedure to look up, e.g. 'specialist_consultation',
                      'physiotherapy', 'blood_test', 'ultrasound', 'mri'
        """
        label = f"Remboursement {procedure}" if self._lang == "fr" else f"Reimbursement — {procedure}"
        cta_id = f"reimb-{procedure}"
        await self._send_cta("reimbursement", label, {"description": "..."}, cta_id=cta_id)
        from tools import get_reimbursement_info
        result = await get_reimbursement_info(procedure, self._patient)
        self._reimbursement_discussed = result
        oop = result.get("out_of_pocket", "?")
        desc = f"Reste à charge : {oop}€" if self._lang == "fr" else f"Out of pocket: {oop}€"
        await self._send_cta("reimbursement", label, {
            **result,
            "description": desc,
            "procedure": procedure,
        }, cta_id=cta_id)
        return json.dumps(result, indent=2)

    @function_tool
    async def get_wearable_insights(self, context: RunContext) -> str:
        """Get the patient's wearable health data from the past 7 days.
        Includes heart rate, sleep, activity levels, and detected risk patterns."""
        # Dev2: Real Thryve API integration done in tools.py (with mock fallback)
        return json.dumps(self._wearable_data, indent=2)

    @function_tool
    async def flag_alert(
        self,
        context: RunContext,
        level: str,
        reason: str,
    ) -> str:
        """Flag the call with an alert level when concerning symptoms are detected.

        Args:
            level: Alert level - 'orange' for concerning, 'red' for urgent
            reason: Brief description of why the alert was raised
        """
        self._alert_level = level
        self._actions.append({"type": "flag", "description": reason})
        logger.warning(f"ALERT [{level}]: {reason} for {self._patient['name']}")

        if self._room:
            await self._room.local_participant.send_text(
                json.dumps({"type": "alert", "level": level, "reason": reason}),
                topic="live-updates",
            )

        return f"Alert flagged as {level}: {reason}"

    @function_tool
    async def schedule_followup(
        self,
        context: RunContext,
        description: str,
        days_from_now: int,
    ) -> str:
        """Schedule a follow-up action for the patient.

        Args:
            description: What the follow-up is for
            days_from_now: Number of days from now to schedule the follow-up
        """
        from datetime import timedelta
        scheduled_date = (datetime.now() + timedelta(days=days_from_now)).strftime("%Y-%m-%d")
        self._actions.append({
            "type": "followup_call",
            "description": description,
            "scheduled_date": scheduled_date,
        })
        label = f"RDV {scheduled_date}" if self._lang == "fr" else f"Appt. {scheduled_date}"
        await self._send_cta("appointment", label, {"description": description})
        return f"Follow-up scheduled for {scheduled_date}: {description}"

    @function_tool
    async def send_sms_reminder(
        self,
        context: RunContext,
        message: str,
    ) -> str:
        """Send an SMS reminder to the patient. Use this to send appointment
        reminders, medication reminders, or follow-up instructions.

        Args:
            message: The text message to send to the patient
        """
        # Simulated SMS — in production, this would call an SMS gateway
        self._actions.append({
            "type": "sms_sent",
            "description": f"SMS to {self._patient['name']}: {message}",
        })
        logger.info(f"SMS sent to {self._patient['name']}: {message}")
        return f"SMS reminder sent to {self._patient['name']}: {message}"

    @function_tool
    async def get_patient_context(self, context: RunContext) -> str:
        """Get the full patient profile including medical history, medications,
        insurance plan, and upcoming appointments. Use this when you need
        detailed patient information to answer a question."""
        safe_patient = {
            "name": self._patient["name"],
            "age": self._patient["age"],
            "plan": self._patient["plan"],
            "location": self._patient.get("location", "unknown"),
            "recent_event": self._patient["recent_event"],
            "medications": self._patient["medications"],
            "contract": self._patient["contract"],
        }
        return json.dumps(safe_patient, indent=2)

    @function_tool
    async def find_nearby_provider(
        self,
        context: RunContext,
        specialty: str,
    ) -> str:
        """Search for a nearby healthcare provider or specialist.
        Use this when the patient needs to book an appointment and wants
        help finding a doctor, specialist, or clinic.

        Args:
            specialty: The type of provider, e.g. 'orthopedic surgeon',
                      'endocrinologist', 'gynecologist', 'physiotherapist'
        """
        location = self._patient.get("location", "Paris")
        cta_id = f"provider-{specialty}"

        label = f"{specialty} — {location}"
        await self._send_cta("provider", label, {
            "description": "Recherche..." if self._lang == "fr" else "Searching...",
            "loading": True,
        }, cta_id=cta_id)

        linkup_api_key = os.environ.get("LINKUP_API_KEY")
        if linkup_api_key:
            try:
                from linkup import LinkupClient
                import re
                client = LinkupClient()
                if self._lang == "fr":
                    query = f"{specialty} {location} nom adresse exacte numéro téléphone"
                else:
                    query = f"{specialty} near {location} name exact address phone number"
                result = await client.async_search(
                    query=query, depth="standard",
                    output_type="sourcedAnswer", timeout=10.0,
                )
                self._actions.append({
                    "type": "provider_search",
                    "description": f"Searched for {specialty} in {location}",
                })
                answer = result.answer or ""
                # Extract address (number + street name)
                addr_match = re.search(r'\d{1,4}[\s,]+(?:rue|avenue|boulevard|place|passage|impasse|allée)[^,.]{5,60}', answer, re.IGNORECASE)
                address = addr_match.group(0).strip() if addr_match else location
                # Extract phone
                phone_match = re.search(r'(?:0[1-9][\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2})', answer)
                phone = phone_match.group(0).strip() if phone_match else None
                # Extract provider name
                name_match = re.search(r'(?:Pharmacie|Dr\.?|Cabinet|Clinique|Centre)[^\n,.]{3,50}', answer, re.IGNORECASE)
                provider_label = name_match.group(0).strip() if name_match else f"{specialty} — {location}"

                desc_parts = [address]
                if phone:
                    desc_parts.append(phone)
                await self._send_cta("provider", provider_label, {
                    "address": address,
                    "phone": phone,
                    "specialty": specialty,
                    "location": location,
                    "description": " · ".join(desc_parts),
                    "show_map": True,
                }, cta_id=cta_id)
                # Tell the LLM to speak in the right language
                return (
                    f"IMPORTANT: Tell the patient the EXACT name and address from the results below. "
                    f"Speak in {'French' if self._lang == 'fr' else 'English'}.\n"
                    f"Results:\n{answer}"
                )
            except Exception as e:
                logger.warning(f"Linkup provider search error: {e}")

        await self._send_cta("provider", f"{specialty} — {location}", {
            "address": location, "specialty": specialty,
            "location": location, "description": location,
        }, cta_id=cta_id)
        return f"No detailed results. {specialty} near {location} shown on screen."

    @function_tool
    async def request_teleconsultation(self, context: RunContext) -> str:
        """Request an Alan teleconsultation for the patient.
        Use this when the patient has concerning symptoms that need
        medical attention but are not an emergency, or when they
        want to speak to a doctor quickly."""
        if not self._patient["contract"].get("teleconsultation_included"):
            return "Unfortunately, teleconsultation is not included in your current Alan plan."

        self._actions.append({
            "type": "teleconsultation_requested",
            "description": f"Teleconsultation requested for {self._patient['name']}",
        })
        plan = self._patient['contract']['formula']
        if self._lang == "fr":
            label = "Téléconsultation"
            desc = f"Médecin sous 30 min · Inclus {plan}"
        else:
            label = "Teleconsultation"
            desc = f"Doctor within 30 min · Included in {plan}"
        await self._send_cta("teleconsultation", label, {"description": desc})
        plan = self._patient['contract']['formula']
        if self._lang == "fr":
            return f"Je vous affiche le bouton téléconsultation à l'écran. C'est inclus dans votre contrat {plan}."
        return f"I'm showing the teleconsultation button on your screen. It's included in your {plan} plan."

    @function_tool
    async def connect_with_doctor(
        self,
        context: RunContext,
        reason: str,
    ) -> str:
        """Connect the patient with a doctor in the app, sharing the full call context.
        The doctor will see the conversation summary and can start chatting with the patient.
        Use this when the patient needs medical advice, wants to discuss symptoms,
        or you recommend they speak with a healthcare professional.

        Args:
            reason: Brief reason for the consultation, e.g. 'post-surgery pain', 'medication side effects'
        """
        transcript_lines = []
        if self.session:
            for msg in self.session.history.messages():
                text = msg.text_content
                if msg.role in ("user", "assistant") and text:
                    speaker = self._patient["name"].split()[0] if msg.role == "user" else "Maude"
                    transcript_lines.append(f"{speaker}: {text}")

        call_context = "\n".join(transcript_lines[-10:])
        if self._lang == "fr":
            label = "Mise en relation médecin"
            desc = reason
        else:
            label = "Connect with doctor"
            desc = reason
        await self._send_cta("doctor_connect", label, {
            "patient_id": self._patient["patient_id"],
            "patient_name": self._patient["name"],
            "reason": reason,
            "call_context": call_context,
            "description": desc,
        })
        self._actions.append({
            "type": "doctor_connect",
            "description": f"Patient connected with doctor: {reason}",
        })

        if self._lang == "fr":
            return "Je vous affiche un bouton à l'écran pour échanger avec un médecin. Il aura tout le contexte de notre appel."
        return "I'm showing a button on your screen to chat with a doctor. They'll have our full call context."

    # ------------------------------------------------------------------
    # LINKUP HELPER
    # ------------------------------------------------------------------

    async def _linkup_search(self, query: str, fallback: str) -> str:
        """Helper: search Linkup API with fallback string."""
        linkup_api_key = os.environ.get("LINKUP_API_KEY")
        if linkup_api_key:
            try:
                from linkup import LinkupClient
                client = LinkupClient()
                result = await client.async_search(
                    query=query, depth="standard",
                    output_type="sourcedAnswer", timeout=10.0,
                )
                return result.answer
            except Exception as e:
                logger.warning(f"Linkup search error: {e}")
        return fallback

    # ------------------------------------------------------------------
    # LINKUP-POWERED TOOLS
    # ------------------------------------------------------------------

    @function_tool
    async def get_side_effects(
        self,
        context: RunContext,
        medication_name: str,
    ) -> str:
        """Look up common and serious side effects for a medication.
        Use when the patient asks about side effects or reports unusual symptoms.

        Args:
            medication_name: Name of the medication, e.g. 'Metformin', 'Ketoprofen', 'Lovenox'
        """
        fallback_effects = []
        for med in self._patient.get("medications", []):
            if medication_name.lower() in med["name"].lower():
                fallback_effects = med.get("side_effects_common", [])
                break
        fallback = f"Common side effects of {medication_name}: {', '.join(fallback_effects)}" if fallback_effects else f"Please consult your pharmacist about {medication_name} side effects."

        query = f"effets secondaires {medication_name} fréquents graves liste"
        return await self._linkup_search(query, fallback)

    @function_tool
    async def check_drug_interactions(
        self,
        context: RunContext,
        medication_1: str,
        medication_2: str,
    ) -> str:
        """Check for known interactions between two medications.
        Use when the patient takes multiple medications and asks about safety.

        Args:
            medication_1: First medication name
            medication_2: Second medication name
        """
        query = f"interaction médicamenteuse {medication_1} {medication_2} risques précautions"
        fallback = f"I don't have specific interaction data for {medication_1} and {medication_2}. Please consult your pharmacist or doctor to verify there are no contraindications."
        return await self._linkup_search(query, fallback)

    @function_tool
    async def get_procedure_price(
        self,
        context: RunContext,
        procedure: str,
    ) -> str:
        """Get the average price for a medical procedure in the patient's area.
        Use when the patient asks how much something costs before reimbursement.

        Args:
            procedure: The procedure, e.g. 'IRM genou', 'consultation dermatologue', 'échographie'
        """
        location = self._patient.get("location", "Paris")
        query = f"prix moyen {procedure} {location} tarif 2025"
        fallback = f"Average prices for {procedure} vary. Contact your provider for an exact quote, or I can look up the reimbursement details."
        return await self._linkup_search(query, fallback)

    @function_tool
    async def get_condition_info(
        self,
        context: RunContext,
        condition: str,
    ) -> str:
        """Get health information about a medical condition, recovery tips, or post-surgery care.
        Use when the patient asks about their condition, recovery timeline, or what to expect.

        Args:
            condition: The condition or topic, e.g. 'arthroscopy knee recovery',
                      'type 2 diabetes management', 'pregnancy second trimester'
        """
        query = f"{condition} conseils récupération patient recommandations"
        fallback = f"For specific advice on {condition}, I recommend discussing with your doctor at your next follow-up."
        return await self._linkup_search(query, fallback)

    @function_tool
    async def get_alan_coverage_details(
        self,
        context: RunContext,
        topic: str,
    ) -> str:
        """Look up details about the patient's Alan insurance coverage for a specific topic.
        Use when the patient asks what their Alan plan covers.

        Args:
            topic: The coverage topic, e.g. 'dental', 'optical', 'hospitalization',
                  'maternity', 'teleconsultation', 'mental health'
        """
        plan_name = self._patient["contract"]["formula"]
        query = f"Alan assurance {plan_name} garanties {topic} couverture 2025"
        fallback_info = json.dumps(self._patient["contract"], indent=2)
        fallback = f"Here's what I know about your {plan_name} plan:\n{fallback_info}\nFor detailed coverage on {topic}, check the Alan app or contact Alan support."
        return await self._linkup_search(query, fallback)

    @function_tool
    async def search_health_info(
        self,
        context: RunContext,
        query: str,
    ) -> str:
        """Search the web for health, medical, or insurance information.
        Use this as a LAST RESORT when no other tool can answer the patient's question.
        Examples: sick leave duration, vaccination schedules, administrative procedures,
        health regulations, or any medical topic not covered by other tools.

        Args:
            query: The search query in natural language, e.g. 'durée arrêt maladie après arthroscopie genou'
        """
        fallback = f"I couldn't find specific information about '{query}'. I recommend checking with your doctor or the Alan app for more details."
        return await self._linkup_search(query, fallback)


# ==========================================================================
# POST-CALL SUMMARY (Dev 1)
#
# Called when the participant disconnects.
# Builds the JSON that the frontend Dashboard displays.
# The format MUST match the CallSummary type in frontend/lib/types.ts
# ==========================================================================

async def generate_summary(agent: AlanHealthAgent) -> dict:
    """Generate a structured post-call summary using LLM analysis of the conversation."""
    duration = (datetime.now() - agent._call_start).total_seconds()

    # --- Build transcript from conversation history ---
    # session.history → ChatContext, .messages() → list[ChatMessage]
    # ChatMessage.text_content is a @property returning str | None
    # ChatRole is Literal['developer', 'system', 'user', 'assistant']
    transcript_lines = []
    for msg in agent.session.history.messages():
        text = msg.text_content
        if msg.role in ("user", "assistant") and text:
            speaker = agent._patient["name"].split()[0] if msg.role == "user" else "Maude"
            transcript_lines.append(f"{speaker}: {text}")

    transcript = "\n".join(transcript_lines)

    # --- Use LLM to analyze conversation ---
    patient_state = {"pain_level": "unknown", "mood": "unknown", "general": "discussed during call"}
    call_summary = f"Post-{agent._patient['recent_event']['type']} follow-up call."

    if transcript:
        try:
            from mistralai import Mistral

            client = Mistral(api_key=os.environ.get("MISTRAL_API_KEY"))
            response = await client.chat.complete_async(
                model="mistral-small-latest",
                messages=[{
                    "role": "user",
                    "content": (
                        "Analyze this health follow-up call transcript. "
                        "Extract the following in JSON:\n"
                        '- "pain_level": patient\'s pain (none / mild / moderate / severe / unknown)\n'
                        '- "mood": emotional state (positive / neutral / anxious / distressed / unknown)\n'
                        '- "general": one sentence on overall condition\n'
                        '- "summary": 1-2 sentence summary of the call\n'
                        '- "medication_compliance": object with medication names as keys and '
                        '"full" / "partial" / "none" / "unknown" as values\n\n'
                        f"Patient: {agent._patient['name']}, "
                        f"Event: {agent._patient['recent_event']['description']}\n\n"
                        f"Transcript:\n{transcript}\n\n"
                        "Respond with JSON only, no markdown."
                    ),
                }],
                response_format={"type": "json_object"},
            )
            analysis = json.loads(response.choices[0].message.content)
            patient_state = {
                "pain_level": analysis.get("pain_level", "unknown"),
                "mood": analysis.get("mood", "unknown"),
                "general": analysis.get("general", "discussed during call"),
            }
            call_summary = analysis.get("summary", call_summary)
            # Update medication compliance from LLM analysis
            llm_compliance = analysis.get("medication_compliance", {})
        except Exception as e:
            logger.error(f"LLM summary analysis failed, using defaults: {e}")
            llm_compliance = {}
    else:
        llm_compliance = {}

    # --- Build medication status ---
    meds_status = []
    for med in agent._patient["medications"]:
        compliance = llm_compliance.get(med["name"], "full")
        meds_status.append({
            "name": med["name"],
            "status": "completed" if med["remaining_days"] == 0 else "in_progress",
            "compliance": compliance,
            **({"remaining_days": med["remaining_days"]} if med["remaining_days"] > 0 else {}),
        })

    # --- Build wearable highlights ---
    wearable_highlights = {}
    if agent._wearable_data:
        wd = agent._wearable_data
        wearable_highlights = {
            "resting_hr": {"value": wd["heart_rate"]["current_resting_avg"], "baseline": wd["heart_rate"]["baseline_resting_avg"], "trend": wd["heart_rate"]["trend"]},
            "sleep_hours": {"value": wd["sleep"]["current_avg_hours"], "baseline": wd["sleep"]["baseline_avg_hours"], "trend": wd["sleep"]["trend"]},
            "steps": {"value": wd["activity"]["current_avg_steps"], "baseline": wd["activity"]["baseline_avg_steps"], "trend": wd["activity"]["trend"]},
            "risk_patterns": wd.get("risk_patterns", []),
        }

    return {
        "patient_id": agent._patient["patient_id"],
        "patient_name": agent._patient["name"],
        "date": datetime.now().strftime("%Y-%m-%d"),
        "duration_seconds": int(duration),
        "alert_level": agent._alert_level,
        "summary": call_summary,
        "patient_state": patient_state,
        "medications_status": meds_status,
        "wearable_highlights": wearable_highlights,
        "actions": agent._actions,
        "reimbursement_discussed": agent._reimbursement_discussed,
        "escalated": agent._alert_level in ("orange", "red"),
    }


# ==========================================================================
# ENTRYPOINT (Dev 1)
#
# This is called by LiveKit Cloud when a participant joins a room.
# Flow: connect → read patient_id → load data → start session → greet
# ==========================================================================

server = AgentServer()
server.setup_fnc = prewarm


@server.rtc_session()
async def entrypoint(ctx: JobContext):
    await ctx.connect()
    participant = await ctx.wait_for_participant()

    # --- Read patient selection + language from frontend ---
    patient_id = participant.attributes.get("patient_id", "sophie_martin")
    lang = participant.attributes.get("language", "en")  # "en" or "fr" — default "en" for testing
    logger.info(f"Starting call for patient: {patient_id}, language: {lang}")

    # --- Load patient data + wearable data ---
    patient = load_patient(patient_id)
    wearable_data = await get_wearable_data(patient_id, patient.get("thryve_user_id", ""))

    # --- Create agent with full context ---
    agent = AlanHealthAgent(patient=patient, wearable_data=wearable_data, lang=lang)
    agent._room = ctx.room

    # --- Configure voice pipeline ---
    # ElevenLabs TTS — Jessica (Playful, Bright, Warm) on Flash v2.5 (~75ms TTFB)
    # Flash v2.5 for all languages: lowest latency, 32 languages incl. French
    tts_voice_id = "cgSgspJ2msm6clMCkdW9"
    session = AgentSession(
        stt=mistralai.STT(model="voxtral-mini-transcribe-realtime-2602"),
        llm=mistralai.LLM(model="mistral-small-latest"),
        tts=elevenlabs.TTS(
            voice_id=tts_voice_id,
            model="eleven_flash_v2_5",
            language=lang,
        ),
        vad=ctx.proc.userdata["vad"],
        turn_detection=MultilingualModel(),
        allow_interruptions=False,
    )

    # --- Handle disconnect → send summary to frontend ---
    summary_sent = False

    async def send_summary():
        nonlocal summary_sent
        if summary_sent:
            return
        summary_sent = True
        try:
            summary = await generate_summary(agent)
            await ctx.room.local_participant.send_text(
                json.dumps(summary), topic="call-summary",
            )
            logger.info(f"Summary sent for {patient['name']}")
        except Exception as e:
            logger.error(f"Error generating summary: {e}")

    @ctx.room.on("participant_disconnected")
    def on_disconnect(p):
        import asyncio
        asyncio.ensure_future(send_summary())

    ctx.add_shutdown_callback(lambda: send_summary())

    # --- Start agent (audio goes directly to room) ---
    await session.start(
        agent=agent,
        room=ctx.room,
    )

    # --- Auto-end call after MAX_CALL_DURATION ---
    async def auto_hangup():
        await asyncio.sleep(MAX_CALL_DURATION)
        logger.info("Max call duration reached, wrapping up")
        await session.say(
            "Merci pour cet échange. N'hésitez pas à rappeler si besoin. Bonne journée !"
            if lang == "fr" else
            "Thank you for this chat. Don't hesitate to call back if needed. Have a great day!"
        )
        await send_summary()

    asyncio.create_task(auto_hangup())

    # --- Opening greeting — short, human, with doctor name + specific question ---
    first_name = patient["name"].split()[0]
    doctor_name = patient["recent_event"].get("doctor_name", "")
    q_key = "specific_questions_fr" if lang == "fr" else "specific_questions_en"
    first_question = patient["recent_event"].get(q_key, [""])[0]

    if lang == "fr":
        event_desc = patient["recent_event"].get("description_fr", patient["recent_event"]["description"]).lower()
        event_date = format_date_fr(patient["recent_event"]["date"])
        doctor_part = f" avec le {doctor_name}" if doctor_name else ""
        greeting = (
            f"Bonjour {first_name}, c'est Maude d'Alan. "
            f"Je vous appelle suite à votre {event_desc}{doctor_part} du {event_date}. "
            f"{first_question}"
        )
    else:
        event_desc = patient["recent_event"]["description"].lower()
        event_date = format_date_en(patient["recent_event"]["date"])
        doctor_part = f" with {doctor_name}" if doctor_name else ""
        greeting = (
            f"Hi {first_name}, Maude from Alan. "
            f"Calling about your {event_desc}{doctor_part} on {event_date}. "
            f"{first_question}"
        )

    await session.say(greeting.strip(), allow_interruptions=False)


if __name__ == "__main__":
    cli.run_app(server)
