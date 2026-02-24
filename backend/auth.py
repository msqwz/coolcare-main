import os  # ✅ Добавлен импорт!
import random
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from database import supabase
from schemas import TokenData

load_dotenv()

# === Настройки JWT ===
SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

security = HTTPBearer()
router = APIRouter()  # ✅ Создаём роутер


# === Модели запросов/ответов ===
class SendCodeRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+?[0-9]{10,15}$")

class VerifyCodeRequest(BaseModel):
    phone: str
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# === Утилиты ===
def generate_sms_code() -> str:
    return str(random.randint(100000, 999999))


def create_sms_code(phone: str) -> str:
    """Создаёт SMS-код и сохраняет в Supabase"""
    code = generate_sms_code()
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    # Удаляем старые коды для этого номера
    supabase.table("sms_codes").delete().eq("phone", phone).execute()

    # Сохраняем новый
    supabase.table("sms_codes").insert({
        "phone": phone,
        "code": code,
        "expires_at": expires,
        "used": False
    }).execute()

    # 🔐 В продакшене здесь должна быть отправка SMS через провайдера!
    print(f"📱 SMS код для {phone}: {code}")  # Только для тестов!
    
    return code


def verify_sms_code(phone: str, code: str) -> bool:
    """Проверяет SMS-код из Supabase"""
    result = supabase.table("sms_codes") \
        .select("*") \
        .eq("phone", phone) \
        .eq("code", code) \
        .eq("used", False) \
        .gte("expires_at", datetime.now(timezone.utc).isoformat()) \
        .execute()
    
    if result.data and len(result.data) > 0:
        # Помечаем код как использованный
        supabase.table("sms_codes") \
            .update({"used": True}) \
            .eq("id", result.data[0]["id"]) \
            .execute()
        return True
    return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Создаёт JWT токен"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Зависимость для защиты маршрутов"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return TokenData(phone=phone)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# === 🔥 API Эндпоинты ===

@router.post("/send-code", status_code=status.HTTP_200_OK)
async def send_code(request: SendCodeRequest):
    """Отправляет код подтверждения на телефон"""
    try:
        code = create_sms_code(request.phone)
        return {"status": "ok", "message": "Code sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send code: {str(e)}")


@router.post("/verify-code", response_model=TokenResponse)
async def verify_code(request: VerifyCodeRequest):
    """Проверяет код и выдаёт JWT токен"""
    if not verify_sms_code(request.phone, request.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    
    # Создаём токен
    access_token = create_access_token(data={"sub": request.phone})
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=TokenData)
async def get_me(current_user: TokenData = Depends(get_current_user)):
    """Возвращает данные текущего пользователя (защищённый маршрут)"""
    return current_user
