"""Device Configs Model definition."""

import uuid
from datetime import datetime
from typing import Any
from sqlalchemy import (
    DateTime,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base, utc_now


class DeviceConfig(Base):
    """Network device configuration model."""
    __tablename__ = "device_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    device_name: Mapped[str] = mapped_column(String(255), nullable=False)
    vendor: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    device_type: Mapped[str] = mapped_column(String(50), default="firewall", nullable=False)
    raw_config: Mapped[str] = mapped_column(Text, nullable=False)
    parsed_rules: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    # Relationships
    audit_jobs = relationship("AuditJob", back_populates="device_config", cascade="all, delete-orphan")
