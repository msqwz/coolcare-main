"""Роутер для приема Webhooks от Telegram бота.

Единый бот для мастеров и клиентов:
- Мастера получают уведомления о новых заявках
- Клиенты создают заявки, проверяют статус, ставят оценки
"""
import os
import logging
from fastapi import APIRouter, Request, BackgroundTasks, HTTPException

import telegram_bot
from client_bot import handle_client_message, handle_rating

router = APIRouter(prefix="/bot", tags=["bot"])
logger = logging.getLogger(__name__)


@router.post("/webhook", response_model=dict)
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks) -> dict:
    """Принимает обновления от Telegram (WebHook)."""
    expected_secret = os.getenv("WEBHOOK_SECRET_TOKEN")
    if expected_secret:
        received_secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
        if received_secret != expected_secret:
            logger.warning("Unauthorized webhook access attempt")
            raise HTTPException(status_code=403, detail="Invalid secret token")

    try:
        update = await request.json()

        if "message" in update:
            message = update["message"]
            chat_id = str(message["chat"]["id"])
            text = message.get("text", "")

            if not text:
                return {"status": "ok"}

            # Check if this is a rating response (state = rating_<job_id>)
            from database import supabase
            client = supabase.table("client_telegram").select("state").eq("chat_id", chat_id).execute()
            if client.data and client.data[0].get("state", "").startswith("rating_"):
                try:
                    job_id = int(client.data[0]["state"].split("_")[1])
                    background_tasks.add_task(handle_rating, chat_id, text, job_id)
                    return {"status": "ok"}
                except (ValueError, IndexError):
                    pass

            # Route all messages through client_bot (handles both workers and clients)
            background_tasks.add_task(handle_client_message, chat_id, text)

        # Handle callback queries (for future inline buttons)
        elif "callback_query" in update:
            callback = update["callback_query"]
            chat_id = str(callback["message"]["chat"]["id"])
            data = callback.get("data", "")
            logger.info(f"Callback: {data} from {chat_id}")

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {e}", exc_info=True)
        return {"status": "error"}
