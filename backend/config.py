"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Information
    APP_NAME: str = "AEGIS-NTRO"
    VERSION: str = "2.0.0-rc1"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # Database Configuration (PostgreSQL 16 + pgvector)
    POSTGRES_USER: str = "aegis"
    POSTGRES_PASSWORD: str = "aegis_secure_pass_2026"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "aegis_ntro"
    DATABASE_URL: str = "postgresql+asyncpg://aegis:aegis_secure_pass_2026@localhost:5432/aegis_ntro"

    # Connection pool
    DB_POOL_MIN_SIZE: int = 5
    DB_POOL_MAX_SIZE: int = 20
    DB_POOL_TIMEOUT: int = 30

    # LLM Settings
    LLM_MODEL_PATH: str = "./models/mistral-7b-instruct-v0.3.Q4_K_M.gguf"
    LLM_THREADS: int = 4
    LLM_CONTEXT_WINDOW: int = 4096
    LLM_GPU_LAYERS: int = 0
    MOCK_LLM: bool = True

    # Embedding & RAG
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    EMBEDDING_DIMENSION: int = 1024
    RERANKER_MODEL: str = "BAAI/bge-reranker-base"
    RAG_TOP_K: int = 5
    RAG_RRF_K: int = 60

    # Security
    JWT_SECRET: str = "aegis_super_secret_jwt_key_ntro_sih2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Queue Worker
    WORKER_POLL_INTERVAL_SECONDS: float = 1.0
    WORKER_CONCURRENCY: int = 2

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    FRAMEWORKS_DIR: Path = DATA_DIR / "frameworks"
    SAMPLES_DIR: Path = DATA_DIR / "samples"
    MODELS_DIR: Path = BASE_DIR / "models"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
