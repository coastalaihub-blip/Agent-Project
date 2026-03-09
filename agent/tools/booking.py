"""
Appointment booking tool — called by agent when intent = book_appointment.
Posts to backend to create the appointment in Supabase.
"""
import os
import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


async def book_appointment(
    business_id: str,
    patient_name: str,
    phone: str,
    datetime_str: str,
    doctor: str = None,
    call_id: str = None,
) -> dict:
    """
    Creates appointment in Supabase.
    Returns appointment dict or raises on failure.
    """
    payload = {
        "business_id": business_id,
        "patient_name": patient_name,
        "phone": phone,
        "datetime": datetime_str,
        "created_from_call_id": call_id,
    }
    if doctor:
        payload["doctor"] = doctor

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(f"{BACKEND_URL}/api/appointments", json=payload)
        resp.raise_for_status()
        return resp.json()


async def check_availability(business_id: str, date: str, doctor: str = None) -> list[str]:
    """
    Returns list of available time slots for given date.
    For demo: returns hardcoded slots based on onboarding config.
    """
    # TODO: implement real availability check from Supabase
    # For now return demo slots
    return ["10:00 AM", "11:00 AM", "2:00 PM", "3:30 PM", "5:00 PM"]
