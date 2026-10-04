"""Async database engine, session factory, and table initialisation."""

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from backend.config import get_settings
from backend.models.base import Base

# Import all models so metadata is populated before create_all
from backend.models.device import DeviceConfig  # noqa: F401
from backend.models.audit import AuditJob, AuditFinding  # noqa: F401
from backend.models.framework import FrameworkControl  # noqa: F401
from backend.models.blockchain import BlockchainBlock  # noqa: F401

settings = get_settings()

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_pre_ping=True,
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def init_db() -> None:
    """Create pgvector extension and all tables if not exists."""
    async with engine.begin() as conn:
        await conn.execute(__import__("sqlalchemy").text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:  # pragma: no cover
    async with AsyncSessionLocal() as session:
        yield session


# Alias for compatibility with tests and routers
get_db = get_session

