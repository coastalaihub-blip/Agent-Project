"""Knowledge retrieval service — exposes retrieve() over HTTP."""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from retriever import retrieve

load_dotenv()
app = FastAPI(title="Knowledge Service", version="0.1.0")


class RetrieveRequest(BaseModel):
    query: str
    biz_id: str
    top_k: int = 3


@app.post("/retrieve")
async def retrieve_chunks(payload: RetrieveRequest):
    try:
        chunks = retrieve(payload.query, payload.biz_id, payload.top_k)
        return {"chunks": chunks, "count": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
