"""Логика Telegram-бота для клиентов CoolCare.

FSM состояния: idle → awaiting_name → awaiting_phone → awaiting_address
                  → awaiting_description → awaiting_time → confirm
"""
import logging
import json
from database import supabase
from telegram_bot import send_telegram_message
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# FSM States
IDLE = "idle"
AWAITING_NAME = "awaiting_name"
AWAITING_PHONE = "awaiting_phone"
AWAITING_ADDRESS = "awaiting_address"
AWAITING_DESCRIPTION = "awaiting_description"
AWAITING_TIME = "awaiting_time"
CONFIRM = "confirm"

# Keyboards
CLIENT_MAIN_MENU = {
    "keyboard": [
        [{"text": "📋 Оставить заявку"}, {"text": "📊 Мои заявки"}]
    ],
    "resize_keyboard": True,
    "is_persistent": True
}

CANCEL_MENU = {
    "keyboard": [
        [{"text": "❌ Отмена"}]
    ],
    "resize_keyboard": True
}

RATING_MENU = {
    "keyboard": [
        [{"text": "1"}, {"text": "2"}, {"text": "3"}, {"text": "4"}, {"text": "5"}],
        [{"text": "❌ Отмена"}]
    ],
    "resize_keyboard": True,
    "one_time_keyboard": True
}


def get_or_create_client(chat_id: str) -> dict:
    """Получить или создать клиента."""
    result = supabase.table("client_telegram").select("*").eq("chat_id", str(chat_id)).execute()
    if result.data:
        return result.data[0]
    # Create new
    new_client = {"chat_id": str(chat_id), "state": IDLE, "state_data": {}}
    insert = supabase.table("client_telegram").insert(new_client).execute()
    return insert.data[0] if insert.data else new_client


def update_client_state(chat_id: str, state: str, state_data: dict = None):
    """Обновить состояние FSM клиента."""
    update = {"state": state}
    if state_data is not None:
        update["state_data"] = json.dumps(state_data) if isinstance(state_data, dict) else state_data
    supabase.table("client_telegram").update(update).eq("chat_id", str(chat_id)).execute()


def is_worker(chat_id: str) -> bool:
    """Проверить, является ли chat_id мастером."""
    result = supabase.table("users").select("id").eq("telegram_chat_id", str(chat_id)).execute()
    return bool(result.data)


def handle_client_message(chat_id: str, text: str) -> None:
    """Главный обработчик сообщений клиента."""
    chat_id = str(chat_id)

    # Проверяем — мастер или клиент
    if is_worker(chat_id):
        # Мастер — показываем его Chat ID (как раньше)
        if text.startswith("/start"):
            reply = (
                f"Привет, мастер! 🔧\n\n"
                f"Твой <b>Chat ID</b>: <code>{chat_id}</code>\n\n"
                f"Этот бот отправляет тебе новые заявки."
            )
            send_telegram_message(chat_id, reply)
        return

    # Клиент
    client = get_or_create_client(chat_id)
    state = client.get("state", IDLE)
    state_data = client.get("state_data", {})
    if isinstance(state_data, str):
        try:
            state_data = json.loads(state_data)
        except (json.JSONDecodeError, TypeError):
            state_data = {}

    # Команды
    if text.startswith("/start"):
        handle_start(chat_id)
        return
    if text.startswith("/order") or text == "📋 Оставить заявку":
        start_order(chat_id)
        return
    if text.startswith("/status") or text == "📊 Статус заявки" or text == "📊 Мои заявки":
        handle_status_check(chat_id, text)
        return
    if text == "/cancel" or text == "❌ Отмена":
        cancel_order(chat_id)
        return

    # FSM обработка
    if state == AWAITING_NAME:
        state_data["name"] = text.strip()
        update_client_state(chat_id, AWAITING_PHONE, state_data)
        # Save name
        supabase.table("client_telegram").update({"name": text.strip()}).eq("chat_id", chat_id).execute()
        send_telegram_message(chat_id, "📞 Укажите ваш номер телефона:", CANCEL_MENU)

    elif state == AWAITING_PHONE:
        state_data["phone"] = text.strip()
        update_client_state(chat_id, AWAITING_ADDRESS, state_data)
        supabase.table("client_telegram").update({"phone": text.strip()}).eq("chat_id", chat_id).execute()
        send_telegram_message(chat_id, "📍 Укажите адрес (город, улица, дом, квартира):", CANCEL_MENU)

    elif state == AWAITING_ADDRESS:
        state_data["address"] = text.strip()
        update_client_state(chat_id, AWAITING_DESCRIPTION, state_data)
        send_telegram_message(chat_id, "🔧 Опишите проблему (что сломалось, модель техники):", CANCEL_MENU)

    elif state == AWAITING_DESCRIPTION:
        state_data["description"] = text.strip()
        update_client_state(chat_id, AWAITING_TIME, state_data)
        send_telegram_message(chat_id, "⏰ Удобное время визита мастера:\n(например: «завтра после 14:00» или «в любое время»)", CANCEL_MENU)

    elif state == AWAITING_TIME:
        state_data["preferred_time"] = text.strip()
        update_client_state(chat_id, CONFIRM, state_data)

        summary = (
            f"📋 <b>Проверьте заявку:</b>\n\n"
            f"👤 Имя: {state_data.get('name', '—')}\n"
            f"📞 Телефон: {state_data.get('phone', '—')}\n"
            f"📍 Адрес: {state_data.get('address', '—')}\n"
            f"🔧 Проблема: {state_data.get('description', '—')}\n"
            f"⏰ Время: {state_data.get('preferred_time', '—')}\n\n"
            f"Отправить заявку? Напишите <b>Да</b> или <b>Нет</b>"
        )
        send_telegram_message(chat_id, summary, {
            "keyboard": [[{"text": "✅ Да, всё верно"}, {"text": "❌ Отмена"}]],
            "resize_keyboard": True, "one_time_keyboard": True
        })

    elif state == CONFIRM:
        if text.lower() in ("да", "yes", "ок", "ok", "подтверждаю", "✅ да, всё верно"):
            create_job_from_bot(chat_id, state_data)
        else:
            cancel_order(chat_id)

    else:
        # Unknown state — show menu
        handle_start(chat_id)


