"""
Integration handoff router.

Provides stable passthrough endpoints promised in team SOP:
- POST /agent-query
- POST /tts-request
"""
import os
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://localhost:8001")
TTS_SERVICE_URL = os.getenv("TTS_SERVICE_URL", "http://localhost:8002")


class AgentQueryPayload(BaseModel):
    text: str
    biz_id: str
    vertical: str
    call_sid: str


class TtsRequestPayload(BaseModel):
    text: str
    vertical: str


def _upstream_error(service: str, exc: Exception) -> HTTPException:
    return HTTPException(status_code=502, detail=f"{service} unavailable: {exc}")


@router.post("/agent-query")
async def agent_query(payload: AgentQueryPayload) -> Any:
    """Pass through caller text + metadata to agent service."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{AGENT_SERVICE_URL}/agent/respond",
                json=payload.model_dump(),
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text) from exc
    except Exception as exc:
        raise _upstream_error("agent service", exc) from exc


@router.post("/tts-request")
async def tts_request(payload: TtsRequestPayload) -> Any:
    """Pass through agent text to voice service and return generated audio URL."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{TTS_SERVICE_URL}/tts/generate",
                json=payload.model_dump(),
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text) from exc
    except Exception as exc:
        raise _upstream_error("tts service", exc) from exc
