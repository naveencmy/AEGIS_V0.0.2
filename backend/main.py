"""AEGIS-NTRO v2.0 — FastAPI Application Factory.

Sovereign, air-gapped, citation-native network compliance auditor.
Target: NTRO SIH26155 | Theme: Blockchain & Cybersecurity
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.config import get_settings
from backend.dependencies import limiter
from backend.models.database import init_db
from backend.routers import (
    audit_router,
    blockchain_router,
    compliance_router,
    devices_router,
    frameworks_router,
    health_router,
)


settings = get_settings()
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info(
        "AEGIS-NTRO starting",
        extra={"version": settings.VERSION, "env": settings.APP_ENV, "mock_llm": settings.MOCK_LLM},
    )

    # Initialise PostgreSQL extensions + tables
    try:
        await init_db()
        logger.info("Database initialised with pgvector and blockchain tables")
    except Exception as e:
        logger.warning("Database init deferred (may already exist): %s", e)

    # Auto-seed framework knowledge base if files exist
    try:
        from backend.models.database import AsyncSessionLocal
        from backend.services.rag_service import rag_service

        fw_dir = settings.FRAMEWORKS_DIR
        async with AsyncSessionLocal() as db:
            for fname, fw_name in [
                ("nist_sp_800_53_rev5.json", "NIST_800_53_R5"),
                ("cis_controls_v8.json",      "CIS_v8"),
                ("iso27001_2022.json",         "ISO27001_2022"),
                ("pci_dss_4_0.json",           "PCI_DSS_4.0"),
                ("nist_sp_800_53_rev5.yaml",   "NIST_800_53_R5"),
                ("cis_controls_v8.yaml",       "CIS_v8"),
            ]:
                fpath = fw_dir / fname
                if fpath.exists():
                    cnt = await rag_service.ingest_framework_file(db, fpath, fw_name)
                    if cnt:
                        logger.info("Seeded %s (%d controls)", fw_name, cnt)
    except Exception as e:
        logger.warning("Framework seeding skipped: %s", e)

    yield  # Application runs

    logger.info("AEGIS-NTRO shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.APP_NAME} — Sovereign Network Compliance Auditor",
        description=(
            "Air-gapped, citation-native multi-vendor network compliance platform. "
            "Target: NTRO SIH26155 | Zero-Hallucination | PostgreSQL-Native Hybrid RAG | Immutable Blockchain Ledger"
        ),
        version=settings.VERSION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Rate limiter
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS — tighten in production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(health_router,      prefix=settings.API_PREFIX)
    app.include_router(devices_router,     prefix=settings.API_PREFIX)
    app.include_router(audit_router,       prefix=settings.API_PREFIX)
    app.include_router(blockchain_router,  prefix=settings.API_PREFIX)
    app.include_router(frameworks_router,  prefix=settings.API_PREFIX)
    app.include_router(compliance_router,  prefix=settings.API_PREFIX)


    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "app":     settings.APP_NAME,
            "version": settings.VERSION,
            "target":  "NTRO SIH26155",
            "docs":    "/docs",
            "health":  f"{settings.API_PREFIX}/health",
        }

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return app


app = create_app()
