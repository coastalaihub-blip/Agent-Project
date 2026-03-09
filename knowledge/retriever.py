"""
Pinecone retriever — Nandana's core delivery to Sid.

retrieve(query, biz_id) → list of relevant text chunks
"""
import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

_pc: Pinecone | None = None
_index = None

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "ai-agent-platform")


def _get_index():
    global _pc, _index
    if _index is None:
        _pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
        _index = _pc.Index(INDEX_NAME)
    return _index


def retrieve(query: str, biz_id: str, top_k: int = 3) -> list[dict]:
    """
    Search Pinecone namespace for biz_id and return top_k relevant chunks.

    Args:
        query: The caller's question or statement
        biz_id: Business ID (namespace = f"biz_{biz_id}")
        top_k: Number of chunks to return (default 3)

    Returns:
        List of dicts: [{"id": "...", "text": "...", "category": "...", "score": 0.92}, ...]
    """
    index = _get_index()
    namespace = f"biz_{biz_id}"

    results = index.search(
        namespace=namespace,
        query={"inputs": {"text": query}, "top_k": top_k},
    )

    chunks = []
    for match in results.get("result", {}).get("hits", []):
        fields = match.get("fields", {})
        chunks.append({
            "id": match.get("_id", ""),
            "text": fields.get("text", ""),
            "category": fields.get("category", ""),
            "vertical": fields.get("vertical", ""),
            "score": match.get("_score", 0.0),
        })

    return chunks
