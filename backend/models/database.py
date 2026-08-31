"""Database connection, engine, and session management using SQLAlchemy 2.0 async."""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text
from backend.config import get_settings
from backend.models.base import Base

settings = get_settings()

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG and settings.APP_ENV == "development",
    pool_size=settings.DB_POOL_MIN_SIZE,
    max_overflow=settings.DB_POOL_MAX_SIZE - settings.DB_POOL_MIN_SIZE,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database extensions and create tables if they do not exist."""
    async with engine.begin() as conn:
        # Create necessary PostgreSQL extensions
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "vector";'))
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pg_trgm";'))
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "unaccent";'))
        
        # Create trigger function for automatic TSVector generation
        await conn.execute(text("""
            CREATE OR REPLACE FUNCTION update_framework_tsv()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.tsv := 
                setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(NEW.guidance, '')), 'C');
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """))
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
        # Create triggers if not already present
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_framework_tsv_update'
                ) THEN
                    CREATE TRIGGER trg_framework_tsv_update
                    BEFORE INSERT OR UPDATE ON framework_controls
                    FOR EACH ROW EXECUTE FUNCTION update_framework_tsv();
                END IF;
            END $$;
        """))
