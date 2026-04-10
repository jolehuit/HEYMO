"""
Alan Care Call — Voice AI Agent
Main LiveKit agent with Mistral STT/LLM/TTS, Silero VAD, and function tools.

Owner: Dev 1
- LiveKit Cloud setup + Mistral plugin configuration
- AgentSession with Mistral Small 4, Voxtral STT/TTS, Silero VAD
- Playbook integration into system prompt
- Function tools hookup
- Patient context from participant attributes
- Post-call summary generation via text stream

Run locally:  python agent.py console
Deploy:       lk agent create --secrets MISTRAL_API_KEY=xxx,LINKUP_API_KEY=xxx,THRYVE_API_KEY=xxx
"""

import json
import logging
from datetime import datetime

from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobProcess,
    RoomInputOptions,
    RunContext,
    cli,
    function_tool,
)
from livekit.plugins import mistralai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from playbook import build_system_prompt
from tools import (
    load_patient,
    get_wearable_data,
    get_reimbursement_from_db,
    search_reimbursement_linkup,
)

logger = logging.getLogger("alan-agent")
logger.setLevel(logging.INFO)


# --------------------------------------------------------------------------
# PREWARM — load models once at startup, not per-session
# --------------------------------------------------------------------------

def prewarm(proc: JobProcess):
    """Pre-load Silero VAD model at worker startup for faster cold starts."""
    proc.userdata["vad"] = silero.VAD.load()


