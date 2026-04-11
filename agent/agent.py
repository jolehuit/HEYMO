"""
Alan Care Call — Voice AI Agent (BOILERPLATE)

This is the skeleton. It runs out of the box with stubs.
Each TODO is tagged with the dev who owns it.

Run locally:  python agent.py console
Deploy:       lk agent create --secrets MISTRAL_API_KEY=xxx,LINKUP_API_KEY=xxx

Grep all tasks:  grep -rn "TODO" agent/
"""

import json
import logging
import os
from datetime import datetime

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
from livekit.plugins import mistralai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from playbook import build_system_prompt
from tools import load_patient, get_wearable_data

logger = logging.getLogger("alan-agent")
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

    def __init__(self, patient: dict, wearable_data: dict):
        self._patient = patient
        self._wearable_data = wearable_data
        self._call_start = datetime.now()
        self._alert_level = "green"
        self._actions: list[dict] = []
        self._reimbursement_discussed: dict | None = None

        instructions = build_system_prompt(patient, wearable_data)
        super().__init__(instructions=instructions)

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
        # Dev2: Real Linkup API integration done in tools.py (with mock fallback)
        from tools import get_reimbursement_info
        result = await get_reimbursement_info(procedure, self._patient)
        self._reimbursement_discussed = result
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

        # TODO(Dev1): Send live alert to frontend via text stream
        # The frontend already listens on topic "live-updates" (see CallInterface.tsx)
        # Docs: search "send_text" in ARCHITECTURE.md → Flux 4

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
        import os
        linkup_api_key = os.environ.get("LINKUP_API_KEY")
        if linkup_api_key:
            try:
                from linkup import LinkupClient
                client = LinkupClient()
                query = f"{specialty} conventionné secteur 1 {location} prendre rendez-vous"
                result = await client.async_search(
                    query=query,
                    depth="standard",
                    output_type="sourcedAnswer",
                    timeout=10.0,
                )
                self._actions.append({
                    "type": "provider_search",
                    "description": f"Searched for {specialty} in {location}",
                })
                return f"Search results for {specialty} in {location}:\n{result.answer}"
            except Exception as e:
                logger.warning(f"Linkup provider search error: {e}")

        return f"I can help you find a {specialty} in {location}. I recommend checking Doctolib.fr or calling Alan's concierge service for an appointment."

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
        return f"I've requested a teleconsultation for you. A doctor from Alan's network will call you within the next 30 minutes. It's fully covered by your {self._patient['contract']['formula']} plan."

    # ------------------------------------------------------------------
    # LINKUP HELPER (Dev 2)
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
    # LINKUP-POWERED TOOLS (Dev 2)
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
        # Build fallback from patient's known meds
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
    """Generate a structured post-call summary."""
    duration = (datetime.now() - agent._call_start).total_seconds()

    # TODO(Dev1): Make this smarter — use the LLM to summarize the actual
    # conversation from session.history, instead of just returning static data.
    # For now, returns a valid summary with the data we have.

    meds_status = []
    for med in agent._patient["medications"]:
        meds_status.append({
            "name": med["name"],
            "status": "completed" if med["remaining_days"] == 0 else "in_progress",
            "compliance": "full",
            **({"remaining_days": med["remaining_days"]} if med["remaining_days"] > 0 else {}),
        })

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
        "summary": f"Post-{agent._patient['recent_event']['type']} follow-up call.",
        "patient_state": {"pain_level": "unknown", "mood": "unknown", "general": "discussed during call"},
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

    # --- Read patient selection from frontend ---
    patient_id = participant.attributes.get("patient_id", "sophie_martin")
    logger.info(f"Starting call for patient: {patient_id}")

    # --- Load patient data + wearable data ---
    patient = load_patient(patient_id)
    wearable_data = await get_wearable_data(patient_id, patient.get("thryve_user_id", ""))

    # --- Create agent with full context ---
    agent = AlanHealthAgent(patient=patient, wearable_data=wearable_data)

    # --- Configure voice pipeline ---
    # TODO(Dev1): Test voice quality. If en_paul_confident sounds bad,
    # try other voices (see ARCHITECTURE.md → Modèles Mistral for the full list)
    # Last resort: ElevenLabs TTS (see docs.livekit.io/agents/integrations/tts/elevenlabs)
    session = AgentSession(
        stt=mistralai.STT(model="voxtral-mini-transcribe-realtime-2602"),
        llm=mistralai.LLM(model="mistral-small-latest"),
        tts=mistralai.TTS(voice="en_paul_confident"),
        vad=ctx.proc.userdata["vad"],
        turn_detection=MultilingualModel(),
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

    # --- Start agent ---
    await session.start(agent=agent, room=ctx.room)

    # --- Opening greeting ---
    # TODO(NonTech): Adjust the greeting tone/wording in playbook.py
    first_name = patient["name"].split()[0]
    event_desc = patient["recent_event"]["description"].lower()
    event_date = patient["recent_event"]["date"]
    await session.say(
        f"Hi {first_name}, this is Alan, your health partner. "
        f"I'm calling to check in after your {event_desc} on {event_date}. "
        f"How have you been feeling?"
    )


if __name__ == "__main__":
    cli.run_app(server)
