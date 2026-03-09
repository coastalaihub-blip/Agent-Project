# Agent Core — Sid

LangChain agent using Claude (claude-sonnet-4-6). Receives transcribed caller text, retrieves from Pinecone, responds with structured output.

## Setup

```bash
cd agent
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn server:app --reload --port 8001
```

## How It Works

1. Backend posts `{ text, biz_id, vertical, call_sid }` to `/agent/respond`
2. Agent calls `retrieve(text, biz_id)` → gets top-3 relevant FAQ chunks
3. Agent runs Claude with vertical-specific system prompt + retrieved context
4. Returns structured response: `{ text, intent, action, action_data, escalate }`

## Key Files

- `agent.py` — LangChain agent core
- `server.py` — FastAPI server exposing `/agent/respond`
- `prompts/clinic.py` — System prompt for Clinic vertical
- `prompts/call_center.py` — System prompt for Call Center vertical
- `tools/booking.py` — `book_appointment()` tool
- `tools/escalation.py` — `escalate()` tool

## Behavior Rules (NON-NEGOTIABLE)

1. **Never hallucinate** — if information is not in retrieved context, say "I'll check and get back to you"
2. **Always calm** — even with angry callers, stay measured and professional
3. **Confirm before booking** — "I'll book Thursday at 11am for you. Shall I confirm?"
4. **Escalate on demand** — "I need to speak to someone" → immediate escalation
5. **Short responses** — max 2 sentences per turn for voice
6. **Indian English** — natural, not formal British English