class AlanHealthAgent(Agent):
    """Alan health follow-up voice agent."""

    def __init__(self, patient: dict, wearable_data: dict):
        self._patient = patient
        self._wearable_data = wearable_data
        self._call_start = datetime.now()
        self._alert_level = "green"
        self._actions: list[dict] = []
        self._reimbursement_discussed: dict | None = None

        # Build the system prompt with full patient context
        instructions = build_system_prompt(patient, wearable_data)

        super().__init__(instructions=instructions)

    # ------------------------------------------------------------------
    # FUNCTION TOOLS — called by the LLM during conversation
    # ------------------------------------------------------------------

    @function_tool()
    async def get_patient_context(self, context: RunContext) -> str:
        """Get the current patient's full profile including medical history,
        medications, and upcoming appointments. Use this when you need to
        reference specific details about the patient."""
        return json.dumps(self._patient, indent=2)

    @function_tool()
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
                      'physiotherapy', 'blood_test', 'ultrasound', 'mri', 'xray',
                      'teleconsultation', 'general_consultation', 'endocrinologist',
                      'gynecologist', 'morphology_ultrasound', 'glucose_tolerance_test'
        """
        complementary_rate = self._patient["contract"]["complementary_rate"]

        # Try Linkup API first for live data
        linkup_result = await search_reimbursement_linkup(procedure)
        if linkup_result:
            # Also get hardcoded data as structured backup
            hardcoded = get_reimbursement_from_db(procedure, complementary_rate)
            result = {
                "structured_data": hardcoded,
                "live_search": linkup_result,
            }
        else:
            result = get_reimbursement_from_db(procedure, complementary_rate)

        self._reimbursement_discussed = result if isinstance(result, dict) and "procedure" in result else result.get("structured_data", result)
        return json.dumps(result, indent=2)

    @function_tool()
    async def get_wearable_insights(self, context: RunContext) -> str:
        """Get the patient's wearable health data from the past 7 days.
        Includes heart rate, sleep, activity levels, and detected risk patterns.
        Use this to reference specific health metrics during the conversation."""
        return json.dumps(self._wearable_data, indent=2)

    @function_tool()
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
        self._actions.append({
            "type": "flag",
            "description": reason,
        })
        logger.warning(f"ALERT [{level}]: {reason} for patient {self._patient['name']}")

        # Send live alert to frontend
        try:
            room = context.session.room_io.room
            if room:
                await room.local_participant.send_text(
                    json.dumps({"type": "alert", "level": level, "reason": reason}),
                    topic="live-updates",
                )
        except Exception:
            pass  # Room may not be available yet
        return f"Alert flagged as {level}: {reason}"

    @function_tool()
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
        action = {
            "type": "followup_call",
            "description": description,
            "scheduled_date": scheduled_date,
        }
        self._actions.append(action)
        return f"Follow-up scheduled for {scheduled_date}: {description}"

    @function_tool()
    async def send_sms_reminder(
        self,
        context: RunContext,
        message: str,
    ) -> str:
        """Send an SMS reminder to the patient (simulated for demo).

        Args:
            message: The SMS message content to send
        """
        action = {
            "type": "appointment",
            "description": message,
            "status": "pending",
            "sms_sent": True,
        }
        self._actions.append(action)
        logger.info(f"SMS sent to {self._patient['name']}: {message}")
        return f"SMS reminder sent to {self._patient['name']}: {message}"


# --------------------------------------------------------------------------
# POST-CALL SUMMARY GENERATION
# --------------------------------------------------------------------------

async def generate_summary(
    agent: AlanHealthAgent,
    session: AgentSession,
) -> dict:
    """Generate a structured post-call summary."""
    duration = (datetime.now() - agent._call_start).total_seconds()

    # Build medication status from patient data
    meds_status = []
    for med in agent._patient["medications"]:
        status = "completed" if med["remaining_days"] == 0 else "in_progress"
        entry = {
            "name": med["name"],
            "status": status,
            "compliance": "full",  # Default; the LLM would update this during conversation
        }
        if med["remaining_days"] > 0:
            entry["remaining_days"] = med["remaining_days"]
        meds_status.append(entry)

    # Build wearable highlights
    wearable_highlights = {}
    if agent._wearable_data:
        wd = agent._wearable_data
        wearable_highlights = {
            "resting_hr": {
                "value": wd["heart_rate"]["current_resting_avg"],
                "baseline": wd["heart_rate"]["baseline_resting_avg"],
                "trend": wd["heart_rate"]["trend"],
            },
            "sleep_hours": {
                "value": wd["sleep"]["current_avg_hours"],
                "baseline": wd["sleep"]["baseline_avg_hours"],
                "trend": wd["sleep"]["trend"],
            },
            "steps": {
                "value": wd["activity"]["current_avg_steps"],
                "baseline": wd["activity"]["baseline_avg_steps"],
                "trend": wd["activity"]["trend"],
            },
            "risk_patterns": wd.get("risk_patterns", []),
        }

    summary = {
        "patient_id": agent._patient["patient_id"],
        "patient_name": agent._patient["name"],
        "date": datetime.now().strftime("%Y-%m-%d"),
        "duration_seconds": int(duration),
        "alert_level": agent._alert_level,
        "summary": f"Post-{agent._patient['recent_event']['type']} follow-up call with {agent._patient['name']}.",
        "patient_state": {
            "pain_level": "unknown",
            "mood": "unknown",
            "general": "discussed during call",
        },
        "medications_status": meds_status,
        "wearable_highlights": wearable_highlights,
        "actions": agent._actions,
        "reimbursement_discussed": agent._reimbursement_discussed,
        "escalated": agent._alert_level in ("orange", "red"),
    }

    return summary


# --------------------------------------------------------------------------
# ENTRYPOINT
# --------------------------------------------------------------------------

server = AgentServer()
server.setup_fnc = prewarm


@server.rtc_session()
async def entrypoint(ctx):
    """Main entrypoint — called when a participant joins a LiveKit room."""
    await ctx.connect()

    # Wait for the human participant to join
    participant = await ctx.wait_for_participant()

    # Read which patient was selected from the frontend
    patient_id = participant.attributes.get("patient_id", "sophie_martin")
    logger.info(f"Starting call for patient: {patient_id}")

    # Load patient data
    patient = load_patient(patient_id)

    # Load wearable data (Thryve API or hardcoded fallback)
    wearable_data = await get_wearable_data(
        patient_id,
        patient.get("thryve_user_id", ""),
    )

    # Create the agent with full context
    agent = AlanHealthAgent(patient=patient, wearable_data=wearable_data)

    # Configure the voice pipeline (VAD pre-loaded at startup via prewarm)
    session = AgentSession(
        stt=mistralai.STT(model="voxtral-mini-transcribe-realtime-2602"),
        llm=mistralai.LLM(model="mistral-small-latest"),
        tts=mistralai.TTS(voice="en_paul_confident"),
        vad=ctx.proc.userdata["vad"],
        turn_detection=MultilingualModel(),
    )

    # Handle participant disconnect → generate and send summary
    @ctx.room.on("participant_disconnected")
    def on_disconnect(participant):
        import asyncio

        async def _send_summary():
            logger.info("Participant disconnected, generating summary...")
            try:
                summary = await generate_summary(agent, session)
                await ctx.room.local_participant.send_text(
                    json.dumps(summary),
                    topic="call-summary",
                )
                logger.info(f"Summary sent for {patient['name']}")
            except Exception as e:
                logger.error(f"Error generating summary: {e}")

        asyncio.ensure_future(_send_summary())

    # Start the agent session
    await session.start(
        agent=agent,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            # Only process audio from the human participant
        ),
    )

    # Generate the opening message
    first_name = patient["name"].split()[0]
    event_desc = patient["recent_event"]["description"].lower()
    event_date = patient["recent_event"]["date"]
    greeting = (
        f"Hi {first_name}, this is Alan, your health partner. "
        f"I'm calling to check in after your {event_desc} on {event_date}. "
        f"How have you been feeling?"
    )
    await session.say(greeting)


if __name__ == "__main__":
    cli.run_app(server)
