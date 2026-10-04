"""Framework control model with pgvector embedding + tsvector for hybrid search."""

import uuid
from datetime import datetime
from typing import ClassVar

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Index, String, Text, func
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.config import get_settings
from backend.models.base import Base

settings = get_settings()


class FrameworkControl(Base):
    __tablename__ = "framework_controls"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    framework: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    control_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    guidance: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str | None] = mapped_column(String(16), nullable=True)
    source_page: Mapped[str | None] = mapped_column(String(32), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # Dense vector embedding (BAAI/bge-m3 — 1024 dims)
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(settings.EMBEDDING_DIM), nullable=True
    )

    # Sparse lexical index for BM25-style search
    tsv: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    # Retrieval score (set at query time, not persisted — not a DB column)
    score: ClassVar[float | None]

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        # HNSW index for fast approximate nearest-neighbour search
        Index(
            "ix_framework_controls_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        # GIN index for full-text search
        Index("ix_framework_controls_tsv_gin", "tsv", postgresql_using="gin"),
        # Compound index for frequent (framework, control_id) lookups
        Index("ix_framework_controls_fw_ctrl", "framework", "control_id", unique=True),
    )

    def __repr__(self) -> str:
        return f"<FrameworkControl {self.framework}:{self.control_id}>"
