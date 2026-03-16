"""
Agent Instructions router.
POST /api/agent/instruct        — send a runtime instruction to the agent
GET  /api/agent/instructions/{business_id} — read active instructions (agent reads at call start)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db.supabase import get_supabase

router = APIRouter()


class InstructionCreate(BaseModel):
    business_id: str
    instruction: str
    created_by: Optional[str] = "owner"  # 'owner' | 'agent'


@router.post("/instruct")
async def send_instruction(payload: InstructionCreate):
    db = get_supabase()
    row = {
        "business_id": payload.business_id,
        "instruction": payload.instruction,
        "created_by": payload.created_by,
        "is_active": True,
    }
    result = db.table("agent_instructions").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save instruction")
    return result.data[0]


@router.get("/instructions/{business_id}")
async def get_instructions(business_id: str):
    db = get_supabase()
    result = (
        db.table("agent_instructions")
        .select("*")
        .eq("business_id", business_id)
        .eq("is_active", True)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    return result.data or []
