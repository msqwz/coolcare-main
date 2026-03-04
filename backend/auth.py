import os
import random
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from database import supabase
from schemas import TokenData

load_dotenv()

# === Настройки ===
SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

security = HTTPBearer()


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
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[TokenData]:
    """Декодирует JWT и возвращает TokenData с user_id и phone, или None при ошибке."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is not None:
            user_id = int(user_id)
        return TokenData(user_id=user_id, phone=payload.get("phone"))
    except (JWTError, ValueError):
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Возвращает полного пользователя из БД по JWT (sub = user_id)."""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(user_id)
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="User not found")
        return result.data[0]
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")
