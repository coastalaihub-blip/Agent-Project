# AI Agent Platform — Beta Sprint

Role-based AI agent platform for Indian businesses. AI handles calls + text like a trained human receptionist.

**Demo Target:** March 28 (TestFlight)
**Verticals:** Clinic/Receptionist (primary), Call Center (secondary)

## Repo Structure

```
ai-agent-platform/
├── backend/        → Samarpith — FastAPI + Supabase + webhooks
├── agent/          → Sid — LangChain + Claude agent
├── knowledge/      → Nandana — Pinecone + RAG + FAQs
├── voice/          → Pranav — ElevenLabs TTS personas
├── mobile/         → Samarpith — React Native + Expo app
└── docs/           → Architecture, demo script, onboarding
```

## Team

| Person | Folder | Stack |
|---|---|---|
| Samarpith | `backend/` + `mobile/` | FastAPI, React Native, Supabase |
| Sid | `agent/` | LangChain, Claude API |
| Nandana | `knowledge/` | Pinecone, Python |
| Pranav | `voice/` | ElevenLabs |
| Founder | Root config + docs | Exotel, Deepgram, n8n |

## Quick Start

```bash
# Each team member works in their own folder
# See the README.md inside each folder for setup instructions

# Global .env.example → copy to .env and fill in secrets
cp .env.example .env
```

## Architecture

```
Caller → Exotel/Ozonetel → Deepgram STT → LangChain Agent (Sid)
                                                ↙           ↘
                                         Claude API    Pinecone RAG (Nandana)
                                              ↓
                                        Agent Response
                                              ↓
                                      ElevenLabs TTS (Pranav)
                                              ↓
                                    Exotel → Caller (audio)
                                              ↓
                              FastAPI → Supabase (log + booking)
                                              ↓
                              React Native App (owner dashboard)
```

## Non-Negotiables (v1.1 Vision)

- Behavior before intelligence — tone matters more than model size
- Minimal user effort — onboarding in 3–5 min, multiple choice only
- Voice-first — product works even without UI
- No hallucinations — if unsure, say "Let me check and get back to you"
- Memory is earned — only store what improves future interactions
