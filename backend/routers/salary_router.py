"""Роутер зарплатного модуля: /salary/*"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
from database import supabase
import auth
from utils import check_admin, calculate_job_total
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/salary", tags=["salary"])


@router.get("/settings")
def get_salary_settings(current_user: dict = Depends(check_admin)) -> list:
    """Получить настройки зарплат всех мастеров."""
    workers = supabase.table("users").select("id, name, phone, role").execute()
    settings = supabase.table("salary_settings").select("*").execute()

    settings_map = {s["user_id"]: s for s in (settings.data or [])}

    result = []
    for w in (workers.data or []):
        if w.get("role") not in ("admin", "operator"):
            s = settings_map.get(w["id"], {})
            result.append({
                "user_id": w["id"],
                "name": w.get("name") or w.get("phone"),
                "percentage": float(s.get("percentage", 60.0)),
                "fixed_bonus": float(s.get("fixed_bonus", 0)),
            })
    return result


@router.put("/settings/{user_id}")
def update_salary_settings(
    user_id: int,
    data: dict,
    current_user: dict = Depends(check_admin)
) -> dict:
    """Обновить % и бонус мастера."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can change salary settings")

    update = {
        "user_id": user_id,
        "percentage": float(data.get("percentage", 60)),
        "fixed_bonus": float(data.get("fixed_bonus", 0)),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Upsert
    existing = supabase.table("salary_settings").select("id").eq("user_id", user_id).execute()
    if existing.data:
        supabase.table("salary_settings").update(update).eq("user_id", user_id).execute()
    else:
        supabase.table("salary_settings").insert(update).execute()

    return {"status": "ok", **update}


@router.get("/calculate")
def calculate_salaries(
    month: str,
    current_user: dict = Depends(check_admin)
) -> list:
    """Рассчитать зарплаты за месяц. month=2026-04"""
    try:
        year, m = month.split("-")
        month_start = f"{year}-{m}-01T00:00:00"
        # Last day of month
        if int(m) == 12:
            month_end = f"{int(year)+1}-01-01T00:00:00"
        else:
            month_end = f"{year}-{int(m)+1:02d}-01T00:00:00"
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

    # Get completed jobs in period
    jobs_result = supabase.table("jobs") \
        .select("id, user_id, price, services, status, completed_at") \
        .eq("status", "completed") \
        .gte("completed_at", month_start) \
        .lt("completed_at", month_end) \
        .execute()
    jobs = jobs_result.data or []

    # Get salary settings
    settings_result = supabase.table("salary_settings").select("*").execute()
    settings_map = {s["user_id"]: s for s in (settings_result.data or [])}

    # Get adjustments for this month
    month_date = f"{year}-{m}-01"
    adj_result = supabase.table("salary_adjustments") \
        .select("*") \
        .eq("period_month", month_date) \
        .execute()
    adjustments = adj_result.data or []

    # Get workers
    workers_result = supabase.table("users") \
        .select("id, name, phone, role") \
        .execute()
    workers = {w["id"]: w for w in (workers_result.data or []) if w.get("role") not in ("admin", "operator")}

    # Calculate per worker
    result = []
    for user_id, worker in workers.items():
        worker_jobs = [j for j in jobs if j.get("user_id") == user_id]
        total_revenue = sum(calculate_job_total(j) for j in worker_jobs)
        job_count = len(worker_jobs)

        s = settings_map.get(user_id, {})
        pct = float(s.get("percentage", 60))
        fixed = float(s.get("fixed_bonus", 0))

        salary_base = total_revenue * (pct / 100)
        bonus_total = fixed * job_count

        # Adjustments (bonuses/penalties)
        worker_adj = [a for a in adjustments if a.get("user_id") == user_id]
        adj_total = sum(float(a.get("amount", 0)) for a in worker_adj)

        total_salary = salary_base + bonus_total + adj_total

        result.append({
            "user_id": user_id,
            "name": worker.get("name") or worker.get("phone"),
            "job_count": job_count,
            "total_revenue": round(total_revenue, 2),
            "percentage": pct,
            "salary_base": round(salary_base, 2),
            "fixed_bonus_per_job": fixed,
            "bonus_total": round(bonus_total, 2),
            "adjustments": worker_adj,
            "adj_total": round(adj_total, 2),
            "total_salary": round(total_salary, 2),
        })

    result.sort(key=lambda x: x["total_salary"], reverse=True)
    return result


@router.get("/adjustments")
def get_adjustments(
    month: str,
    current_user: dict = Depends(check_admin)
) -> list:
    """Получить бонусы/штрафы за месяц."""
    try:
        year, m = month.split("-")
        month_date = f"{year}-{m}-01"
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid month format")

    result = supabase.table("salary_adjustments") \
        .select("*") \
        .eq("period_month", month_date) \
        .order("created_at", desc=True) \
        .execute()
    return result.data or []


@router.post("/adjustments")
def create_adjustment(
    data: dict,
    current_user: dict = Depends(check_admin)
) -> dict:
    """Добавить бонус или штраф."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can add adjustments")

    required = ["user_id", "amount", "reason", "period_month"]
    for field in required:
        if field not in data:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")

    record = {
        "user_id": int(data["user_id"]),
        "amount": float(data["amount"]),
        "reason": str(data["reason"]),
        "period_month": str(data["period_month"]),
        "created_by": current_user["id"],
    }

    result = supabase.table("salary_adjustments").insert(record).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create adjustment")
    return result.data[0]


@router.delete("/adjustments/{adj_id}")
def delete_adjustment(
    adj_id: int,
    current_user: dict = Depends(check_admin)
) -> dict:
    """Удалить бонус/штраф."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete adjustments")

    supabase.table("salary_adjustments").delete().eq("id", adj_id).execute()
    return {"status": "ok"}
