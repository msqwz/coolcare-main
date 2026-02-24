from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Optional
from datetime import datetime, date, timezone
import os
from dotenv import load_dotenv
from auth import router as auth_router  # ✅ Критически важно!

from database import supabase
import schemas
import auth

load_dotenv()

app = FastAPI(title="CoolCare PWA API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "*"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
app.include_router(auth_router, prefix="/auth")  # ✅ Префикс /auth

# ==================== Health ====================

@app.get("/health")
def health_check():
    """Проверка доступности сервера и Supabase"""
    try:
        result = supabase.table("users").select("id").limit(1).execute()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": str(e)}


# ==================== Auth ====================

@app.post("/auth/send-code", response_model=dict)
def send_sms_code(request: schemas.PhoneLoginRequest):
    phone = request.phone.replace(" ", "").replace("-", "")

    # Ищем или создаём пользователя
    result = supabase.table("users").select("*").eq("phone", phone).execute()

    if not result.data:
        supabase.table("users").insert({"phone": phone}).execute()

    code = auth.create_sms_code(phone)
    return {"message": "SMS code sent", "phone": phone, "debug_code": code}


@app.post("/auth/verify-code", response_model=schemas.Token)
def verify_sms_code(request: schemas.PhoneVerifyRequest):
    phone = request.phone.replace(" ", "").replace("-", "")

    if not auth.verify_sms_code(phone, request.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    result = supabase.table("users").select("*").eq("phone", phone).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = result.data[0]

    # Обновляем статус верификации
    supabase.table("users").update({"is_verified": True}).eq("id", user["id"]).execute()

    access_token = auth.create_access_token(data={"sub": str(user["id"]), "phone": user["phone"]})
    refresh_token = auth.create_refresh_token(data={"sub": str(user["id"]), "phone": user["phone"]})

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@app.post("/auth/refresh", response_model=schemas.Token)
def refresh_token(refresh_token: str):
    payload = auth.decode_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_access_token = auth.create_access_token(
        data={"sub": str(payload.user_id), "phone": payload.phone}
    )
    return {"access_token": new_access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: dict = Depends(auth.get_current_user)):
    return current_user


@app.put("/auth/me", response_model=schemas.UserResponse)
def update_current_user(
    update_data: schemas.UserUpdate,
    current_user: dict = Depends(auth.get_current_user)
):
    data = update_data.model_dump(exclude_unset=True)
    if not data:
        return current_user

    result = supabase.table("users").update(data).eq("id", current_user["id"]).execute()
    return result.data[0]


# ==================== Dashboard ====================

@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(current_user: dict = Depends(auth.get_current_user)):
    result = supabase.table("jobs") \
        .select("*") \
        .eq("user_id", current_user["id"]) \
        .execute()

    all_jobs = result.data
    today = date.today().isoformat()

    today_jobs = [j for j in all_jobs if j.get("scheduled_at") and j["scheduled_at"][:10] == today]
    scheduled_jobs = [j for j in all_jobs if j.get("status") == "scheduled"]
    active_jobs = [j for j in all_jobs if j.get("status") == "active"]
    completed_jobs = [j for j in all_jobs if j.get("status") == "completed"]
    total_revenue = sum(j.get("price") or 0 for j in completed_jobs)
    today_revenue = sum(j.get("price") or 0 for j in today_jobs if j.get("status") == "completed")

    return {
        "total_jobs": len(all_jobs),
        "today_jobs": len(today_jobs),
        "scheduled_jobs": len(scheduled_jobs),
        "active_jobs": len(active_jobs),
        "completed_jobs": len(completed_jobs),
        "total_revenue": total_revenue,
        "today_revenue": today_revenue,
    }


# ==================== Jobs ====================

@app.get("/jobs/today", response_model=List[schemas.JobResponse])
def get_today_jobs(current_user: dict = Depends(auth.get_current_user)):
    today = date.today().isoformat()

    result = supabase.table("jobs") \
        .select("*") \
        .eq("user_id", current_user["id"]) \
        .execute()

    today_jobs = [j for j in result.data if j.get("scheduled_at") and j["scheduled_at"][:10] == today]
    return sorted(today_jobs, key=lambda x: x.get("scheduled_at", ""))


@app.get("/jobs", response_model=List[schemas.JobResponse])
def get_jobs(
    status: Optional[str] = None,
    current_user: dict = Depends(auth.get_current_user)
):
    query = supabase.table("jobs").select("*").eq("user_id", current_user["id"])

    if status:
        query = query.eq("status", status)

    result = query.order("scheduled_at", desc=True).execute()
    return result.data


@app.get("/jobs/{job_id}", response_model=schemas.JobResponse)
def get_job(job_id: int, current_user: dict = Depends(auth.get_current_user)):
    result = supabase.table("jobs") \
        .select("*") \
        .eq("id", job_id) \
        .eq("user_id", current_user["id"]) \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return result.data[0]


@app.post("/jobs", response_model=schemas.JobResponse)
def create_job(
    job: schemas.JobCreate,
    current_user: dict = Depends(auth.get_current_user)
):
    job_data = job.model_dump(exclude_unset=True)

    # Преобразуем datetime в ISO-строки для Supabase
    for field in ["scheduled_at", "completed_at"]:
        if field in job_data and job_data[field]:
            if isinstance(job_data[field], datetime):
                job_data[field] = job_data[field].isoformat()
            elif isinstance(job_data[field], str):
                try:
                    dt = datetime.fromisoformat(job_data[field].replace("Z", "+00:00"))
                    job_data[field] = dt.isoformat()
                except (ValueError, TypeError):
                    del job_data[field]

    job_data["user_id"] = current_user["id"]

    result = supabase.table("jobs").insert(job_data).execute()
    return result.data[0]


@app.put("/jobs/{job_id}", response_model=schemas.JobResponse)
def update_job(
    job_id: int,
    job_update: schemas.JobUpdate,
    current_user: dict = Depends(auth.get_current_user)
):
    # Проверяем что заявка принадлежит пользователю
    existing = supabase.table("jobs") \
        .select("id") \
        .eq("id", job_id) \
        .eq("user_id", current_user["id"]) \
        .execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = job_update.model_dump(exclude_unset=True)

    # Преобразуем datetime в ISO-строки
    for field in ["scheduled_at", "completed_at"]:
        if field in update_data and update_data[field]:
            if isinstance(update_data[field], datetime):
                update_data[field] = update_data[field].isoformat()
            elif isinstance(update_data[field], str):
                try:
                    dt = datetime.fromisoformat(update_data[field].replace("Z", "+00:00"))
                    update_data[field] = dt.isoformat()
                except (ValueError, TypeError):
                    del update_data[field]

    if not update_data:
        result = supabase.table("jobs").select("*").eq("id", job_id).execute()
        return result.data[0]

    result = supabase.table("jobs").update(update_data).eq("id", job_id).execute()
    return result.data[0]


@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, current_user: dict = Depends(auth.get_current_user)):
    existing = supabase.table("jobs") \
        .select("id") \
        .eq("id", job_id) \
        .eq("user_id", current_user["id"]) \
        .execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Job not found")

    supabase.table("jobs").delete().eq("id", job_id).execute()
    return {"message": "Job deleted"}


# ==================== Static Files ====================

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        index_path = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path, media_type="text/html")
        return {"error": "Frontend not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
