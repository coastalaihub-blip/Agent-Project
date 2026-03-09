# Architecture — Technical Reference

## Service Map

| Service | Port | Owner | Repo Folder |
|---|---|---|---|
| FastAPI backend | 8000 | Samarpith | `backend/` |
| LangChain agent | 8001 | Sid | `agent/` |
| ElevenLabs TTS | 8002 | Pranav | `voice/` |
| Pinecone retriever | 8003 | Nandana | `knowledge/` |

## Full Call Flow

```
1. Caller dials virtual number (Exotel/Ozonetel)
2. Exotel fires webhook → POST /webhooks/exotel (backend:8000)
3. Backend identifies business by `To` number → gets biz_id + vertical
4. Exotel plays greeting audio (pre-cached from ElevenLabs)
5. Exotel records caller's speech → provides RecordingUrl
6. Backend sends RecordingUrl → Deepgram STT → transcript text
7. Backend POSTs { text, biz_id, vertical, call_sid } → agent:8001
8. Agent:
   a. Calls knowledge:8003/retrieve → top-3 relevant FAQ chunks
   b. Builds system prompt (vertical-specific) + retrieved context
   c. Calls Claude API (claude-sonnet-4-6)
   d. Returns { text, intent, action, action_data, escalate }
9. Backend receives agent response
   a. If action = "book_appointment" → INSERT into appointments table
   b. If escalate = true → POST /api/notifications/escalate → Expo push
10. Backend POSTs agent response text → voice:8002/tts/generate → MP3
11. Backend returns audio URL to Exotel via ExoML
12. Exotel plays audio to caller
13. Backend logs call to Supabase calls table (transcript, intent, summary)
```

## Environment Variables Map

```
backend/    → SUPABASE_URL, SUPABASE_SERVICE_KEY, DEEPGRAM_API_KEY
             EXOTEL_*, OZONETEL_*, AGENT_SERVICE_URL, TTS_SERVICE_URL
agent/      → ANTHROPIC_API_KEY, BACKEND_URL, KNOWLEDGE_SERVICE_URL
knowledge/  → PINECONE_API_KEY, PINECONE_INDEX_NAME
voice/      → ELEVENLABS_API_KEY, ELEVENLABS_CLINIC_VOICE_ID, ELEVENLABS_CALL_CENTER_VOICE_ID
```

## Pinecone Namespace Convention

```
biz_{business_id}       → per-business namespace
biz_demo                → Clinic demo data
biz_demo_cc             → Call Center demo data
```

## Supabase Tables

```
businesses              → business config + assigned phone number
calls                   → call logs (transcript, intent, escalated)
appointments            → booked appointments
phone_number_pool       → pre-provisioned numbers (assign on signup)
knowledge_base          → content tracker (approved before Pinecone sync)
caller_memory           → returning caller context
```
