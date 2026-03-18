import os
from typing import Optional

import httpx


EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_expo_push(
    expo_push_token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> bool:
    """Send an Expo push notification. Returns True when Expo accepts the message."""
    if not expo_push_token:
        return False

    enabled = os.getenv("EXPO_PUSH_ENABLED", "true").lower() in {"1", "true", "yes"}
    if not enabled:
        return False

    payload = {
        "to": expo_push_token,
        "title": title,
        "body": body,
        "sound": "default",
        "channelId": "escalations",
        "data": data or {},
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(EXPO_PUSH_URL, json=payload)
        if resp.status_code >= 400:
            return False
        result = resp.json()
        status = ((result.get("data") or {}).get("status") or "").lower()
        return status == "ok"
