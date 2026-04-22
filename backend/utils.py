"""Утилиты для CoolCare API."""
from fastapi import Depends, HTTPException
import auth
import logging
from typing import Any
from database import supabase_admin

logger = logging.getLogger(__name__)


def check_admin(current_user: dict = Depends(auth.get_current_user)):
    """Проверка прав администратора или оператора."""
    if current_user.get("role") not in ("admin", "operator"):
        raise HTTPException(status_code=403, detail="Admin or operator access required")
    return current_user


def calculate_job_total(job: dict) -> float:
    """Расчет общей стоимости заявки: либо основная цена, либо сумма услуг."""
    price = float(job.get("price") or 0)
    if price > 0:
        return price

    services = job.get("services") or []
    total = 0.0
    for s in services:
        if isinstance(s, dict):
            p = float(s.get("price") or 0)
            q = float(s.get("quantity") or 1)
            total += p * q
    return total


def auto_calc_services_price(data: dict) -> dict:
    """Автопересчёт цены из услуг, если есть services."""
    services = data.get("services") or []
    if services:
        total = sum(
            float(s.get("price") or 0) * float(s.get("quantity") or 1)
            for s in services if isinstance(s, dict)
        )
        if total > 0:
            data["price"] = total
    return data


def log_audit_change(job_id: int, user_id: int, field_name: str, old_value: Any, new_value: Any):
    """Записывает изменение поля в аудит лог."""
    try:
        supabase_admin.table("job_audit_logs").insert({
            "job_id": job_id,
            "user_id": user_id,
            "field_name": field_name,
            "old_value": str(old_value if old_value is not None else ""),
            "new_value": str(new_value if new_value is not None else "")
        }).execute()
    except (ConnectionError, TimeoutError, ValueError) as log_err:
        logger.error(f"Failed to write audit log for {field_name}: {log_err}")
