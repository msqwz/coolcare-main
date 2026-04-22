from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
import schemas
from database import supabase
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/public", tags=["public"])

@router.get("/services", response_model=List[schemas.ServiceResponse])
def get_public_services():
    """Get list of services for the landing page."""
    result = supabase.table("predefined_services").select("*").order("name").execute()
    return result.data or []

@router.post("/jobs", response_model=schemas.JobResponse)
def create_public_job(job: schemas.JobCreate, background_tasks: BackgroundTasks):
    """Create a new lead from the landing page."""
    job_data = job.model_dump(exclude_unset=True)
    
    # Force defaults for public leads
    job_data["status"] = "pending"
    job_data["priority"] = "medium"
    job_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # If user_id is still NOT NULL in DB, we might need a fallback.
    # But we'll try to insert it as NULL first.
    # NOTE: User needs to run ALTER TABLE jobs ALTER COLUMN user_id DROP NOT NULL;
    
    try:
        # If user_id is missing, try to find the first admin as a fallback
        if not job_data.get("user_id"):
            admins = supabase.table("users").select("id").eq("role", "admin").limit(1).execute()
            if admins.data:
                job_data["user_id"] = admins.data[0]["id"]
            else:
                logger.warning("No admin found for fallback user_id")

        result = supabase.table("jobs").insert(job_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create lead in database")
            
        new_job = result.data[0]
        
        # Notify admins via Telegram
        background_tasks.add_task(notify_admins_of_lead, new_job)
        
        return new_job
    except Exception as e:
        logger.error(f"Error creating public lead: {e}", exc_info=True)
        # If it's the NOT NULL constraint, we give a better error
        err_str = str(e)
        if "null value in column \"user_id\"" in err_str:
             raise HTTPException(status_code=400, detail="Backend configuration error: user_id constraint must be removed or an admin created.")
        if "column \"preferred_time\" of relation \"jobs\" does not exist" in err_str:
             raise HTTPException(status_code=400, detail="Backend configuration error: preferred_time column is missing in DB.")
        raise HTTPException(status_code=500, detail=f"Database error: {err_str}")

def notify_admins_of_lead(job_data: dict):
    """Send a notification to all admins about a new lead."""
    try:
        from telegram_bot import send_telegram_message
        # Find all admins
        admins = supabase.table("users").select("telegram_chat_id").eq("role", "admin").execute()

        # Format services list safely (services is a list of dicts)
        services_raw = job_data.get('services', [])
        if services_raw and isinstance(services_raw, list):
            services_text = ', '.join(
                s.get('description', 'Услуга') if isinstance(s, dict) else str(s)
                for s in services_raw
            )
        else:
            services_text = 'Не указаны'

        message = (
            f"🔔 НОВАЯ ЗАЯВКА С САЙТА!\n\n"
            f"👤 Клиент: {job_data.get('customer_name') or 'Не указан'}\n"
            f"📞 Телефон: {job_data.get('customer_phone') or 'Не указан'}\n"
            f"🏠 Адрес: {job_data.get('address') or 'Не указан'}\n"
            f"🛠 Услуги: {services_text}\n"
            f"⏰ Время: {job_data.get('preferred_time') or 'Не указано'}\n"
            f"📝 Описание: {job_data.get('description') or '-'}"
        )

        for admin in (admins.data or []):
            chat_id = admin.get("telegram_chat_id")
            if chat_id:
                try:
                    send_telegram_message(chat_id, message)
                except (ConnectionError, TimeoutError, ValueError) as ex:
                    logger.warning(f"Could not notify admin {chat_id}: {ex}")
    except (ImportError, ConnectionError, TimeoutError, ValueError) as e:
        logger.error(f"Error in notify_admins_of_lead: {e}")
