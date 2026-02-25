from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime, date, timezone
import os
from dotenv import load_dotenv

from database import supabase
import schemas
import auth

# Загружаем переменные окружения
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: запускаем фоновые задачи при старте"""
    try:
        from push_service import start_reminder_loop
        start_reminder_loop()
    except ImportError:
        print("⚠️  push_service not found, skipping reminder loop")
    except Exception as e:
        print(f"⚠️  Error starting reminder loop: {e}")
    yield


app = FastAPI(title="CoolCare PWA API", version="3.0.0", lifespan=lifespan)

# === CORS Middleware ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://82.97.243.212", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Пути к фронтенду ===
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'dist')


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
def refresh_token_endpoint(request: schemas.RefreshRequest):
    payload = auth.decode_token(request.refresh_token)
    if not payload or not payload.user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = supabase.table("users").select("*").eq("id", payload.user_id).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="User not found")
    user = result.data[0]

    new_access_token = auth.create_access_token(
        data={"sub": str(user["id"]), "phone": user["phone"]}
    )
    return {
        "access_token": new_access_token,
        "refresh_token": request.refresh_token,
        "token_type": "bearer",
    }


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

    all_jobs = result.data or []
    today = date.today().isoformat()

    today_jobs = [j for j in all_jobs if j.get("scheduled_at") and j["scheduled_at"][:10] == today]
    scheduled_jobs = [j for j in all_jobs if j.get("status") == "scheduled"]
    active_jobs = [j for j in all_jobs if j.get("status") == "active"]
    completed_jobs = [j for j in all_jobs if j.get("status") == "completed"]
    cancelled_jobs = [j for j in all_jobs if j.get("status") == "cancelled"]
    total_revenue = sum(j.get("price") or 0 for j in completed_jobs)
    today_revenue = sum(j.get("price") or 0 for j in today_jobs if j.get("status") == "completed")

    return {
        "total_jobs": len(all_jobs),
        "today_jobs": len(today_jobs),
        "scheduled_jobs": len(scheduled_jobs),
        "active_jobs": len(active_jobs),
        "completed_jobs": len(completed_jobs),
        "cancelled_jobs": len(cancelled_jobs),
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

    today_jobs = [j for j in (result.data or []) if j.get("scheduled_at") and j["scheduled_at"][:10] == today]
    return sorted(today_jobs, key=lambda x: x.get("scheduled_at", ""))


@app.get("/jobs/route/optimize")
def get_route_optimize(
    date_str: str,
    current_user: dict = Depends(auth.get_current_user)
):
    """Оптимизация порядка визитов (nearest-neighbour) для заявок на указанную дату."""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")

    result = supabase.table("jobs") \
        .select("*") \
        .eq("user_id", current_user["id"]) \
        .execute()

    jobs_data = result.data or []
    
    jobs_with_coords = [
        j for j in jobs_data
        if j.get("scheduled_at") and j["scheduled_at"][:10] == target_date.isoformat()
        and j.get("latitude") is not None and j.get("longitude") is not None
    ]

    if len(jobs_with_coords) < 2:
        return {"order": [j["id"] for j in jobs_with_coords], "jobs": jobs_with_coords, "total_distance_km": 0}

    import math
    def dist(a, b):
        lat1, lon1 = a["latitude"], a["longitude"]
        lat2, lon2 = b["latitude"], b["longitude"]
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        x = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        return 2 * R * math.asin(math.sqrt(x))

    order = []
    remaining = list(jobs_with_coords)
    current = remaining.pop(0)
    order.append(current["id"])
    total_km = 0.0

    while remaining:
        nearest = min(remaining, key=lambda j: dist(current, j))
        total_km += dist(current, nearest)
        current = nearest
        remaining.remove(nearest)
        order.append(current["id"])

    jobs_ordered = [next(j for j in jobs_with_coords if j["id"] == id_) for id_ in order]
    return {"order": order, "jobs": jobs_ordered, "total_distance_km": round(total_km, 2)}


@app.get("/jobs", response_model=List[schemas.JobResponse])
def get_jobs(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(auth.get_current_user)
):
    query = supabase.table("jobs").select("*").eq("user_id", current_user["id"])

    if status_filter:
        query = query.eq("status", status_filter)

    result = query.order("scheduled_at", desc=True).execute()
    return result.data or []


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
    job_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = supabase.table("jobs").insert(job_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to insert job to database")
        return result.data[0]
    except Exception as e:
        print(f"❌ Error creating job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


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
        return result.data[0] if result.data else None

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = supabase.table("jobs").update(update_data).eq("id", job_id).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update job in database")
        return result.data[0]
    except Exception as e:
        print(f"❌ Error updating job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


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


# ==================== Push ====================

@app.get("/push/vapid-public")
def get_vapid_public():
    """Возвращает публичный VAPID ключ для Web Push подписки."""
    try:
        from push_service import VAPID_PUBLIC
        if not VAPID_PUBLIC:
            raise HTTPException(status_code=503, detail="Push notifications not configured")
        return {"vapid_public": VAPID_PUBLIC}
    except ImportError:
        raise HTTPException(status_code=503, detail="Push service not available")


@app.post("/push/subscribe")
def push_subscribe(
    request: schemas.PushSubscribeRequest,
    current_user: dict = Depends(auth.get_current_user)
):
    """Сохраняет Web Push подписку пользователя."""
    sub_data = {
        "user_id": current_user["id"],
        "endpoint": request.endpoint,
        "p256dh_key": request.keys.p256dh,
        "auth_key": request.keys.auth,
    }
    existing = supabase.table("push_subscriptions").select("id").eq("user_id", current_user["id"]).execute()
    if existing.data:
        supabase.table("push_subscriptions").update(sub_data).eq("user_id", current_user["id"]).execute()
    else:
        supabase.table("push_subscriptions").insert(sub_data).execute()
    return {"status": "ok"}


# ==================== Static Files (Frontend) ====================

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve frontend SPA with fallback to index.html"""
        # Не проксируем API пути
        if full_path.startswith("auth/") or full_path.startswith("jobs/") or full_path.startswith("push/"):
            return {"error": "API endpoint not found"}
        
        index_path = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path, media_type="text/html")
        return {"error": "Frontend not found"}


# ==================== Запуск ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
