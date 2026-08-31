"""FastAPI Application Factory for AEGIS-NTRO v2.0.0-RC1."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.config import get_settings
from backend.core.logging import logger, setup_logging
from backend.dependencies import limiter
from backend.models.database import AsyncSessionLocal, init_db
from backend.routers import audit_router, devices_router, frameworks_router, health_router
from backend.services.queue_service import queue_service
from backend.services.rag_service import rag_service

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup structured logging
    setup_logging()
    logger.info("Initializing AEGIS-NTRO Application", version=settings.VERSION, env=settings.APP_ENV)

    # Initialize PostgreSQL extensions and tables
    try:
        await init_db()
        logger.info("Database schema initialized successfully")
    except Exception as e:
        logger.warn("Database initialization deferred or already created", error=str(e))

    # Auto-seed standard frameworks if database is fresh
    try:
        async with AsyncSessionLocal() as db:
            fw_dir = settings.FRAMEWORKS_DIR
            if fw_dir.exists():
                files = [
                    (fw_dir / "nist_sp_800_53_rev5.json", "NIST_800_53_R5"),
                    (fw_dir / "cis_controls_v8.yaml", "CIS_v8"),
                    (fw_dir / "iso27001_2022.json", "ISO27001_2022"),
                ]
                for fpath, name in files:
                    if fpath.exists():
                        await rag_service.ingest_framework_file(db, fpath, name)
    except Exception as e:
        logger.warn("Initial framework seeding skipped", error=str(e))

    # Start PostgreSQL-native queue worker loop
    queue_service.start_worker()

    yield

    # Teardown
    logger.info("Shutting down AEGIS-NTRO Application")
    queue_service.stop_worker()


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.APP_NAME} - AI Network Security Compliance Auditor",
        description="Sovereign, On-Premise Multi-Vendor Network Compliance Platform (Target: NTRO SIH26155)",
        version=settings.VERSION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # State & Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API Routers
    app.include_router(health_router, prefix=settings.API_PREFIX)
    app.include_router(devices_router, prefix=settings.API_PREFIX)
    app.include_router(audit_router, prefix=settings.API_PREFIX)
    app.include_router(frameworks_router, prefix=settings.API_PREFIX)

    # Root redirect / status
    @app.get("/")
    async def root():
        return {
            "app": settings.APP_NAME,
            "version": settings.VERSION,
            "theme": "Blockchain & Cybersecurity (NTRO)",
            "docs": "/docs",
        }

    return app


app = create_app()
