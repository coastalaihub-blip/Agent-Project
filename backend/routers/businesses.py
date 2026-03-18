from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db.supabase import get_supabase
from models.schemas import BusinessSignup, BusinessResponse
import uuid

router = APIRouter()


def _assign_phone_number(vertical: str) -> str:
    """
    Assign next available number from pre-provisioned pool.
    Pool strategy: numbers stored in Supabase `phone_number_pool` table.
    """
    db = get_supabase()
    result = (
        db.table("phone_number_pool")
        .select("*")
        .eq("assigned", False)
        .eq("vertical", vertical)
        .limit(1)
        .execute()
    )
    if not result.data:
        # Fallback: try any unassigned number
        result = (
            db.table("phone_number_pool")
            .select("*")
            .eq("assigned", False)
            .limit(1)
            .execute()
        )
    if not result.data:
        raise HTTPException(status_code=503, detail="No phone numbers available in pool")

    number_row = result.data[0]
    # Mark as assigned
    db.table("phone_number_pool").update({"assigned": True}).eq("id", number_row["id"]).execute()
    return number_row["phone_number"]


@router.post("/signup", response_model=BusinessResponse)
async def signup_business(payload: BusinessSignup):
    db = get_supabase()
    phone_number = _assign_phone_number(payload.vertical)

    new_business = {
        "id": str(uuid.uuid4()),
        "owner_id": payload.owner_id,
        "name": payload.name,
        "vertical": payload.vertical,
        "phone_number": phone_number,
        "onboarding_config": payload.onboarding_config,
        "plan": "trial",
    }
    result = db.table("businesses").insert(new_business).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create business")
    return result.data[0]


@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(business_id: str):
    db = get_supabase()
    result = db.table("businesses").select("*").eq("id", business_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")
    return result.data


@router.get("/")
async def list_businesses(owner_id: str):
    db = get_supabase()
    result = db.table("businesses").select("*").eq("owner_id", owner_id).execute()
    return result.data or []


# ── Agent Config ──────────────────────────────────────────────────────────────

class AgentConfig(BaseModel):
    system_prompt: Optional[str] = None
    voice_id: Optional[str] = None          # ElevenLabs voice ID
    escalation_phrases: Optional[list] = None
    business_hours: Optional[str] = None


@router.get("/{business_id}/config")
async def get_config(business_id: str):
    db = get_supabase()
    result = db.table("businesses").select("onboarding_config").eq("id", business_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")
    return result.data.get("onboarding_config", {})


@router.put("/{business_id}/config")
async def update_config(business_id: str, payload: AgentConfig):
    db = get_supabase()
    biz = db.table("businesses").select("onboarding_config").eq("id", business_id).single().execute()
    if not biz.data:
        raise HTTPException(status_code=404, detail="Business not found")
    existing = biz.data.get("onboarding_config") or {}
    updated = {**existing, **{k: v for k, v in payload.model_dump().items() if v is not None}}
    result = db.table("businesses").update({"onboarding_config": updated}).eq("id", business_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update config")
    return updated


# ── Business Hours ────────────────────────────────────────────────────────────

class BusinessHours(BaseModel):
    hours: dict  # e.g. {"monday": {"open": "09:00", "close": "18:00"}, ...}


class PushTokenUpdate(BaseModel):
    push_token: str


@router.get("/{business_id}/hours")
async def get_hours(business_id: str):
    db = get_supabase()
    result = db.table("businesses").select("onboarding_config").eq("id", business_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")
    config = result.data.get("onboarding_config") or {}
    return config.get("hours", {})


@router.put("/{business_id}/hours")
async def update_hours(business_id: str, payload: BusinessHours):
    db = get_supabase()
    biz = db.table("businesses").select("onboarding_config").eq("id", business_id).single().execute()
    if not biz.data:
        raise HTTPException(status_code=404, detail="Business not found")
    existing = biz.data.get("onboarding_config") or {}
    existing["hours"] = payload.hours
    result = db.table("businesses").update({"onboarding_config": existing}).eq("id", business_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update hours")
    return payload.hours


@router.put("/{business_id}/push-token")
async def update_push_token(business_id: str, payload: PushTokenUpdate):
    db = get_supabase()
    biz = db.table("businesses").select("onboarding_config").eq("id", business_id).single().execute()
    if not biz.data:
        raise HTTPException(status_code=404, detail="Business not found")

    existing = biz.data.get("onboarding_config") or {}
    existing["push_token"] = payload.push_token

    result = db.table("businesses").update({"onboarding_config": existing}).eq("id", business_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update push token")
    return {"ok": True}
