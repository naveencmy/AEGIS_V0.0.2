"""
AEGIS-NTRO — Blockchain Evidence Ledger Database Model.
Stores tamper-proof SHA-256 Merkle chain blocks anchoring configuration snapshots and compliance audit runs.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from backend.models.base import Base


class BlockchainBlock(Base):
    """Immutable block in the AEGIS compliance evidence ledger."""

    __tablename__ = "blockchain_blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    block_height = Column(BigInteger, unique=True, nullable=False, index=True)
    block_hash = Column(String(64), unique=True, nullable=False, index=True)
    prev_block_hash = Column(String(64), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Audit linkage
    audit_job_id = Column(UUID(as_uuid=True), ForeignKey("audit_jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    device_config_id = Column(UUID(as_uuid=True), ForeignKey("device_configs.id", ondelete="SET NULL"), nullable=True)
    
    # Cryptographic hashes
    config_snapshot_hash = Column(String(64), nullable=False)
    audit_results_hash = Column(String(64), nullable=False)
    merkle_root = Column(String(64), nullable=False)
    
    # Identity & metadata
    auditor_id = Column(String(128), default="sovereign-auditor-01", nullable=False)
    status = Column(String(32), default="COMMITTED", nullable=False)
    compliance_score = Column(String(16), nullable=True)
    payload_metadata = Column(JSONB, default=dict, nullable=False)

    __table_args__ = (
        Index("idx_blockchain_height_hash", "block_height", "block_hash"),
    )
