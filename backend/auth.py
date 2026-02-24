import os
import random
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, APIRouter, Path, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from pydantic import BaseModel, Field, validator

from database import supabase
from schemas import TokenData

load_dotenv()

# === Настройки ===
SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

security = HTTPBearer()
router = APIRouter()


# === Утилиты ===
def normalize_phone(phone: str) -> str:
    """Приводит телефон к единому формату: +79991234567"""
    # Убираем всё кроме цифр и +
    cleaned = ''.join(c for c in phone if c.isdigit() or c == '+')
    # Если начинается с 8, заменяем на +7
    if cleaned.startswith('8') and len(cleaned) == 11:
        cleaned = '+7' + cleaned[1:]
    # Если нет + в начале, добавляем
    if not cleaned.startswith('+'):
        cleaned = '+' + cleaned
    return cleaned


def generate_sms_code() -> str:
    return str(random.randint(100000, 999999))


# === Модели ===
class SendCodeRequest(BaseModel):
    phone: str
    
    @validator('phone')
    def validate_phone(cls, v):
        return normalize_phone(v)

class VerifyCodeRequest(BaseModel):
    phone: str
    code: str
    
    @validator('phone')
    def validate_phone(cls, v):
        return normalize_phone(v)
    
    @validator('code')
    def validate_code(cls, v):
        return str(v).strip()  # Убираем пробелы, гарантируем строку

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# === Логика SMS ===
def create_sms_code(phone: str) -> str:
    """Создаёт SMS-код и сохраняет в Supabase"""
    code = generate_sms_code()
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    phone_norm = normalize_phone(phone)
    
    print(f"🔐 Создание кода: phone={phone_norm}, code={code}")
    
    # Удаляем ВСЕ старые коды для этого номера
    supabase.table("sms_codes").delete().eq("phone", phone_norm).execute()
    
    # Сохраняем новый
    supabase.table("sms_codes").insert({
        "phone": phone_norm,
        "code": code,
        "expires_at": expires
    }).execute()
    
    print(f"📱 SMS код для {phone_norm}: {code}")
    return code


def verify_sms_code(phone: str, code: str) -> bool:
    """Проверяет SMS-код из Supabase"""
    phone_norm = normalize_phone(phone)
    code_str = str(code).strip()
    
    print(f"🔍 Проверка: phone={phone_norm}, code={code_str}")
    
    try:
        # Ищем запись
        result = supabase.table("sms_codes") \
            .select("*") \
            .eq("phone", phone_norm) \
            .eq("code", code_str) \
            .execute()
        
        print(f"📦 Результат запроса: {result.data}")
        
        if not result.data or len(result.data) == 0:
            # Попробуем найти любые коды для этого телефона (для отладки)
            debug = supabase.table("sms_codes") \
                .select("phone, code, expires_at") \
                .eq("phone", phone_norm) \
                .execute()
            if debug.data:
                print(f"⚠️  Найдены другие коды для {phone_norm}: {debug.data}")
            else:
                print(f"❌ Нет записей для {phone_norm} в БД")
            return False
        
        record = result.data[0]
        
        # Проверяем время
        from datetime import datetime, timezone
        expires_str = record["expires_at"]
        if expires_str.endswith('Z'):
            expires_str = expires_str[:-1] + '+00:00'
        
        expires_at = datetime.fromisoformat(expires_str)
        now = datetime.now(timezone.utc)
        
        if now > expires_at:
            print(f"⏰ Код истёк: {expires_at} < {now}")
            supabase.table("sms_codes").delete().eq("id", record["id"]).execute()
            return False
        
        # Удаляем использованный код (простая стратегия)
        supabase.table("sms_codes").delete().eq("id", record["id"]).execute()
        
        print(f"✅ Код подтверждён!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка проверки: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


# === JWT ===
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
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
    """Отправляет код подтверждения"""
    try:
        create_sms_code(request.phone)
        return {"status": "ok", "message": "Code sent"}
    except Exception as e:
        print(f"❌ Error in send_code: {e}")
        raise HTTPException(status_code=500, detail=f"Failed: {str(e)}")


@router.post("/verify-code", response_model=TokenResponse)
async def verify_code(request: VerifyCodeRequest):
    """Проверяет код и выдаёт JWT"""
    if not verify_sms_code(request.phone, request.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    
    access_token = create_access_token(data={"sub": request.phone})
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=TokenData)
async def get_me(current_user: TokenData = Depends(get_current_user)):
    """Защищённый маршрут"""
    return current_user


# === 🔧 Debug эндпоинты (удалить в продакшене!) ===

@router.get("/debug/codes")
async def debug_codes(phone: str = Query(...)):
    """GET /auth/debug/codes?phone=+79991234567"""
    phone_norm = normalize_phone(phone)
    result = supabase.table("sms_codes") \
        .select("*") \
        .eq("phone", phone_norm) \
        .execute()
    return {"phone": phone_norm, "codes": result.data}


@router.get("/debug/phone/{phone}")
async def debug_phone(phone: str = Path(...)):
    """GET /auth/debug/phone/%2B79991234567"""
    from urllib.parse import unquote
    phone_norm = normalize_phone(unquote(phone))
    result = supabase.table("sms_codes") \
        .select("*") \
        .eq("phone", phone_norm) \
        .execute()
    return {"phone": phone_norm, "codes": result.data}
