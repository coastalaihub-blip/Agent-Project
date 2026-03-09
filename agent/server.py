"""FastAPI server exposing agent to backend service."""
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from db import get_business

from agent import run_agent, clear_session_memory

load_dotenv()
app = FastAPI(title="Agent Service", version="0.1.0")


class AgentRequest(BaseModel):
    text: str
    biz_id: str
    vertical: str
    call_sid: str


class EndCallRequest(BaseModel):
    call_sid: str


@app.post("/agent/respond")
async def agent_respond(payload: AgentRequest):
    try:
        business = await get_business(payload.biz_id)
        result = await run_agent(
            text=payload.text,
            biz_id=payload.biz_id,
            biz_name=business["name"],
            vertical=payload.vertical,
            biz_config=business.get("onboarding_config", {}),
            call_sid=payload.call_sid,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/end-call")
async def end_call(payload: EndCallRequest):
    """Clear session memory when call ends."""
    clear_session_memory(payload.call_sid)
    return {"status": "cleared"}


@app.get("/health")
def health():
    return {"status": "ok"}
