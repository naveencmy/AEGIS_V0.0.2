"""Device configuration model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base


class DeviceConfig(Base):
    __tablename__ = "device_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    vendor: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    device_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    device_type: Mapped[str] = mapped_column(String(64), default="firewall")
    raw_config: Mapped[str] = mapped_column(Text, nullable=False)
    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parsed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    audit_jobs: Mapped[list["AuditJob"]] = relationship(  # type: ignore[name-defined]
        "AuditJob", back_populates="device_config", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<DeviceConfig id={self.id} vendor={self.vendor}>"
