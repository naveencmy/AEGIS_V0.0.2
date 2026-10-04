"""Audit job and finding models."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base


class AuditJob(Base):
    __tablename__ = "audit_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    device_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("device_configs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    framework_filter: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(32), default="PENDING", nullable=False, index=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
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

    # Blockchain anchoring metadata
    blockchain_anchored: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    blockchain_block_height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    blockchain_block_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    blockchain_merkle_root: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Relationships
    device_config: Mapped["DeviceConfig"] = relationship(  # type: ignore[name-defined]
        "DeviceConfig", back_populates="audit_jobs"
    )
    findings: Mapped[list["AuditFinding"]] = relationship(
        "AuditFinding", back_populates="audit_job", cascade="all, delete-orphan", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<AuditJob id={self.id} status={self.status} score={self.compliance_score_percent}%>"


class AuditFinding(Base):
    __tablename__ = "audit_findings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    audit_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("audit_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Control reference
    control_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    framework: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(16), nullable=False, index=True)

    # Finding details
    finding_title: Mapped[str] = mapped_column(String(512), nullable=False)
    finding_description: Mapped[str] = mapped_column(Text, nullable=False)
    device_rule_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    remediation: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Structured Remediation Playbook
    remediation_steps: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    verification_command: Mapped[str | None] = mapped_column(String(512), nullable=True)
    rollback_steps: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    risk_level: Mapped[str | None] = mapped_column(String(16), default="LOW", nullable=True)
    estimated_minutes: Mapped[int | None] = mapped_column(Integer, default=5, nullable=True)

    # Citation provenance
    citation_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    citation_section: Mapped[str | None] = mapped_column(String(255), nullable=True)
    citation_page: Mapped[str | None] = mapped_column(String(32), nullable=True)
    citation_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Relationship
    audit_job: Mapped["AuditJob"] = relationship("AuditJob", back_populates="findings")

    def __repr__(self) -> str:
        return f"<AuditFinding id={self.id} control={self.control_id} sev={self.severity}>"
