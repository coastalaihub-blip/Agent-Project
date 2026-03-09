from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class BusinessSignup(BaseModel):
    owner_id: str
    name: str
    vertical: str  # "clinic" | "call_center" | "restaurant"
    onboarding_config: dict  # answers from 5-question onboarding


class BusinessResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    vertical: str
    phone_number: str
    onboarding_config: dict
    plan: str
    created_at: datetime


class CallLog(BaseModel):
    id: str
    business_id: str
    caller_number: str
    duration_sec: Optional[int]
    transcript: Optional[str]
    summary: Optional[str]
    intent: Optional[str]
    escalated: bool
    timestamp: datetime


class AppointmentCreate(BaseModel):
    business_id: str
    patient_name: str
    phone: str
    datetime: str
    created_from_call_id: Optional[str]


class ExotelWebhookPayload(BaseModel):
    CallSid: str
    From: str
    To: str
    Direction: str
    Status: str
    RecordingUrl: Optional[str] = None
    CallDuration: Optional[str] = None


class AgentResponse(BaseModel):
    text: str
    intent: str
    action: Optional[str]  # "book_appointment" | "escalate" | "answer_faq" | None
    action_data: Optional[dict]
    escalate: bool = False
