"""Framework Controls Model definition."""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    DateTime,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector

from backend.models.base import Base, utc_now


class FrameworkControl(Base):
    """Compliance framework control model (NIST 800-53, CIS v8, ISO 27001, PCI-DSS)."""
    __tablename__ = "framework_controls"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    framework: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    control_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    guidance: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)
    
    # pgvector 1024-dim embedding
    embedding = mapped_column(Vector(1024), nullable=True)
    
    # Full text search tsvector
    tsv = mapped_column(TSVECTOR, nullable=True)
    
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    __table_args__ = (
        Index("idx_framework_control_framework_id", "framework", "control_id", unique=True),
        Index("idx_framework_controls_tsv", "tsv", postgresql_using="gin"),
        Index(
            "idx_framework_controls_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )
