"""AEGIS-NTRO v2.0 — Application Settings (Pydantic v2)."""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────
    APP_NAME: str = "AEGIS-NTRO"
    VERSION: str = "2.0.0"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # ── Database ───────────────────────────────────────────────────────────
    DATABASE_URL: str = (
        "postgresql+asyncpg://aegis:aegis_secure_pass_2026@localhost:5432/aegis_ntro"
    )
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "aegis"
    POSTGRES_PASSWORD: str = "aegis_secure_pass_2026"
    POSTGRES_DB: str = "aegis_ntro"

    # ── Security ──────────────────────────────────────────────────────────
    JWT_SECRET: str = "aegis_super_secret_jwt_key_ntro_sih2026_change_in_prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    # ── LLM ───────────────────────────────────────────────────────────────
    LLM_MODEL_PATH: Path = Path("models/mistral-7b-instruct-v0.3.Q4_K_M.gguf")
    LLM_N_CTX: int = 4096
    LLM_N_GPU_LAYERS: int = 0
    LLM_MAX_TOKENS: int = 1024
    LLM_TEMPERATURE: float = 0.1
    LLM_TOP_P: float = 0.9
    MOCK_LLM: bool = True  # Default True until model is downloaded

    # ── Embeddings ────────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    RERANKER_MODEL: str = "BAAI/bge-reranker-base"
    EMBEDDING_DIM: int = 1024
    MOCK_EMBEDDINGS: bool = False

    # ── RAG ───────────────────────────────────────────────────────────────
    HYBRID_ALPHA: float = 0.6          # weight for dense vs sparse
    RRF_K: int = 60                    # reciprocal rank fusion constant
    TOP_K_RETRIEVE: int = 10
    TOP_K_RERANK: int = 5

    # ── Framework data ────────────────────────────────────────────────────
    FRAMEWORKS_DIR: Path = Path("data/frameworks")

    # ── Rate limiting ─────────────────────────────────────────────────────
    RATE_LIMIT_QUERY: str = "20/minute"
    RATE_LIMIT_AUDIT: str = "10/minute"
    RATE_LIMIT_UPLOAD: str = "30/minute"

    @field_validator("FRAMEWORKS_DIR", "LLM_MODEL_PATH", mode="before")
    @classmethod
    def to_path(cls, v) -> Path:
        return Path(v)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
