"""System Health check endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import get_settings
from backend.dependencies import get_db
from backend.services.llm_service import llm_service

router = APIRouter(tags=["Health"])
settings = get_settings()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """System health check verifying database and local LLM status."""
    pg_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        pg_status = f"error: {str(e)}"

    llm_status = "ok" if (settings.MOCK_LLM or llm_service.model_path.exists()) else "offline_fallback_active"

    return {
        "status": "ok" if pg_status == "ok" else "degraded",
        "postgres": pg_status,
        "llm": llm_status,
        "version": settings.VERSION,
        "app": settings.APP_NAME,
    }
