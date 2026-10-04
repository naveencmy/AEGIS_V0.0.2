"""
AEGIS-NTRO — Pydantic v2 Request/Response Schemas.
Full typed contracts for Compliance Audits, Hybrid RAG, Multi-Vendor Parsers,
Blockchain Evidence Ledger, and Configuration Drift Detection.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field, field_validator


# ─── Device ──────────────────────────────────────────────────────────────────

class DeviceUploadResponse(BaseModel):
    id: uuid.UUID
    vendor: str
    device_name: Optional[str] = None
    device_type: str = "firewall"
    filename: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Finding & Remediation ───────────────────────────────────────────────────

class FindingResponse(BaseModel):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4)
    control_id: str
    framework: str
    severity: str
    finding_title: str
    finding_description: str
    device_rule_reference: Optional[str] = None
    remediation: Optional[str] = None
    remediation_steps: list[str] = Field(default_factory=list)
    verification_command: Optional[str] = None
    rollback_steps: list[str] = Field(default_factory=list)
    risk_level: Optional[str] = "LOW"
    estimated_minutes: Optional[int] = 5
    citation_source: Optional[str] = None
    citation_section: Optional[str] = None
    citation_page: Optional[Any] = None
    citation_url: Optional[str] = None
    confidence_score: float = 0.9

    model_config = {"from_attributes": True}



# Schema aliases for backwards compatibility
FindingSchema = FindingResponse



# ─── Audit ───────────────────────────────────────────────────────────────────

class AuditCreateRequest(BaseModel):
    device_config_id: uuid.UUID
    frameworks: List[str] = Field(..., min_length=1)

    @field_validator("frameworks")
    @classmethod
    def frameworks_not_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one framework must be specified")
        return [f.strip() for f in v]


class AuditCreateResponse(BaseModel):
    audit_job_id: uuid.UUID
    status: str
    message: str
    blockchain_anchored: bool = False
    block_height: Optional[int] = None
    block_hash: Optional[str] = None


class AuditJobResponse(BaseModel):
    id: uuid.UUID
    device_config_id: uuid.UUID
    framework_filter: List[str]
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    compliance_score_percent: float
    blockchain_anchored: bool = False
    blockchain_block_height: Optional[int] = None
    blockchain_block_hash: Optional[str] = None
    blockchain_merkle_root: Optional[str] = None
    findings: List[FindingResponse] = []

    model_config = {"from_attributes": True}


# ─── RAG Query ───────────────────────────────────────────────────────────────

class ComplianceQueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2048)
    framework: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=20)


class CitationCardModel(BaseModel):
    control_id: str
    framework: str
    title: Optional[str] = None
    citation_source: Optional[str] = None
    citation_section: Optional[str] = None
    citation_page: Optional[Any] = None
    citation_url: Optional[str] = None
    confidence: float = 1.0



class ComplianceQueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[CitationCardModel] = []
    confidence: float
    hallucination_detected: bool = False


# ─── Blockchain Evidence Ledger ──────────────────────────────────────────────

class BlockchainBlockResponse(BaseModel):
    id: uuid.UUID
    block_height: int
    block_hash: str
    prev_block_hash: str
    timestamp: datetime
    audit_job_id: Optional[uuid.UUID] = None
    device_config_id: Optional[uuid.UUID] = None
    config_snapshot_hash: str
    audit_results_hash: str
    merkle_root: str
    auditor_id: str
    status: str
    compliance_score: Optional[str] = None
    payload_metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"from_attributes": True}


class BlockchainVerifyResponse(BaseModel):
    status: str  # VALID | TAMPERED_CONFIG | TAMPERED_FINDINGS | UNANCHORED
    is_valid: bool
    audit_job_id: str
    block_height: Optional[int] = None
    block_hash: Optional[str] = None
    prev_block_hash: Optional[str] = None
    timestamp: Optional[str] = None
    merkle_root: Optional[str] = None
    recomputed_merkle_root: Optional[str] = None
    config_snapshot_hash: Optional[str] = None
    recomputed_config_hash: Optional[str] = None
    audit_results_hash: Optional[str] = None
    recomputed_results_hash: Optional[str] = None
    config_integrity_verified: bool = False
    findings_integrity_verified: bool = False
    auditor_id: Optional[str] = None
    compliance_score: Optional[str] = None
    verified_at: str
    certificate_qr_payload: Optional[dict[str, Any]] = None


class ChainVerifyResponse(BaseModel):
    status: str  # HEALTHY | CHAIN_CORRUPTED
    is_valid: bool
    total_blocks: int
    genesis_block_hash: Optional[str] = None
    latest_block_height: Optional[int] = None
    latest_block_hash: Optional[str] = None
    corrupted_blocks: list[dict[str, Any]] = Field(default_factory=list)
    verified_at: str


# ─── Configuration Drift Detection ──────────────────────────────────────────

class DriftAnalyzeRequest(BaseModel):
    vendor: str
    baseline_config: str
    current_config: str
    hostname: Optional[str] = "network-device"


class DriftLineResponse(BaseModel):
    change_type: str  # ADDED | REMOVED | UNCHANGED
    line_number: Optional[int] = None
    content: str
    security_impact: Optional[str] = None  # CRITICAL | HIGH | MEDIUM | LOW | INFO
    impact_description: Optional[str] = None


class SemanticDriftResponse(BaseModel):
    category: str  # ACL | SERVICE | AUTH | CRYPTO | SNMP | LOGGING
    action: str    # INTRODUCED_VIOLATION | RESOLVED_VIOLATION | MODIFIED_POLICY
    severity: str  # CRITICAL | HIGH | MEDIUM | LOW
    description: str
    remediation_advice: Optional[str] = None


class DriftAnalysisResponse(BaseModel):
    vendor: str
    hostname: str
    total_added_lines: int
    total_removed_lines: int
    drift_severity: str  # CRITICAL | HIGH | MEDIUM | LOW | NONE
    security_regressions_detected: int
    security_improvements_detected: int
    semantic_drift: list[SemanticDriftResponse] = Field(default_factory=list)
    line_diff: list[DriftLineResponse] = Field(default_factory=list)
    summary: str


# ─── Frameworks ──────────────────────────────────────────────────────────────

class FrameworkSummary(BaseModel):
    framework: str
    name: str
    count: int

    model_config = {"from_attributes": True}


class FrameworkListResponse(BaseModel):
    frameworks: List[FrameworkSummary]


class ControlSearchResponse(BaseModel):
    id: uuid.UUID
    framework: str
    control_id: str
    title: str
    description: str
    guidance: Optional[str] = None
    severity: Optional[str] = None
    source_page: Optional[str] = None
    source_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ControlSearchListResponse(BaseModel):
    controls: List[ControlSearchResponse]
    total: int
    page: int
    page_size: int


# ─── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    postgres: str
    llm: str
    version: str
    app: str
    blockchain: str = "active"
