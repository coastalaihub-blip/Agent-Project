# Backend — Samarpith

FastAPI backend: Supabase auth, business CRUD, call logs, webhook receiver, number assignment.

## Setup

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # fill in secrets
uvicorn main:app --reload
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/businesses/signup` | Create business + assign number |
| GET | `/api/businesses/{id}` | Get business config |
| GET | `/api/calls/{business_id}` | List call logs |
| GET | `/api/calls/{call_id}/transcript` | Get transcript + summary |
| POST | `/webhooks/exotel` | Incoming call from Exotel |
| POST | `/webhooks/ozonetel` | Incoming call from Ozonetel |

## Pipeline Flow

```
Exotel webhook → /webhooks/exotel
    → Deepgram STT (convert audio URL → text)
    → POST to agent service (agent/)
    → receive response text
    → ElevenLabs TTS (text → audio)
    → return audio URL to Exotel
    → log call to Supabase
```

## Key Files

- `main.py` — FastAPI app entry point
- `routers/webhooks.py` — Exotel/Ozonetel incoming call handler
- `routers/businesses.py` — Business CRUD + number assignment
- `routers/calls.py` — Call log endpoints
- `db/supabase.py` — Supabase client
- `supabase_schema.sql` — Run this in Supabase SQL editor
