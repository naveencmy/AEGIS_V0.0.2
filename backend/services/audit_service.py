"""Audit Orchestration Service coordinating Parser, Hybrid RAG, LLM Reasoning, and Verification."""

import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.core.logging import logger
from backend.models.audit import AuditFinding, AuditJob
from backend.models.device import DeviceConfig
from backend.models.framework import FrameworkControl
from backend.schemas.audit import AuditCreateResponse, FindingSchema
from backend.services.citation_service import citation_service
from backend.services.llm_service import llm_service
from backend.services.parser_service import parser_service
from backend.services.queue_service import queue_service
from backend.services.rag_service import rag_service


class AuditService:
    """End-to-end Audit orchestration service."""

    def __init__(self) -> None:
        # Register background job handlers
        queue_service.register_handler("parse_config", self._handle_parse_config_job)
        queue_service.register_handler("run_audit", self._handle_run_audit_job)

    async def create_audit_job(
        self,
        db: AsyncSession,
        device_config_id: uuid.UUID,
        frameworks: list[str],
    ) -> AuditCreateResponse:
        """Create and queue a compliance audit job."""
        # 1. Verify device config exists
        device = await db.get(DeviceConfig, device_config_id)
        if not device:
            raise ValueError(f"Device config {device_config_id} not found")

        # 2. Create AuditJob in database
        audit_job = AuditJob(
            device_config_id=device_config_id,
            framework_filter=frameworks,
            status="queued",
            started_at=datetime.now(timezone.utc),
        )
        db.add(audit_job)
        await db.commit()
        await db.refresh(audit_job)

        # 3. Enqueue job into PostgreSQL queue
        await queue_service.enqueue(
            db=db,
            job_type="run_audit",
            payload={
                "audit_job_id": str(audit_job.id),
                "device_config_id": str(device_config_id),
                "frameworks": frameworks,
            },
        )

        return AuditCreateResponse(
            audit_job_id=audit_job.id,
            status="queued",
            estimated_time_seconds=20,
            message="Audit job queued successfully",
        )

    async def _handle_parse_config_job(self, payload: dict[str, Any], db: AsyncSession) -> None:
        """Background worker handler for config parsing."""
        device_id = uuid.UUID(payload["device_config_id"])
        device = await db.get(DeviceConfig, device_id)
        if not device:
            return

        parsed = parser_service.parse_config(device.vendor, device.raw_config)
        device.parsed_rules = parsed.model_dump()
        device.status = "parsed"
        await db.commit()
        logger.info("Device configuration parsed in background", device_id=str(device_id))

    async def _handle_run_audit_job(self, payload: dict[str, Any], db: AsyncSession) -> None:
        """Background worker handler for running compliance audit reasoning."""
        audit_job_id = uuid.UUID(payload["audit_job_id"])
        device_config_id = uuid.UUID(payload["device_config_id"])
        frameworks = payload.get("frameworks", ["NIST_800_53_R5"])

        audit_job = await db.get(AuditJob, audit_job_id)
        device = await db.get(DeviceConfig, device_config_id)

        if not audit_job or not device:
            return

        # Update status to running
        audit_job.status = "running"
        await db.commit()

        # Parse config if not parsed yet
        if not device.parsed_rules:
            parsed = parser_service.parse_config(device.vendor, device.raw_config)
            device.parsed_rules = parsed.model_dump()
            device.status = "parsed"
            await db.commit()

        flat_rules = parser_service.extract_rules(
            device.vendor,
            parser_service.parse_config(device.vendor, device.raw_config),
        )

        all_findings: list[FindingSchema] = []

        # Audit against each selected framework
        for fw in frameworks:
            logger.info("Auditing device against framework", framework=fw, device=device.device_name)
            
            # Hybrid search for related controls
            query_context = f"Firewall network security rules access control packet filtering {device.vendor} {' '.join(r.get('details', '') for r in flat_rules[:5])}"
            retrieved_controls = await rag_service.hybrid_search(
                db=db,
                query=query_context,
                framework=fw,
                top_k=6,
            )

            # Generate cited audit response using LLM / local reasoning
            llm_result = await llm_service.generate_audit_response(
                vendor=device.vendor,
                device_type=device.device_type,
                hostname=device.device_name,
                parsed_rules=flat_rules,
                retrieved_controls=retrieved_controls,
            )

            # Ground truth control mapping for citation enrichment & validation
            valid_control_ids = {c.control_id for c in retrieved_controls}
            control_meta = {
                c.control_id: {
                    "source_url": c.source_url,
                    "source_page": c.source_page,
                    "framework": c.framework,
                }
                for c in retrieved_controls
            }

            # Filter hallucinated controls
            validated_findings = [
                f for f in llm_result.findings
                if citation_service.validate_finding(f, valid_control_ids)
            ]

            # Enrich citations with ground-truth URLs & pages
            enriched_findings = citation_service.enrich_citations(validated_findings, control_meta)
            all_findings.extend(enriched_findings)

        # Save findings to database
        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0

        for f in all_findings:
            if f.severity == "Critical":
                critical_count += 1
            elif f.severity == "High":
                high_count += 1
            elif f.severity == "Medium":
                medium_count += 1
            else:
                low_count += 1

            finding_record = AuditFinding(
                audit_job_id=audit_job_id,
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
                llm_raw_response=f.model_dump(),
            )
            db.add(finding_record)

        # Compute final score
        deductions = (critical_count * 25) + (high_count * 15) + (medium_count * 8) + (low_count * 3)
        final_score = max(0.0, min(100.0, 100.0 - deductions))

        audit_job.status = "completed"
        audit_job.completed_at = datetime.now(timezone.utc)
        audit_job.total_findings = len(all_findings)
        audit_job.critical_count = critical_count
        audit_job.high_count = high_count
        audit_job.medium_count = medium_count
        audit_job.low_count = low_count
        audit_job.compliance_score_percent = round(final_score, 1)

        device.status = "audited"
        await db.commit()
        logger.info("Audit job completed successfully", audit_job_id=str(audit_job_id), total_findings=len(all_findings))


audit_service = AuditService()
