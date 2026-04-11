"""
Maude — Voice AI Agent for Alan health follow-up calls

Run locally:  uv run agent.py dev
Deploy:       lk agent create --secrets MISTRAL_API_KEY=xxx,LINKUP_API_KEY=xxx
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
from livekit.plugins import lemonslice, mistralai, silero
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
            "recent_event": self._patient["recent_event"],
            "medications": self._patient["medications"],
            "contract": self._patient["contract"],
        }
        return json.dumps(safe_patient, indent=2)


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
    # session.history → ChatContext, .messages → list[ChatMessage]
    # ChatMessage.text_content is a @property returning str | None
    # ChatRole is Literal['developer', 'system', 'user', 'assistant']
    transcript_lines = []
    for msg in agent.session.history.messages:
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
    tts_voice = "fr_marie_neutral" if lang == "fr" else "gb_jane_confident"
    session = AgentSession(
        stt=mistralai.STT(model="voxtral-mini-transcribe-realtime-2602"),
        llm=mistralai.LLM(model="mistral-small-latest"),
        tts=mistralai.TTS(voice=tts_voice),
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

    # --- Start avatar (LemonSlice) ---
    avatar = lemonslice.AvatarSession(
        agent_image_url=AVATAR_IMAGE_URL,
        agent_prompt="Be warm and expressive. Nod when listening. Smile gently.",
    )
    await avatar.start(session, room=ctx.room)

    # --- Start agent (audio goes to avatar, not directly to room) ---
    await session.start(
        agent=agent,
        room=ctx.room,
        room_options=room_io.RoomOptions(audio_output=False),
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

    # --- Opening greeting ---
    first_name = patient["name"].split()[0]
    if lang == "fr":
        event_desc = patient["recent_event"].get("description_fr", patient["recent_event"]["description"]).lower()
        event_date = format_date_fr(patient["recent_event"]["date"])
        await session.say(
            f"Bonjour {first_name}, c'est Maude, votre assistant santé Alan. "
            f"Je vous appelle pour prendre de vos nouvelles après votre {event_desc} du {event_date}. "
            f"Comment vous sentez-vous ?"
        )
    else:
        event_desc = patient["recent_event"]["description"].lower()
        event_date = patient["recent_event"]["date"]
        await session.say(
            f"Hi {first_name}, this is Maude, your Alan health assistant. "
            f"I'm calling to check in after your {event_desc} on {event_date}. "
            f"How have you been feeling?"
        )


if __name__ == "__main__":
    cli.run_app(server)