def handle_start(chat_id: str):
    """Приветственное сообщение с меню."""
    client = get_or_create_client(chat_id)
    name = client.get("name")
    greeting = f"Привет, {name}! " if name else "Привет! "

    msg = (
        f"{greeting}❄️ Это бот <b>CoolCare</b> — ремонт и обслуживание кондиционеров.\n\n"
        f"Что я умею:\n"
        f"📋 /order — Оставить заявку на ремонт\n"
        f"📊 /status — Проверить статус заявки\n\n"
        f"Нажмите /order чтобы начать!"
    )
    update_client_state(chat_id, IDLE)
    send_telegram_message(chat_id, msg, CLIENT_MAIN_MENU)


def start_order(chat_id: str):
    """Начать процесс создания заявки."""
    client = get_or_create_client(chat_id)

    # Если уже есть имя — пропускаем этап
    if client.get("name"):
        state_data = {"name": client["name"]}
        if client.get("phone"):
            state_data["phone"] = client["phone"]
            update_client_state(chat_id, AWAITING_ADDRESS, state_data)
            send_telegram_message(chat_id,
                f"👤 {client['name']}, 📞 {client['phone']}\n\n"
                f"📍 Укажите адрес:\n"
                f"(или нажмите Отмена для отмены)"
            , CANCEL_MENU)
        else:
            update_client_state(chat_id, AWAITING_PHONE, state_data)
            send_telegram_message(chat_id, f"👤 {client['name']}\n\n📞 Укажите номер телефона:", {"keyboard":[[{"text": "📞 Отправить мой номер", "request_contact": True}], [{"text": "❌ Отмена"}]], "resize_keyboard": True})
    else:
        update_client_state(chat_id, AWAITING_NAME, {})
        send_telegram_message(chat_id, "👤 Как вас зовут?", CANCEL_MENU)


def cancel_order(chat_id: str):
    """Отменить процесс заявки."""
    update_client_state(chat_id, IDLE, {})
    send_telegram_message(chat_id, "❌ Заявка отменена.", CLIENT_MAIN_MENU)


