from fastapi import APIRouter, HTTPException
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
