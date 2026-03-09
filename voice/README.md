# Voice & TTS — Pranav

ElevenLabs TTS integration. Converts agent response text → natural-sounding audio for callers.

## Setup

```bash
cd voice
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # fill ELEVENLABS_API_KEY + voice IDs
uvicorn server:app --reload --port 8002
```

## Non-Negotiable: Voice sounds human in first 5 seconds

The entire demo lives or dies on whether the greeting sounds like a real receptionist.

**Greeting to perfect first:**
> "Thank you for calling Bright Smile Dental Clinic. How can I help you today?"

This must sound warm, natural, Indian English — not robotic IVR.

## Voice Personas

### Clinic — Warm, professional receptionist
- Tone: Warm, reassuring, slightly formal
- Pace: Moderate — not rushed
- Accent: Indian English (neutral, clear)
- ElevenLabs voice: Rachel or similar warm female voice
- Pacing rules:
  - Short pause after clinic name: "Bright Smile Dental Clinic... [pause] How can I help?"
  - Repeat confirmations slowly: "Thursday at eleven AM — confirmed."
  - Emergency mode: slow down, minimal words

### Call Center — Neutral, clear helpline agent
- Tone: Professional, neutral
- Pace: Slightly faster than clinic
- Rules: Clear diction, no long sentences, escalation phrases calm

## Key Files

- `tts.py` — Core TTS function
- `server.py` — FastAPI service on port 8002
- `personas/clinic.py` — Clinic voice config + SSML rules
- `personas/call_center.py` — Call Center voice config

## Latency Target

< 1.5 seconds from text input to audio URL. Cache TTS for:
- Greeting phrases (same every call)
- Confirmation phrases ("Your appointment is confirmed")
- Escalation phrases ("Connecting you to our staff")
