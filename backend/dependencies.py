"""FastAPI Dependency injection helpers."""

from typing import AsyncGenerator
from fastapi import Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import Settings, get_settings
from backend.core.security import require_role
from backend.models.database import get_db

# Rate limiter instance
limiter = Limiter(key_func=get_remote_address)


def get_app_settings() -> Settings:
    return get_settings()


# RBAC Role dependencies
RequireAuditor = Depends(require_role(["auditor", "admin"]))
RequireAdmin = Depends(require_role(["admin"]))
