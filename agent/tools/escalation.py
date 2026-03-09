"""
Escalation tool — fires push notification to business owner.
"""
import os
import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


async def escalate(
    business_id: str,
    caller_number: str,
    call_sid: str,
    reason: str = "Caller requested to speak with staff",
) -> dict:
    """
    Sends push notification to business owner's device.
    Backend handles the actual push via Expo/FCM.
    """
    payload = {
        "business_id": business_id,
        "caller_number": caller_number,
        "call_sid": call_sid,
        "reason": reason,
        "type": "escalation",
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(f"{BACKEND_URL}/api/notifications/escalate", json=payload)
            resp.raise_for_status()
            return {"escalated": True, "notification_sent": True}
    except Exception as e:
        print(f"[escalation] Push notification failed: {e}")
        return {"escalated": True, "notification_sent": False}
