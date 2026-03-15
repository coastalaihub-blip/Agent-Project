"""
Exotel Voicebot Applet — real-time bidirectional WebSocket handler.

Exotel call flow:
  Voicebot Applet  →  wss://.../ws/voicebot  (this file)
    connected event  → init session
    start event      → look up biz, greet caller, open Deepgram stream
    media events     → stream PCM chunks to Deepgram
    speech_final     → run agent → ElevenLabs TTS → send PCM back to Exotel
    escalate = True  → save state, close WebSocket
  Passthru Applet  →  GET /webhooks/exotel/passthru  (webhooks.py)
    returns {"escalate": "true"} if state was saved, "false" otherwise
"""
import os
import json
import asyncio
import base64
import uuid
import httpx

from fastapi import APIRouter
from starlette.websockets import WebSocket, WebSocketDisconnect

from db.supabase import get_supabase
from services.deepgram_stream import create_deepgram_stream
from services.audio_utils import elevenlabs_to_pcm, chunk_pcm, pcm_to_base64


router = APIRouter()

AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://localhost:8001")

# Module-level state: call_sid → session dict
# Kept after call ends so Passthru Applet can read escalation flag.
_call_states: dict[str, dict] = {}


# ─── WebSocket entry point ──────────────────────────────────────────────────

@router.websocket("/ws/voicebot")
async def voicebot_endpoint(websocket: WebSocket):
    await websocket.accept()

    call_sid: str | None = None

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            event = msg.get("event")

            if event == "connected":
                # Nothing to do — Exotel sends this immediately on connect
                continue

            elif event == "start":
                call_sid = await _handle_start(websocket, msg)

            elif event == "media":
                if call_sid and call_sid in _call_states:
                    await _handle_media(call_sid, msg)

            elif event == "dtmf":
                # Ignored for now — can route to agent in a future iteration
                pass

            elif event == "clear":
                if call_sid and call_sid in _call_states:
                    _call_states[call_sid]["clear_flag"].set()

            elif event == "stop":
                break

    except WebSocketDisconnect:
        pass

    except Exception as exc:
        print(f"[voicebot_ws] Unhandled error (call_sid={call_sid}): {exc}")

    finally:
        await _cleanup(call_sid)


# ─── Event handlers ──────────────────────────────────────────────────────────

async def _handle_start(websocket: WebSocket, msg: dict) -> str | None:
    """
    Called on Exotel 'start' event.
    - Extracts callSid / streamSid / To number
    - Looks up business in Supabase
    - Opens Deepgram live stream
    - Sends greeting PCM
    Returns call_sid if setup succeeded, else None.
    """
    start_data = msg.get("start", {})
    call_sid = start_data.get("callSid") or start_data.get("call_sid", "")
    stream_sid = start_data.get("streamSid") or start_data.get("stream_sid", "")
    to_number = start_data.get("to", "")

    if not call_sid:
        print("[voicebot_ws] start event missing callSid — ignoring")
        return None

    # Look up business by Exophone (to_number)
    db = get_supabase()
    try:
        biz_result = (
            db.table("businesses")
            .select("*")
            .eq("phone_number", to_number)
            .single()
            .execute()
        )
        business = biz_result.data
    except Exception as exc:
        print(f"[voicebot_ws] Supabase lookup failed for {to_number}: {exc}")
        await websocket.close()
        return None

    if not business:
        print(f"[voicebot_ws] No business found for number {to_number}")
        await websocket.close()
        return None

    biz_id = business["id"]
    biz_name = business["name"]
    vertical = business["vertical"]
    biz_config = business.get("config") or {}

    # Initialise per-call state
    state: dict = {
        "stream_sid": stream_sid,
        "websocket": websocket,
        "biz_id": biz_id,
        "biz_name": biz_name,
        "vertical": vertical,
        "biz_config": biz_config,
        "escalate": False,
        "dg_connection": None,
        "agent_lock": asyncio.Lock(),
        "clear_flag": asyncio.Event(),
        "sequence": 1,
    }
    _call_states[call_sid] = state

    # Open Deepgram live stream — callback closes over call_sid / websocket
    async def on_transcript(transcript: str):
        await _handle_speech_final(call_sid, transcript)

    async def on_dg_error(exc: Exception):
        print(f"[voicebot_ws] Deepgram error (call_sid={call_sid}): {exc}")

    try:
        dg_conn = await create_deepgram_stream(on_transcript, on_dg_error)
        state["dg_connection"] = dg_conn
    except Exception as exc:
        print(f"[voicebot_ws] Failed to open Deepgram stream: {exc}")
        await websocket.close()
        return None

    # Send greeting
    greeting = f"Thank you for calling {biz_name}. How can I help you today?"
    await _speak(call_sid, greeting)

    return call_sid


async def _handle_media(call_sid: str, msg: dict):
    """Forward inbound PCM chunk to Deepgram."""
    state = _call_states.get(call_sid)
    if not state or not state["dg_connection"]:
        return

    payload_b64 = msg.get("media", {}).get("payload", "")
    if not payload_b64:
        return

    pcm_chunk = base64.b64decode(payload_b64)
    try:
        await state["dg_connection"].send(pcm_chunk)
    except Exception as exc:
        print(f"[voicebot_ws] Deepgram send error: {exc}")


