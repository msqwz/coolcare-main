from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler

# === НАСТРОЙКА ЛОГГИРОВАНИЯ ===
log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app.log')
file_handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
file_handler.setFormatter(log_formatter)
file_handler.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
console_handler.setLevel(logging.INFO)

logging.basicConfig(level=logging.INFO, handlers=[file_handler, console_handler])

for log_name in ["uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"]:
    logger = logging.getLogger(log_name)
    logger.addHandler(file_handler)
    logger.setLevel(logging.INFO)

logger = logging.getLogger(__name__)

load_dotenv()

# === Rate Limiting ===
from app_limiter import limiter
logger = logging.getLogger(__name__)

# === Роутеры ===
from routers.auth_router import router as auth_router
from routers.dashboard_router import router as dashboard_router
from routers.jobs_router import router as jobs_router
from routers.admin_router import router as admin_router
from routers.push_router import router as push_router
from routers.public_router import router as public_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: запускаем фоновые задачи при старте."""
    try:
        from push_service import start_reminder_loop
        start_reminder_loop()
    except ImportError:
        logger.warning("push_service not found, skipping reminder loop")
    except (RuntimeError, OSError) as e:
        logger.error(f"Error starting reminder loop: {e}", exc_info=True)
        
    try:
        from telegram_bot import setup_webhook
        # Используем переменные окружения для гибкости
        webhook_url = os.getenv("WEBHOOK_URL", "https://plus-cool.ru")
        setup_webhook(webhook_url)
    except (ImportError, RuntimeError, OSError) as e:
        logger.error(f"Error setting up Telegram webhook: {e}", exc_info=True)
        
    yield


app = FastAPI(title="CoolCare PWA API", version="3.0.0", lifespan=lifespan)

# === Rate Limiting Setup ===
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    origin = request.headers.get("origin")
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://82.97.243.212",
        "https://plus-cool.ru",
    ]
    headers_cors = {}
    if origin in allowed_origins:
        headers_cors["Access-Control-Allow-Origin"] = origin
        headers_cors["Access-Control-Allow-Credentials"] = "true"
        
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
        headers=headers_cors
    )


# === CORS Middleware ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://82.97.243.212",
        "https://plus-cool.ru",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Подключаем роутеры ===
app.include_router(public_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(jobs_router)
app.include_router(admin_router)
app.include_router(push_router)

from routers.bot_router import router as bot_router
app.include_router(bot_router)

# === Пути к фронтенду ===
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'dist')
DISPATCHER_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dispatcher', 'dist')


# ==================== Health ====================

@app.get("/health")
def health_check():
    """Проверка доступности сервера и Supabase."""
    try:
        from database import supabase
        _ = supabase.table("users").select("id").limit(1).execute()
        return {"status": "ok", "database": "connected"}
    except (ImportError, ConnectionError, TimeoutError) as e:
        return {"status": "degraded", "database": str(e)}


# ==================== Static Files (Frontend & Dispatcher) ====================

def serve_spa(dist_dir: str, full_path: str):
    if not os.path.exists(dist_dir):
        logger.error(f"Build directory NOT FOUND: {dist_dir}")
        raise HTTPException(status_code=500, detail="Build directory not found")

    clean_path = full_path.strip("/")
    # Защита от Path Traversal
    file_path = os.path.normpath(os.path.join(dist_dir, clean_path))
    
    # Проверка, что путь не выходит за пределы dist_dir
    if not file_path.startswith(os.path.normpath(dist_dir)):
        logger.warning(f"SECURITY: Attempted path traversal: {clean_path}")
        raise HTTPException(status_code=403, detail="Forbidden")

    if os.path.isfile(file_path):
        return FileResponse(file_path)

    is_asset = "." in clean_path or clean_path.startswith("assets/")

    if is_asset:
        raise HTTPException(status_code=404, detail=f"Asset {clean_path} not found")

    index_path = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type="text/html")

    logger.error(f"index.html NOT FOUND in {dist_dir}")
    raise HTTPException(status_code=500, detail="index.html not found")


@app.get("/admin")
@app.get("/admin/")
@app.get("/admin/{full_path:path}")
async def serve_admin(full_path: str = ""):
    """Обслуживание Диспетчерской CRM."""
    return serve_spa(DISPATCHER_DIST, full_path)


@app.get("/{full_path:path}")
async def serve_main_app(full_path: str = ""):
    """Обслуживание основного PWA приложения."""
    api_prefixes = ["auth", "jobs", "push", "dashboard", "admin", "health", "public"]
    if any(full_path.strip("/").startswith(p) for p in api_prefixes):
        raise HTTPException(status_code=404)

    return serve_spa(FRONTEND_DIST, full_path)


# ==================== Запуск ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
