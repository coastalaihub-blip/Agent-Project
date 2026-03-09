"""TTS service — exposes /tts/generate over HTTP."""
import io
import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv
from tts import generate_audio, pre_cache_phrases

load_dotenv()
app = FastAPI(title="TTS Service", version="0.1.0")


class TTSRequest(BaseModel):
    text: str
    vertical: str = "clinic"  # "clinic" | "call_center"


@app.on_event("startup")
async def startup():
    await pre_cache_phrases()


@app.post("/tts/generate")
async def tts_generate(payload: TTSRequest):
    """Generate audio and return as MP3 bytes."""
    try:
        audio_bytes = await generate_audio(payload.text, payload.vertical)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
