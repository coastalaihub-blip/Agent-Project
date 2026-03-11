# Backend — Samarpith

FastAPI backend: Supabase auth, business CRUD, call logs, webhook receiver, number assignment.

## Quick Start (Day 1)

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate    # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example ../.env   # then fill in your API keys

# Start server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Test it
python test_backend.py
```

📖 **Detailed Setup Guide:** See [DAY1_SETUP_GUIDE.md](../DAY1_SETUP_GUIDE.md)

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
