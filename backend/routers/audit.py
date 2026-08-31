"""Compliance audit, gap analysis, and natural language query endpoints."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.core.logging import logger
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
from backend.services.rag_service import rag_service
from backend.utils.validators import check_prompt_injection, sanitize_input

router = APIRouter(prefix="/compliance", tags=["Compliance Audit"])


@router.post("/audit", response_model=AuditCreateResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_compliance_audit(
    request: AuditCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> AuditCreateResponse:
    """Trigger an automated multi-framework compliance audit on a device configuration."""
    try:
        response = await audit_service.create_audit_job(
            db=db,
            device_config_id=request.device_config_id,
            frameworks=request.frameworks,
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/audit/{audit_job_id}", response_model=AuditJobResponse)
async def get_audit_job_status(
    audit_job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AuditJobResponse:
    """Retrieve audit execution status and full cited findings list."""
    query = (
        select(AuditJob)
        .where(AuditJob.id == audit_job_id)
        .options(selectinload(AuditJob.findings))
    )
    result = await db.execute(query)
    audit_job = result.scalar_one_or_none()

    if not audit_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit job '{audit_job_id}' not found",
        )

    findings_list = [
        FindingResponse(
            id=f.id,
            control_id=f.control_id,
            framework=f.framework,
            severity=f.severity,
            finding_title=f.finding_title,
            finding_description=f.finding_description,
            device_rule_reference=f.device_rule_reference,
            remediation=f.remediation,
            citation_source=f.citation_source,
            citation_section=f.citation_section,
            citation_url=f.citation_url,
            citation_page=f.citation_page,
            confidence_score=f.confidence_score,
        )
        for f in audit_job.findings
    ]

    return AuditJobResponse(
        id=audit_job.id,
        device_config_id=audit_job.device_config_id,
        framework_filter=audit_job.framework_filter,
        status=audit_job.status,
        started_at=audit_job.started_at,
        completed_at=audit_job.completed_at,
        total_findings=audit_job.total_findings,
        critical_count=audit_job.critical_count,
        high_count=audit_job.high_count,
        medium_count=audit_job.medium_count,
        low_count=audit_job.low_count,
        compliance_score_percent=audit_job.compliance_score_percent,
        findings=findings_list,
    )


@router.get("/audits", response_model=list[AuditJobResponse])
async def list_audits(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
) -> list[AuditJobResponse]:
    """List recent compliance audit runs."""
    query = (
        select(AuditJob)
        .order_by(AuditJob.started_at.desc())
        .offset(skip)
        .limit(limit)
        .options(selectinload(AuditJob.findings))
    )
    res = await db.execute(query)
    jobs = res.scalars().all()

    output = []
    for aj in jobs:
        output.append(
            AuditJobResponse(
                id=aj.id,
                device_config_id=aj.device_config_id,
                framework_filter=aj.framework_filter,
                status=aj.status,
                started_at=aj.started_at,
                completed_at=aj.completed_at,
                total_findings=aj.total_findings,
                critical_count=aj.critical_count,
                high_count=aj.high_count,
                medium_count=aj.medium_count,
                low_count=aj.low_count,
                compliance_score_percent=aj.compliance_score_percent,
                findings=[
                    FindingResponse(
                        id=f.id,
                        control_id=f.control_id,
                        framework=f.framework,
                        severity=f.severity,
                        finding_title=f.finding_title,
                        finding_description=f.finding_description,
                        device_rule_reference=f.device_rule_reference,
                        remediation=f.remediation,
                        citation_source=f.citation_source,
                        citation_section=f.citation_section,
                        citation_url=f.citation_url,
                        citation_page=f.citation_page,
                        confidence_score=f.confidence_score,
                    )
                    for f in aj.findings
                ],
            )
        )
    return output


@router.post("/query", response_model=ComplianceQueryResponse)
@limiter.limit("20/minute")
async def compliance_query(
    request: Request,
    query_req: ComplianceQueryRequest,
    db: AsyncSession = Depends(get_db),
) -> ComplianceQueryResponse:
    """Direct ad-hoc natural language compliance RAG query with citations."""
    sanitized_q = sanitize_input(query_req.query)
    check_prompt_injection(sanitized_q)

    # Hybrid Search on PostgreSQL
    retrieved = await rag_service.hybrid_search(
        db=db,
        query=sanitized_q,
        framework=query_req.framework,
        top_k=query_req.top_k,
    )

    # Generate answer with citations
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
            confidence=round(r.score, 2) if r.score <= 1.0 else 0.95,
        )
        for r in retrieved
    ]

    return ComplianceQueryResponse(
        query=sanitized_q,
        answer=answer,
        sources=sources,
        confidence=confidence,
    )


@router.get("/report/{audit_id}", response_model=AuditJobResponse)
async def get_compliance_report(
    audit_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AuditJobResponse:
    """Generate or retrieve complete compliance report for an audit."""
    return await get_audit_job_status(audit_id, db)
