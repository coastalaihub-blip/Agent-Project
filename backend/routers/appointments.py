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
    # API accepts either key; DB stores this in `datetime`.
    appointment_datetime: Optional[str] = None
    datetime: Optional[str] = None
    notes: Optional[str] = None
    created_from_call_id: Optional[str] = None


@router.get("/{business_id}")
async def list_appointments(business_id: str):
    db = get_supabase()
    result = (
        db.table("appointments")
        .select("*")
        .eq("business_id", business_id)
        .order("datetime", desc=False)
        .execute()
    )
    rows = result.data or []
    for row in rows:
        if "appointment_datetime" not in row and row.get("datetime"):
            row["appointment_datetime"] = row["datetime"]
    return rows


@router.post("/{business_id}")
async def create_appointment(business_id: str, payload: AppointmentCreate):
    db = get_supabase()
    appointment_dt = payload.appointment_datetime or payload.datetime
    if not appointment_dt:
        raise HTTPException(status_code=422, detail="appointment_datetime is required")

    row = {
        "business_id": business_id,
        "patient_name": payload.patient_name,
        "phone": payload.phone,
        "datetime": appointment_dt,
        "notes": payload.notes,
        "created_from_call_id": payload.created_from_call_id,
    }
    result = db.table("appointments").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create appointment")
    created = result.data[0]
    if "appointment_datetime" not in created and created.get("datetime"):
        created["appointment_datetime"] = created["datetime"]
    return created
