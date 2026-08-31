"""Routers package."""

from backend.routers.devices import router as devices_router
from backend.routers.audit import router as audit_router
from backend.routers.frameworks import router as frameworks_router
from backend.routers.health import router as health_router

__all__ = ["devices_router", "audit_router", "frameworks_router", "health_router"]
