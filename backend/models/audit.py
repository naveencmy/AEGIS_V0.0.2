"""Audit Job and Finding Model definitions."""

import uuid
from datetime import datetime
from typing import Any
from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base, utc_now


class AuditJob(Base):
    """Audit Job execution model."""
    __tablename__ = "audit_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    device_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("device_configs.id", ondelete="CASCADE"), nullable=False
    )
    framework_filter: Mapped[list[str]] = mapped_column(ARRAY(String(50)), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="queued", nullable=False)
    
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    
    total_findings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    critical_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    high_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    medium_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    compliance_score_percent: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)

    # Relationships
    device_config = relationship("DeviceConfig", back_populates="audit_jobs")
    findings = relationship("AuditFinding", back_populates="audit_job", cascade="all, delete-orphan")


class AuditFinding(Base):
    """Individual security compliance audit finding with exact citations."""
    __tablename__ = "audit_findings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    audit_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("audit_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    control_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    framework: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    
    finding_title: Mapped[str] = mapped_column(Text, nullable=False)
    finding_description: Mapped[str] = mapped_column(Text, nullable=False)
    device_rule_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    remediation: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Exact Regulatory Citations
    citation_source: Mapped[str] = mapped_column(Text, nullable=False)
    citation_section: Mapped[str | None] = mapped_column(Text, nullable=True)
    citation_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    citation_page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    llm_raw_response: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    # Relationships
    audit_job = relationship("AuditJob", back_populates="findings")
