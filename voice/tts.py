"""
ElevenLabs TTS — text → audio file URL.

Caches common phrases (greetings, confirmations) to reduce latency.
"""
import os
import hashlib
from pathlib import Path
from dotenv import load_dotenv
from elevenlabs import ElevenLabs
from personas.clinic import CLINIC_VOICE_ID, CLINIC_VOICE_SETTINGS
from personas.call_center import CALL_CENTER_VOICE_ID, CALL_CENTER_VOICE_SETTINGS

load_dotenv()

CACHE_DIR = Path("tts_cache")
CACHE_DIR.mkdir(exist_ok=True)

# Phrases to pre-cache on startup
CACHED_PHRASES = {
    "clinic": [
        "Thank you for calling Bright Smile Dental Clinic. How can I help you today?",
        "Your appointment has been confirmed. We will see you then.",
        "Let me connect you with our staff right away. Please hold.",
        "I'm sorry, I didn't catch that. Could you please repeat?",
    ],
    "call_center": [
        "Thank you for calling. How can I help you today?",
        "Let me connect you to our team. Please hold.",
        "I understand. Let me help you with that.",
    ],
}


def _get_voice_id(vertical: str) -> str:
    if vertical == "clinic":
        return os.getenv("ELEVENLABS_CLINIC_VOICE_ID", CLINIC_VOICE_ID)
    return os.getenv("ELEVENLABS_CALL_CENTER_VOICE_ID", CALL_CENTER_VOICE_ID)


def _get_voice_settings(vertical: str) -> dict:
    if vertical == "clinic":
        return CLINIC_VOICE_SETTINGS
    return CALL_CENTER_VOICE_SETTINGS


def _cache_path(text: str, vertical: str) -> Path:
    key = hashlib.md5(f"{vertical}:{text}".encode()).hexdigest()
    return CACHE_DIR / f"{key}.mp3"


async def generate_audio(text: str, vertical: str = "clinic") -> bytes:
    """Generate audio bytes from text. Returns MP3 bytes."""
    cache_file = _cache_path(text, vertical)
    if cache_file.exists():
        return cache_file.read_bytes()

    client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
    voice_id = _get_voice_id(vertical)
    settings = _get_voice_settings(vertical)

    audio = client.generate(
        text=text,
        voice=voice_id,
        model="eleven_multilingual_v2",
        voice_settings=settings,
    )

    audio_bytes = b"".join(audio)
    cache_file.write_bytes(audio_bytes)
    return audio_bytes


async def pre_cache_phrases():
    """Pre-generate audio for common phrases on startup."""
    print("[tts] Pre-caching common phrases...")
    for vertical, phrases in CACHED_PHRASES.items():
        for phrase in phrases:
            try:
                await generate_audio(phrase, vertical)
                print(f"  cached: [{vertical}] {phrase[:50]}...")
            except Exception as e:
                print(f"  failed: {phrase[:40]}... — {e}")
    print("[tts] Pre-cache complete")
