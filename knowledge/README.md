# Knowledge Pipeline — Nandana

Pinecone RAG system. Manages the knowledge base for each business vertical.

## Setup

```bash
cd knowledge
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env

# Step 1: Create the Pinecone index (run once)
python scripts/setup_pinecone.py

# Step 2: Upload demo FAQs
python scripts/upload_faqs.py --vertical clinic --biz_id biz_demo
python scripts/upload_faqs.py --vertical call_center --biz_id biz_demo_cc

# Step 3: Start the retriever service
uvicorn server:app --reload --port 8003
```

## Key Files

- `retriever.py` — `retrieve(query, biz_id)` function (Sid calls this)
- `server.py` — FastAPI service exposing `/retrieve`
- `scripts/setup_pinecone.py` — Create index + test connection
- `scripts/upload_faqs.py` — Upload FAQs from JSON to Pinecone
- `faqs/clinic_faqs.json` — 30 Clinic FAQs (pre-curated)
- `faqs/call_center_faqs.json` — 20 Call Center FAQs

## Pinecone Structure

- **Index name:** `ai-agent-platform`
- **Model:** `llama-text-embed-v2` (best for longer passages)
- **Namespace per business:** `biz_{business_id}`
- **Fields:** `id`, `text`, `category`, `vertical`, `business_id`, `type`

## Quality Checklist (before demo)

- [ ] All 30 Clinic FAQs uploaded and retrievable
- [ ] All 20 Call Center FAQs uploaded
- [ ] Run `python scripts/test_recall.py` — target >85% recall on 10 test queries
- [ ] No ambiguous or contradictory entries (run `python scripts/quality_check.py`)
- [ ] Approved column in Supabase `knowledge_base` table = all TRUE
