"""Compliance audit, gap analysis, and natural language query endpoints."""

import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.dependencies import get_db, limiter
from backend.models.audit import AuditFinding, AuditJob
from backend.models.device import DeviceConfig
from backend.schemas.audit import (
    AuditCreateRequest,
    AuditCreateResponse,
    AuditJobResponse,
    CitationCardModel,
    ComplianceQueryRequest,
    ComplianceQueryResponse,
    FindingResponse,
)
from backend.services.audit_service import audit_service
from backend.services.llm_service import llm_service
from backend.services.pdf_service import pdf_service
from backend.services.rag_service import rag_service
from backend.utils.validators import check_prompt_injection, sanitize_input

router = APIRouter(prefix="/compliance", tags=["Compliance Audit"])
logger = logging.getLogger("aegis.router.audit")



def _to_finding_response(f: AuditFinding) -> FindingResponse:
    return FindingResponse(
        id=f.id,
        control_id=f.control_id,
        framework=f.framework,
        severity=f.severity,
        finding_title=f.finding_title,
        finding_description=f.finding_description,
        device_rule_reference=f.device_rule_reference,
        remediation=f.remediation,
        remediation_steps=f.remediation_steps or [],
        verification_command=f.verification_command,
        rollback_steps=f.rollback_steps or [],
        risk_level=f.risk_level or "LOW",
        estimated_minutes=f.estimated_minutes or 5,
        citation_source=f.citation_source,
        citation_section=f.citation_section,
        citation_page=f.citation_page,
        citation_url=f.citation_url,
        confidence_score=f.confidence_score,
    )


def _to_job_response(aj: AuditJob) -> AuditJobResponse:
    return AuditJobResponse(
        id=aj.id,
        device_config_id=aj.device_config_id,
        framework_filter=aj.framework_filter or [],
        status=aj.status,
        started_at=aj.started_at,
        completed_at=aj.completed_at,
        total_findings=aj.total_findings,
        critical_count=aj.critical_count,
        high_count=aj.high_count,
        medium_count=aj.medium_count,
        low_count=aj.low_count,
        compliance_score_percent=aj.compliance_score_percent,
        blockchain_anchored=aj.blockchain_anchored,
        blockchain_block_height=aj.blockchain_block_height,
        blockchain_block_hash=aj.blockchain_block_hash,
        blockchain_merkle_root=aj.blockchain_merkle_root,
        findings=[_to_finding_response(f) for f in (aj.findings or [])],
    )


@router.post("/audit", response_model=AuditCreateResponse, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("10/minute")
async def trigger_compliance_audit(
    request: Request,
    body: AuditCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> AuditCreateResponse:
    """Trigger an automated multi-framework compliance audit and anchor evidence to blockchain."""
    try:
        return await audit_service.create_audit_job(
            db=db,
            device_config_id=body.device_config_id,
            frameworks=body.frameworks,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Audit creation failed")
        raise HTTPException(status_code=500, detail=f"Internal audit error: {str(e)}")


@router.get("/audit/{audit_job_id}", response_model=AuditJobResponse)
async def get_audit_job(
    audit_job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AuditJobResponse:
    """Get audit job status, findings, remediation playbooks, and blockchain proof."""
    result = await db.execute(
        select(AuditJob)
        .where(AuditJob.id == audit_job_id)
        .options(selectinload(AuditJob.findings))
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail=f"Audit '{audit_job_id}' not found")
    return _to_job_response(job)


@router.get("/audits", response_model=List[AuditJobResponse])
async def list_audits(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[AuditJobResponse]:
    """List recent audit runs with blockchain anchoring status."""
    result = await db.execute(
        select(AuditJob)
        .order_by(AuditJob.started_at.desc())
        .offset(skip)
        .limit(limit)
        .options(selectinload(AuditJob.findings))
    )
    return [_to_job_response(aj) for aj in result.scalars().all()]


@router.post("/query", response_model=ComplianceQueryResponse)
@limiter.limit("20/minute")
async def compliance_query(
    request: Request,
    body: ComplianceQueryRequest,
    db: AsyncSession = Depends(get_db),
) -> ComplianceQueryResponse:
    """Ad-hoc natural language compliance RAG query with authoritative citations."""
    sanitized_q = sanitize_input(body.query)
    check_prompt_injection(sanitized_q)

    retrieved = await rag_service.hybrid_search(
        db=db, query=sanitized_q, framework=body.framework, top_k=body.top_k
    )

    answer, confidence = await llm_service.generate_query_answer(sanitized_q, retrieved)

    sources = [
        CitationCardModel(
            control_id=r.control_id,
            framework=r.framework,
            title=r.title,
            citation_source=r.framework.replace("_", " "),
            citation_section=f"Control {r.control_id}",
            citation_page=r.source_page,
            citation_url=r.source_url,
            confidence=round(float(r.score or 0.88), 3),
        )
        for r in retrieved
    ]

    return ComplianceQueryResponse(
        query=sanitized_q,
        answer=answer,
        sources=sources,
        confidence=confidence,
    )


@router.get("/certificate/{audit_id}", response_class=HTMLResponse)
async def get_compliance_certificate(
    audit_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> HTMLResponse:
    """Generate and return a signed, verifiable HTML compliance certificate with embedded Merkle QR code."""
    result = await db.execute(
        select(AuditJob)
        .where(AuditJob.id == audit_id)
        .options(selectinload(AuditJob.findings))
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit job '{audit_id}' not found",
        )

    # Fetch device
    dev_res = await db.execute(
        select(DeviceConfig).where(DeviceConfig.id == job.device_config_id)
    )
    device = dev_res.scalar_one_or_none()
    hostname = (device.device_name if device else None) or "Network-Device"
    vendor = (device.vendor if device else None) or "generic"

    findings_data = [
        {
            "control_id": f.control_id,
            "severity": f.severity,
            "finding_title": f.finding_title,
            "citation_source": f.citation_source,
        }
        for f in (job.findings or [])
    ]

    html_cert = pdf_service.generate_certificate_html(
        audit_job_id=str(job.id),
        hostname=hostname,
        vendor=vendor,
        compliance_score=float(job.compliance_score or 100.0),
        critical_count=int(job.critical_count or 0),
        high_count=int(job.high_count or 0),
        medium_count=int(job.medium_count or 0),
        low_count=int(job.low_count or 0),
        frameworks=job.framework_filter or ["NIST_800_53_R5"],
        merkle_root=job.merkle_root,
        blockchain_tx_hash=job.blockchain_tx_hash,
        created_at=job.started_at,
        findings=findings_data,
    )

    return HTMLResponse(content=html_cert, status_code=200)

