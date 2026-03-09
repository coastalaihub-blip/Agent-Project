"""Fetch business config from backend."""
import os
import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


async def get_business(biz_id: str) -> dict:
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(f"{BACKEND_URL}/api/businesses/{biz_id}")
        resp.raise_for_status()
        return resp.json()