def create_job_from_bot(chat_id: str, data: dict):
    """Создать заявку в БД из данных бота."""
    try:
        # Find fallback admin
        admins = supabase.table("users").select("id").eq("role", "admin").limit(1).execute()
        admin_id = admins.data[0]["id"] if admins.data else None

        job_data = {
            "customer_name": data.get("name"),
            "customer_phone": data.get("phone"),
            "address": data.get("address"),
            "description": data.get("description"),
            "preferred_time": data.get("preferred_time"),
            "status": "pending",
            "priority": "medium",
            "source": "telegram",
            "client_chat_id": chat_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if admin_id:
            job_data["user_id"] = admin_id

        result = supabase.table("jobs").insert(job_data).execute()

        if result.data:
            job_id = result.data[0]["id"]
            update_client_state(chat_id, IDLE, {})

            send_telegram_message(chat_id,
                f"✅ <b>Заявка #{job_id} создана!</b>\n\n"
                f"Мы свяжемся с вами в ближайшее время.\n"
                f"Проверить статус: <b>Мои заявки</b> 📊\n\n"
                f"Спасибо, что выбрали CoolCare! ❄️",
                CLIENT_MAIN_MENU
            )

            # Notify admins
            notify_admins_new_bot_order(result.data[0])
        else:
            send_telegram_message(chat_id, "😔 Произошла ошибка. Попробуйте позже или позвоните нам.")

    except (ConnectionError, TimeoutError, ValueError, KeyError) as e:
        logger.error(f"Error creating job from bot: {e}", exc_info=True)
        send_telegram_message(chat_id, "😔 Произошла ошибка. Попробуйте позже.", CLIENT_MAIN_MENU)
        update_client_state(chat_id, IDLE, {})


def handle_status_check(chat_id: str, text: str):
    """Проверить статус последней заявки клиента."""
    # Find jobs linked to this chat_id
    result = supabase.table("jobs") \
        .select("id, status, customer_name, address, scheduled_at") \
        .eq("client_chat_id", str(chat_id)) \
        .order("created_at", desc=True) \
        .limit(3) \
        .execute()

    if not result.data:
        send_telegram_message(chat_id, "📊 У вас пока нет заявок.", CLIENT_MAIN_MENU)
        return

    status_labels = {
        "pending": "⏳ Ожидает",
        "scheduled": "📅 Назначена",
        "active": "🔧 В работе",
        "completed": "✅ Завершена",
        "cancelled": "❌ Отменена",
    }

    lines = ["📊 <b>Ваши заявки:</b>\n"]
    for job in result.data:
        status = status_labels.get(job.get("status"), job.get("status", "?"))
        lines.append(
            f"  #{job['id']} — {status}\n"
            f"  📍 {job.get('address', '—')}\n"
        )

    send_telegram_message(chat_id, "\n".join(lines), CLIENT_MAIN_MENU)


def notify_admins_new_bot_order(job: dict):
    """Уведомить админов о новой заявке из Telegram."""
    try:
        admins = supabase.table("users").select("telegram_chat_id").eq("role", "admin").execute()
        msg = (
            f"🤖 НОВАЯ ЗАЯВКА ИЗ TELEGRAM!\n\n"
            f"👤 {job.get('customer_name', '—')}\n"
            f"📞 {job.get('customer_phone', '—')}\n"
            f"📍 {job.get('address', '—')}\n"
            f"🔧 {job.get('description', '—')}\n"
            f"⏰ {job.get('preferred_time', '—')}\n"
            f"📋 Заявка #{job.get('id')}"
        )
        for admin in (admins.data or []):
            if admin.get("telegram_chat_id"):
                send_telegram_message(admin["telegram_chat_id"], msg)
    except (ConnectionError, TimeoutError, ValueError) as e:
        logger.error(f"Error notifying admins about bot order: {e}")


def notify_client_status_change(job: dict, old_status: str, new_status: str):
    """Уведомить клиента об изменении статуса заявки."""
    chat_id = job.get("client_chat_id")
    if not chat_id:
        return

    status_messages = {
        "scheduled": "📅 Ваша заявка #{id} назначена! Мастер приедет к вам.",
        "active": "🔧 Мастер уже работает над вашей заявкой #{id}!",
        "completed": "✅ Заявка #{id} завершена!\n\nОцените работу мастера:\n1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣\n\nОтправьте цифру от 1 до 5.",
        "cancelled": "❌ Заявка #{id} отменена.",
    }

    msg_template = status_messages.get(new_status)
    if msg_template:
        msg = msg_template.format(id=job.get("id", "?"))

        # Add worker info when scheduled
        if new_status == "scheduled" and job.get("user_id"):
            worker = supabase.table("users").select("name, phone").eq("id", job["user_id"]).execute()
            if worker.data:
                w = worker.data[0]
                msg += f"\n\n👷 Мастер: {w.get('name', '—')}\n📞 {w.get('phone', '')}"

        if new_status == "completed":
            send_telegram_message(chat_id, msg, RATING_MENU)
        else:
            send_telegram_message(chat_id, msg)

        # Set state for rating if completed
        if new_status == "completed":
            update_client_state(chat_id, f"rating_{job.get('id')}", {})


def handle_rating(chat_id: str, text: str, job_id: int):
    """Сохранить оценку клиента."""
    try:
        rating = int(text.strip())
        if 1 <= rating <= 5:
            supabase.table("job_ratings").insert({
                "job_id": job_id,
                "chat_id": str(chat_id),
                "rating": rating,
            }).execute()

            stars = "⭐" * rating
            send_telegram_message(chat_id,
                f"Спасибо за оценку! {stars}\n\n"
                f"Мы ценим ваше мнение. До встречи! ❄️",
                CLIENT_MAIN_MENU
            )
            update_client_state(chat_id, IDLE, {})
        else:
            send_telegram_message(chat_id, "Пожалуйста, отправьте число от 1 до 5.", RATING_MENU)
    except (ValueError, TypeError):
        send_telegram_message(chat_id, "Пожалуйста, отправьте число от 1 до 5.", RATING_MENU)