async def _handle_speech_final(call_sid: str, transcript: str):
    """
    Called when Deepgram returns a speech_final transcript.
    - Acquires agent_lock (prevents overlapping agent calls)
    - Calls agent service
    - If escalate → saves flag, closes WebSocket
    - Else → TTS → PCM → send to Exotel
    """
    state = _call_states.get(call_sid)
    if not state:
        return

    async with state["agent_lock"]:
        agent_resp = await _call_agent(
            text=transcript,
            biz_id=state["biz_id"],
            biz_name=state["biz_name"],
            vertical=state["vertical"],
            biz_config=state["biz_config"],
            call_sid=call_sid,
        )

        if agent_resp.get("escalate"):
            state["escalate"] = True
            # Log to Supabase asynchronously (best-effort)
            asyncio.ensure_future(_log_call(call_sid, state, transcript, agent_resp))
            # Close WebSocket → Exotel moves to next Applet (Passthru)
            try:
                await state["websocket"].close()
            except Exception:
                pass
            return

        response_text = agent_resp.get("text", "")
        if response_text:
            await _speak(call_sid, response_text)


# ─── Audio helpers ────────────────────────────────────────────────────────────

async def _speak(call_sid: str, text: str):
    """Convert text → PCM via ElevenLabs, then stream to Exotel."""
    state = _call_states.get(call_sid)
    if not state:
        return

    try:
        pcm_bytes = await elevenlabs_to_pcm(text, state["vertical"])
    except Exception as exc:
        print(f"[voicebot_ws] TTS error: {exc}")
        return

    # Clear any pending audio if barge-in flag was set
    if state["clear_flag"].is_set():
        state["clear_flag"].clear()
        await _send_clear(state["websocket"], state["stream_sid"])

    await send_media_chunks(
        ws=state["websocket"],
        pcm_bytes=pcm_bytes,
        stream_sid=state["stream_sid"],
        seq_start=state["sequence"],
    )
    # Update sequence counter (one increment per send_media_chunks call)
    chunks = chunk_pcm(pcm_bytes)
    state["sequence"] += len(chunks) + 1  # +1 for mark event


async def send_media_chunks(ws: WebSocket, pcm_bytes: bytes, stream_sid: str, seq_start: int):
    """Chunk PCM into 3200-byte frames and send as Exotel media events."""
    chunks = chunk_pcm(pcm_bytes)
    seq = seq_start
    for chunk in chunks:
        payload = pcm_to_base64(chunk)
        await ws.send_text(json.dumps({
            "event": "media",
            "sequenceNumber": str(seq),
            "streamSid": stream_sid,
            "media": {"payload": payload},
        }))
        seq += 1
    # Send mark so Exotel notifies us when playback finishes
    await send_mark(ws, stream_sid, f"utterance-{seq_start}")


async def send_mark(ws: WebSocket, stream_sid: str, label: str):
    """Send a mark event to track playback position."""
    await ws.send_text(json.dumps({
        "event": "mark",
        "streamSid": stream_sid,
        "mark": {"name": label},
    }))


async def _send_clear(ws: WebSocket, stream_sid: str):
    """Tell Exotel to flush its audio buffer (barge-in)."""
    await ws.send_text(json.dumps({
        "event": "clear",
        "streamSid": stream_sid,
    }))


# ─── Agent call ───────────────────────────────────────────────────────────────

async def _call_agent(
    text: str,
    biz_id: str,
    biz_name: str,
    vertical: str,
    biz_config: dict,
    call_sid: str,
) -> dict:
    """POST to Sid's agent service (localhost:8001)."""
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"{AGENT_SERVICE_URL}/agent/respond",
                json={
                    "text": text,
                    "biz_id": biz_id,
                    "biz_name": biz_name,
                    "vertical": vertical,
                    "biz_config": biz_config,
                    "call_sid": call_sid,
                },
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as exc:
        print(f"[voicebot_ws] Agent call failed: {exc}")
        return {
            "text": "I'm sorry, I'm having trouble right now. Please hold.",
            "escalate": False,
            "intent": "error",
            "action": None,
            "action_data": None,
            "summary": text[:100],
        }


# ─── Supabase logging ─────────────────────────────────────────────────────────

async def _log_call(call_sid: str, state: dict, last_transcript: str, agent_resp: dict):
    """Best-effort call logging to Supabase on escalation."""
    try:
        db = get_supabase()
        db.table("calls").insert({
            "id": str(uuid.uuid4()),
            "business_id": state["biz_id"],
            "caller_number": "",
            "duration_sec": 0,
            "transcript": last_transcript,
            "summary": agent_resp.get("summary", ""),
            "intent": agent_resp.get("intent", "escalate"),
            "escalated": True,
        }).execute()
    except Exception as exc:
        print(f"[voicebot_ws] Supabase log error: {exc}")


# ─── Cleanup ──────────────────────────────────────────────────────────────────

async def _cleanup(call_sid: str | None):
    """Close Deepgram stream and remove state after call ends."""
    if not call_sid or call_sid not in _call_states:
        return

    state = _call_states[call_sid]
    dg_conn = state.get("dg_connection")
    if dg_conn:
        try:
            await dg_conn.finish()
        except Exception:
            pass

    # Keep state in _call_states so Passthru Applet can read escalation flag.
    # webhooks.py's passthru endpoint deletes it after reading.
    # Remove non-serialisable objects to free memory.
    state.pop("dg_connection", None)
    state.pop("websocket", None)
    state.pop("agent_lock", None)
    state.pop("clear_flag", None)
