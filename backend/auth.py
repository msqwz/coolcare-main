import os
import random
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

from database import supabase
from schemas import TokenData

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

security = HTTPBearer()


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
        "expires_at": expires
    }).execute()

    return code


def verify_sms_code(phone: str, code: str) -> bool:
    """Проверяет SMS-код из Supabase"""
    result = supabase.table("sms_codes") \
        .select("*") \
        .eq("phone", phone) \
        .eq("code", code) \
        .execute()

    if not result.data:
        return False

    stored = result.data[0]
    expires_at = datetime.fromisoformat(stored["expires_at"].replace("Z", "+00:00"))

    if datetime.now(timezone.utc) > expires_at:
        # Код истёк — удаляем
        supabase.table("sms_codes").delete().eq("phone", phone).execute()
        return False

    # Код верный — удаляем после использования
    supabase.table("sms_codes").delete().eq("phone", phone).execute()
    return True


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    to_encode["sub"] = str(to_encode.get("sub", ""))
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})
    to_encode["sub"] = str(to_encode.get("sub", ""))
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        phone = payload.get("phone")
        if user_id is None:
            return None
        return TokenData(user_id=int(user_id), phone=phone)
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Получает текущего пользователя из JWT токена и Supabase"""
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    result = supabase.table("users").select("*").eq("id", payload.user_id).execute()

    if not result.data or not result.data[0].get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return result.data[0]
