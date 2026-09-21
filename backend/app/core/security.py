from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings


class TokenError(Exception):
    """Raised for expired / invalid tokens."""


# ---------- passwords ----------
def _to_bytes(plain: str) -> bytes:
    b = plain.encode("utf-8")
    if len(b) > 72:  # bcrypt hard limit
        raise ValueError("Password must be at most 72 bytes")
    return b


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(_to_bytes(plain), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_to_bytes(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


# used to equalise timing when the email doesn't exist (anti user-enumeration)
DUMMY_HASH = hash_password("dummy-password-for-timing")


# ---------- JWT ----------
def create_access_token(
    subject: Any, role: Any, expires_delta: timedelta | None = None
) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": str(subject),
        "role": getattr(role, "value", role),
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require": ["sub", "iat", "exp"]},
        )
    except jwt.ExpiredSignatureError as e:
        raise TokenError("Token has expired") from e
    except jwt.InvalidTokenError as e:
        raise TokenError("Invalid token") from e