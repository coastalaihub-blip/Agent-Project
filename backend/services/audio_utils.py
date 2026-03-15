"""
PCM / audio format utilities for the Exotel Voicebot WebSocket integration.

Exotel expects: PCM s16le, 8000 Hz, mono, 3200-byte chunks (100ms each).
ElevenLabs returns: MP3 — we convert via pydub (requires ffmpeg on PATH).
"""
import os
import base64
import asyncio
from io import BytesIO

from pydub import AudioSegment
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings


# Voice IDs — set in .env; fall back to ElevenLabs "Rachel" default
_VOICE_IDS: dict[str, str] = {
    "clinic": os.getenv("ELEVENLABS_CLINIC_VOICE_ID", "21m00Tcm4TlvDq8ikWAM"),
    "call_center": os.getenv("ELEVENLABS_CALL_CENTER_VOICE_ID", "21m00Tcm4TlvDq8ikWAM"),
}

_VOICE_SETTINGS = VoiceSettings(
    stability=0.65,
    similarity_boost=0.80,
    style=0.25,
    use_speaker_boost=True,
)


def _elevenlabs_to_pcm_sync(text: str, vertical: str) -> bytes:
    """Synchronous: ElevenLabs MP3 → PCM s16le 8kHz mono."""
    voice_id = _VOICE_IDS.get(vertical, _VOICE_IDS["clinic"])
    client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])

    mp3_bytes = b""
    for chunk in client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        model_id="eleven_turbo_v2",
        voice_settings=_VOICE_SETTINGS,
        output_format="mp3_44100_128",
    ):
        mp3_bytes += chunk

    audio = AudioSegment.from_mp3(BytesIO(mp3_bytes))
    audio = audio.set_frame_rate(8000).set_channels(1).set_sample_width(2)
    return audio.raw_data


async def elevenlabs_to_pcm(text: str, vertical: str) -> bytes:
    """Async wrapper — runs ElevenLabs call in thread pool to avoid blocking."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _elevenlabs_to_pcm_sync, text, vertical)


def chunk_pcm(pcm_bytes: bytes, chunk_size: int = 3200) -> list[bytes]:
    """
    Split PCM bytes into chunk_size chunks.
    Pads the last chunk to a multiple of 320 bytes (one 8kHz mono s16le frame = 2 bytes;
    320 bytes = 20ms, the minimum safe send unit for Exotel).
    """
    chunks = []
    for i in range(0, len(pcm_bytes), chunk_size):
        chunk = pcm_bytes[i : i + chunk_size]
        # Pad last chunk to next multiple of 320 bytes
        remainder = len(chunk) % 320
        if remainder:
            chunk = chunk + b"\x00" * (320 - remainder)
        chunks.append(chunk)
    return chunks


def pcm_to_base64(chunk: bytes) -> str:
    return base64.b64encode(chunk).decode("utf-8")
