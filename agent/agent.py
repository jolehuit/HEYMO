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
        # TODO(Dev2): Implement real reimbursement lookup
        # See tools.py → get_reimbursement_info() for the stub
        from tools import get_reimbursement_info
        result = await get_reimbursement_info(procedure, self._patient)
        self._reimbursement_discussed = result
        return json.dumps(result, indent=2)

    @function_tool
    async def get_wearable_insights(self, context: RunContext) -> str:
        """Get the patient's wearable health data from the past 7 days.
        Includes heart rate, sleep, activity levels, and detected risk patterns."""
        # TODO(Dev2): This returns hardcoded data for now.
        # Replace with real Thryve API data once credentials arrive.
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
        # The room is accessible via: context.session.room_io.room
        # Example:
        #   room = context.session.room_io.room
        #   await room.local_participant.send_text(
        #       json.dumps({"type": "alert", "level": level, "reason": reason}),
        #       topic="live-updates",
        #   )

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

    # TODO(Dev2): Add more function tools if needed:
    # - send_sms_reminder(message) → simulated SMS to patient
    # - get_patient_context() → return full patient JSON
    # - end_call() → trigger summary generation before disconnect


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
    # try: en_paul_neutral, gb_jane_confident, gb_oliver_confident
    # Last resort: switch to ElevenLabs TTS (1 line change):
    #   pip install "livekit-agents[elevenlabs]"
    #   from livekit.plugins import elevenlabs
    #   tts=elevenlabs.TTS(voice="...")  # redeem ElevenLabs Creator via Discord first
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
