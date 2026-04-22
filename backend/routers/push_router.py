"""Роутер Push-уведомлений: /push/*"""
from fastapi import APIRouter, Depends, HTTPException
from database import supabase
import schemas
import auth

router = APIRouter(prefix="/push", tags=["push"])


@router.get("/vapid-public", response_model=dict)
def get_vapid_public() -> dict:
    """Возвращает публичный VAPID ключ для Web Push подписки."""
    try:
        from push_service import VAPID_PUBLIC
        if not VAPID_PUBLIC:
            raise HTTPException(status_code=503, detail="Push notifications not configured")
        return {"vapid_public": VAPID_PUBLIC}
    except ImportError:
        raise HTTPException(status_code=503, detail="Push service not available")


@router.post("/subscribe", response_model=dict)
def push_subscribe(
    request: schemas.PushSubscribeRequest,
    current_user: dict = Depends(auth.get_current_user)
) -> dict:
    """Сохраняет Web Push подписку пользователя (поддержка нескольких устройств)."""
    sub_data = {
        "user_id": current_user["id"],
        "endpoint": request.endpoint,
        "p256dh_key": request.keys.p256dh,
        "auth_key": request.keys.auth,
    }
    # Upsert by endpoint (unique per browser), not user_id — allows multiple devices
    existing = supabase.table("push_subscriptions").select("id").eq("endpoint", request.endpoint).execute()
    if existing.data:
        supabase.table("push_subscriptions").update(sub_data).eq("endpoint", request.endpoint).execute()
    else:
        supabase.table("push_subscriptions").insert(sub_data).execute()
    return {"status": "ok"}
