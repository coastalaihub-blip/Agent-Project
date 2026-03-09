from fastapi import APIRouter, HTTPException
from db.supabase import get_supabase
from models.schemas import CallLog
from typing import List

router = APIRouter()


@router.get("/{business_id}", response_model=List[CallLog])
async def list_calls(business_id: str, limit: int = 50, offset: int = 0):
    db = get_supabase()
    result = (
        db.table("calls")
        .select("*")
        .eq("business_id", business_id)
        .order("timestamp", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []


@router.get("/detail/{call_id}", response_model=CallLog)
async def get_call(call_id: str):
    db = get_supabase()
    result = db.table("calls").select("*").eq("id", call_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Call not found")
    return result.data


@router.get("/{business_id}/stats")
async def get_call_stats(business_id: str):
    db = get_supabase()
    calls = db.table("calls").select("*").eq("business_id", business_id).execute().data or []
    return {
        "total_calls": len(calls),
        "escalated": sum(1 for c in calls if c.get("escalated")),
        "appointments_booked": db.table("appointments")
            .select("id", count="exact")
            .eq("business_id", business_id)
            .execute()
            .count or 0,
    }
