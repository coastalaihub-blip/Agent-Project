"""
Exotel / Ozonetel webhook receiver.

Flow:
  1. Incoming call hits this endpoint
  2. If call has audio/recording → Deepgram STT → text
  3. POST text to agent service → get response
  4. ElevenLabs TTS → audio URL
  5. Return TwiML-style XML to Exotel to play audio
  6. Log call to Supabase
"""
import os
import uuid
import httpx
from fastapi import APIRouter, Query, Request, HTTPException
from fastapi.responses import JSONResponse, Response
from db.supabase import get_supabase
from models.schemas import ExotelWebhookPayload
from services.push_notifications import send_expo_push

router = APIRouter()

AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://localhost:8001")
TTS_SERVICE_URL = os.getenv("TTS_SERVICE_URL", "http://localhost:8002")


@router.post("/exotel")
async def exotel_webhook(request: Request):
    """
    Exotel calls this endpoint on every call event.
    Returns ExoML (Exotel's XML dialect) to control the call.
    """
    form_data = await request.form()
    payload = dict(form_data)

    call_sid = payload.get("CallSid", "")
    caller = payload.get("From", "")
    called = payload.get("To", "")  # This is our virtual number
    status = payload.get("Status", "")

    # Identify which business owns this number
    db = get_supabase()
    biz_result = db.table("businesses").select("*").eq("phone_number", called).single().execute()
    if not biz_result.data:
        return Response(content=_exoml_reject(), media_type="application/xml")

    business = biz_result.data
    biz_id = business["id"]
    vertical = business["vertical"]
    biz_name = business["name"]

    if status == "ringing":
        # Answer and play greeting
        greeting = f"Thank you for calling {biz_name}. How can I help you today?"
        try:
            audio_url = await _text_to_speech(greeting, vertical)
            return Response(
                content=_exoml_play_and_record(audio_url),
                media_type="application/xml",
            )
        except Exception as exc:
            print(f"[webhooks] Greeting TTS failed for {call_sid}: {exc}")
            return Response(content=_exoml_ok(), media_type="application/xml")

    if status == "completed" and payload.get("RecordingUrl"):
        # Transcribe → agent → TTS → log
        recording_url = payload["RecordingUrl"]
        try:
            transcript = await _transcribe(recording_url)
        except Exception as exc:
            transcript = ""
            print(f"[webhooks] Deepgram transcription failed for {call_sid}: {exc}")

        try:
            agent_resp = await _call_agent(transcript, biz_id, vertical, call_sid)
        except Exception as exc:
            print(f"[webhooks] Agent service failed for {call_sid}: {exc}")
            agent_resp = {
                "text": "Sorry, I could not process that request right now. Please call back later.",
                "intent": "unknown",
                "action": None,
                "action_data": None,
                "escalate": True,
                "summary": "Agent service unavailable",
                "escalation_reason": "upstream_agent_failure",
            }

        # Log to Supabase
        call_log = {
            "id": str(uuid.uuid4()),
            "business_id": biz_id,
            "caller_number": caller,
            "duration_sec": int(payload.get("CallDuration", 0) or 0),
            "transcript": transcript,
            "summary": agent_resp.get("summary", ""),
            "intent": agent_resp.get("intent", ""),
            "escalated": agent_resp.get("escalate", False),
            "escalation_reason": agent_resp.get("escalation_reason", "") if agent_resp.get("escalate") else "",
            "agent_response": agent_resp.get("text", ""),
        }
        db.table("calls").insert(call_log).execute()

        if call_log["escalated"]:
            onboarding = business.get("onboarding_config") or {}
            push_token = onboarding.get("push_token")
            if push_token:
                await send_expo_push(
                    expo_push_token=push_token,
                    title="Escalation: Caller needs assistance",
                    body=f"{caller or 'Unknown caller'} needs manual follow-up.",
                    data={
                        "business_id": biz_id,
                        "call_id": call_log["id"],
                        "intent": call_log.get("intent") or "unknown",
                        "escalated": True,
                    },
                )

        if agent_resp.get("action") == "book_appointment" and agent_resp.get("action_data"):
            appt_data = dict(agent_resp["action_data"])
            if "appointment_datetime" in appt_data and "datetime" not in appt_data:
                appt_data["datetime"] = appt_data.pop("appointment_datetime")
            appt = {**appt_data, "business_id": biz_id, "created_from_call_id": call_log["id"]}
            db.table("appointments").insert(appt).execute()

        try:
            audio_url = await _text_to_speech(agent_resp["text"], vertical)
            return Response(
                content=_exoml_play(audio_url),
                media_type="application/xml",
            )
        except Exception as exc:
            print(f"[webhooks] TTS generation failed for {call_sid}: {exc}")
            return Response(content=_exoml_ok(), media_type="application/xml")

    return Response(content=_exoml_ok(), media_type="application/xml")


@router.get("/exotel/passthru")
async def exotel_passthru(
    CallSid: str = Query(...),
    From: str = Query(""),
    To: str = Query(""),
):
    """
    Passthru Applet callback — Exotel calls this after the Voicebot Applet closes.
    Reads escalation state saved by voicebot_ws.py and returns it as JSON.
    Exotel SwitchCase Applet reads the 'escalate' field to branch the flow.
    """
    from routers.voicebot_ws import _call_states

    state = _call_states.pop(CallSid, None)
    if state and state.get("escalate"):
        return JSONResponse({"escalate": "true", "from": From})
    return JSONResponse({"escalate": "false"})


@router.post("/ozonetel")
async def ozonetel_webhook(request: Request):
    """Ozonetel webhook — same logic, different payload shape."""
    # TODO: implement when Ozonetel account activates
    return Response(content=_exoml_ok(), media_type="application/xml")


async def _transcribe(audio_url: str) -> str:
    """Deepgram STT: audio URL → transcript text."""
    import os
    from deepgram import DeepgramClient, PrerecordedOptions

    dg = DeepgramClient(os.environ["DEEPGRAM_API_KEY"])
    options = PrerecordedOptions(model="nova-2", language="en-IN", smart_format=True)
    response = dg.listen.prerecorded.v("1").transcribe_url({"url": audio_url}, options)
    return response.results.channels[0].alternatives[0].transcript


async def _call_agent(text: str, biz_id: str, vertical: str, call_sid: str) -> dict:
    """POST to Sid's agent service."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{AGENT_SERVICE_URL}/agent/respond",
            json={"text": text, "biz_id": biz_id, "vertical": vertical, "call_sid": call_sid},
        )
        resp.raise_for_status()
        return resp.json()


async def _text_to_speech(text: str, vertical: str) -> str:
    """POST to Pranav's TTS service → returns audio URL."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{TTS_SERVICE_URL}/tts/generate",
            json={"text": text, "vertical": vertical},
        )
        resp.raise_for_status()
        return resp.json()["audio_url"]


def _exoml_play_and_record(audio_url: str) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>{audio_url}</Play>
  <Record maxLength="30" action="/webhooks/exotel" />
</Response>"""


def _exoml_play(audio_url: str) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>{audio_url}</Play>
</Response>"""


def _exoml_reject() -> str:
    return """<?xml version="1.0" encoding="UTF-8"?>
<Response><Reject /></Response>"""


def _exoml_ok() -> str:
    return """<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>"""
