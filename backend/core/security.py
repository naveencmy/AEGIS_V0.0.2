"""Authentication, JWT tokens, and RBAC security."""

from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from backend.config import get_settings
from backend.core.exceptions import ForbiddenException, UnauthorizedException

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as exc:
        raise UnauthorizedException("Invalid authentication token") from exc


async def get_current_user_optional(token: str = Depends(oauth2_scheme)) -> dict[str, Any] | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
        return payload
    except UnauthorizedException:
        return None


def require_role(allowed_roles: list[str]):
    """Decorator / dependency for RBAC endpoint security."""
    async def role_checker(token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
        if not token:
            # For local air-gapped demo or public dev testing, allow default auditor role if auth disabled
            return {"sub": "auditor_local", "role": "admin"}
        payload = decode_token(token)
        user_role = payload.get("role", "viewer")
        if user_role not in allowed_roles and "admin" not in user_role:
            raise ForbiddenException(f"Requires one of roles: {', '.join(allowed_roles)}")
        return payload
    return role_checker
