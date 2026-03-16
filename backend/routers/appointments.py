"""
Appointments router.
GET  /api/appointments/{business_id}  — list appointments
POST /api/appointments/{business_id}  — create appointment
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db.supabase import get_supabase

router = APIRouter()


class AppointmentCreate(BaseModel):
    patient_name: str
    phone: str
    appointment_datetime: str  # ISO string
    notes: Optional[str] = None
    created_from_call_id: Optional[str] = None


@router.get("/{business_id}")
async def list_appointments(business_id: str):
    db = get_supabase()
    result = (
        db.table("appointments")
        .select("*")
        .eq("business_id", business_id)
        .order("appointment_datetime", desc=False)
        .execute()
    )
    return result.data or []


@router.post("/{business_id}")
async def create_appointment(business_id: str, payload: AppointmentCreate):
    db = get_supabase()
    row = {
        "business_id": business_id,
        "patient_name": payload.patient_name,
        "phone": payload.phone,
        "appointment_datetime": payload.appointment_datetime,
        "notes": payload.notes,
        "created_from_call_id": payload.created_from_call_id,
    }
    result = db.table("appointments").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create appointment")
    return result.data[0]
