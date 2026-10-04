"""
AEGIS-NTRO — Audit Orchestration Service.
Parses multi-vendor device configurations to Canonical AST, retrieves relevant compliance controls via Hybrid RAG,
generates grounded findings with vendor-specific remediation playbooks, computes risk-weighted CVSS compliance score,
and cryptographically anchors the results to the blockchain ledger.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.audit import AuditFinding, AuditJob
from backend.models.device import DeviceConfig
from backend.schemas.audit import AuditCreateResponse
from backend.services.blockchain_service import blockchain_service
from backend.services.llm_service import llm_service
from backend.services.parser_service import parser_service
from backend.services.rag_service import rag_service

logger = logging.getLogger("aegis.audit.service")


class AuditService:
    """End-to-end compliance audit orchestrator with multi-vendor and blockchain support."""

    async def create_audit_job(
        self,
        db: AsyncSession,
        device_config_id,
        frameworks: list[str],
    ) -> AuditCreateResponse:
        """Create, execute, persist, and anchor a compliance audit job."""
        # Fetch device config
        result = await db.execute(
            select(DeviceConfig).where(DeviceConfig.id == device_config_id)
        )
        device = result.scalar_one_or_none()
        if not device:
            raise ValueError(f"Device config '{device_config_id}' not found")

        # Create audit job record
        job = AuditJob(
            device_config_id=device.id,
            framework_filter=frameworks,
            status="RUNNING",
        )
        db.add(job)
        await db.flush()

        try:
            # ── 1. Multi-Vendor Canonical AST Parsing ────────────────────────
            parsed_config = parser_service.parse_config(device.vendor, device.raw_config)
            parsed_rules = parser_service.extract_rules(device.vendor, parsed_config)
            logger.info(
                "Device config parsed into Canonical AST",
                extra={
                    "vendor": device.vendor,
                    "hostname": parsed_config.hostname,
                    "rules_extracted": len(parsed_rules),
                },
            )

            # ── 2. Hybrid RAG Retrieval across Frameworks ────────────────────
            all_query = " ".join([
                r.get("context", "") for r in parsed_rules[:6]
            ]) or "network security compliance boundary protection access control"

            retrieved_controls = []
            for fw in frameworks:
                controls = await rag_service.hybrid_search(
                    db=db, query=all_query, framework=fw, top_k=8
                )
                retrieved_controls.extend(controls)

            # De-duplicate controls
            seen = set()
            unique_controls = []
            for c in retrieved_controls:
                key = str(c.id)
                if key not in seen:
                    seen.add(key)
                    unique_controls.append(c)

            # ── 3. Sovereign LLM Reasoning & Finding Generation ──────────────
            raw_findings = await llm_service.generate_audit_findings(
                device_rules=parsed_rules,
                retrieved_controls=unique_controls,
                vendor=device.vendor,
                frameworks=frameworks,
            )

            # ── 4. Generate Vendor-Specific Remediation & Persist Findings ────
            findings_objs: list[AuditFinding] = []
            for f in raw_findings:
                sev = str(f.get("severity", "MEDIUM")).upper()[:16]
                ctrl_id = str(f.get("control_id", ""))[:64]
                rule_ref = str(f.get("device_rule_reference", "")) if f.get("device_rule_reference") else ""

                # Construct structured remediation playbook for vendor
                rem_steps, verif_cmd, rollback_steps, risk_lvl, est_mins = self._build_remediation_playbook(
                    vendor=device.vendor,
                    control_id=ctrl_id,
                    rule_ref=rule_ref,
                    raw_remediation=str(f.get("remediation", "")),
                )

                finding = AuditFinding(
                    audit_job_id=job.id,
                    control_id=ctrl_id,
                    framework=str(f.get("framework", frameworks[0]))[:64],
                    severity=sev,
                    finding_title=str(f.get("finding_title", ""))[:512],
                    finding_description=str(f.get("finding_description", "")),
                    device_rule_reference=rule_ref[:2000] if rule_ref else None,
                    remediation=str(f.get("remediation", ""))[:2000] if f.get("remediation") else None,
                    remediation_steps=rem_steps,
                    verification_command=verif_cmd,
                    rollback_steps=rollback_steps,
                    risk_level=risk_lvl,
                    estimated_minutes=est_mins,
                    citation_source=str(f.get("citation_source", ""))[:255] if f.get("citation_source") else None,
                    citation_section=str(f.get("citation_section", ""))[:255] if f.get("citation_section") else None,
                    citation_page=str(f.get("citation_page", ""))[:32] if f.get("citation_page") else None,
                    citation_url=str(f.get("citation_url", ""))[:1024] if f.get("citation_url") else None,
                    confidence_score=float(f.get("confidence_score", 0.90)),
                )
                db.add(finding)
                findings_objs.append(finding)

            # ── 5. Compute Risk-Weighted CVSS Compliance Score ────────────────
            sev_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
            for fo in findings_objs:
                sev_counts[fo.severity] = sev_counts.get(fo.severity, 0) + 1

            total = len(findings_objs)
            # Risk weights: Critical (25), High (15), Medium (8), Low (3)
            penalty = (
                (sev_counts["CRITICAL"] * 25.0)
                + (sev_counts["HIGH"] * 15.0)
                + (sev_counts["MEDIUM"] * 8.0)
                + (sev_counts["LOW"] * 3.0)
            )
            score = round(max(0.0, min(100.0, 100.0 - penalty)), 1)

            job.total_findings = total
            job.critical_count = sev_counts["CRITICAL"]
            job.high_count = sev_counts["HIGH"]
            job.medium_count = sev_counts["MEDIUM"]
            job.low_count = sev_counts["LOW"]
            job.compliance_score_percent = score
            job.status = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)

            await db.flush()

            # ── 6. Anchor Audit to Blockchain Ledger ──────────────────────────
            block = await blockchain_service.anchor_audit(
                db=db,
                audit_job_id=job.id,
                auditor_id="sovereign-auditor-01",
            )
            job.blockchain_anchored = True
            job.blockchain_block_height = block.block_height
            job.blockchain_block_hash = block.block_hash
            job.blockchain_merkle_root = block.merkle_root

            await db.flush()

            return AuditCreateResponse(
                audit_job_id=job.id,
                status=job.status,
                message=f"Audit completed and anchored to block #{block.block_height} ({total} findings)",
                blockchain_anchored=True,
                block_height=block.block_height,
                block_hash=block.block_hash,
            )

        except Exception as e:
            logger.exception("Audit job execution failed", extra={"job_id": str(job.id), "error": str(e)})
            job.status = "FAILED"
            await db.flush()
            raise

    def _build_remediation_playbook(
        self,
        vendor: str,
        control_id: str,
        rule_ref: str,
        raw_remediation: str,
    ) -> tuple[list[str], str, list[str], str, int]:
        """Construct vendor-accurate CLI hardening steps, verification, and rollback."""
        v = vendor.lower()

        # Telnet remediation
        if "telnet" in rule_ref.lower() or "ac-17" in control_id.lower() or "2.1.1" in control_id:
            if "fortinet" in v:
                return (
                    [
                        "config system global",
                        "set admin-telnet disable",
                        "end",
                    ],
                    "get system global | grep admin-telnet",
                    [
                        "config system global",
                        "set admin-telnet enable",
                        "end",
                    ],
                    "LOW",
                    2,
                )
            elif "palo" in v:
                return (
                    [
                        "set deviceconfig system service disable-telnet yes",
                        "commit",
                    ],
                    "show system info | match telnet",
                    [
                        "set deviceconfig system service disable-telnet no",
                        "commit",
                    ],
                    "LOW",
                    3,
                )
            elif "juniper" in v:
                return (
                    [
                        "delete system services telnet",
                        "commit check",
                        "commit and-quit",
                    ],
                    "show system services | match telnet",
                    [
                        "set system services telnet",
                        "commit",
                    ],
                    "LOW",
                    2,
                )
            else:  # Cisco default
                return (
                    [
                        "configure terminal",
                        "line vty 0 15",
                        "transport input ssh",
                        "exit",
                        "no telnet 0.0.0.0 0.0.0.0 outside",
                        "end",
                        "write memory",
                    ],
                    "show running-config | include transport input",
                    [
                        "configure terminal",
                        "line vty 0 15",
                        "transport input telnet ssh",
                        "end",
                    ],
                    "LOW",
                    3,
                )

        # Wildcard ACE remediation
        if "permit ip any any" in rule_ref.lower() or "ac-4" in control_id.lower() or "sc-7" in control_id.lower():
            if "palo" in v:
                return (
                    [
                        "set rulebase security rules OUTSIDE_IN action deny",
                        "set rulebase security rules OUTSIDE_IN source [ trusted_subnets ]",
                        "commit",
                    ],
                    "show rulebase security rules name OUTSIDE_IN",
                    [
                        "set rulebase security rules OUTSIDE_IN action allow",
                        "commit",
                    ],
                    "HIGH",
                    10,
                )
            elif "fortinet" in v:
                return (
                    [
                        "config firewall policy",
                        "edit 1",
                        "set srcaddr internal_subnet",
                        "set dstaddr dmz_servers",
                        "set service HTTP HTTPS SSH",
                        "end",
                    ],
                    "show firewall policy 1",
                    [
                        "config firewall policy",
                        "edit 1",
                        "set srcaddr all",
                        "set dstaddr all",
                        "set service ALL",
                        "end",
                    ],
                    "HIGH",
                    10,
                )
            elif "juniper" in v:
                return (
                    [
                        "delete security policies from-zone untrust to-zone trust policy ALLOW_ALL",
                        "set security policies from-zone untrust to-zone trust policy DEFAULT_DENY then deny",
                        "commit and-quit",
                    ],
                    "show security policies from-zone untrust to-zone trust",
                    [
                        "set security policies from-zone untrust to-zone trust policy ALLOW_ALL then permit",
                        "commit",
                    ],
                    "HIGH",
                    8,
                )
            else:  # Cisco
                return (
                    [
                        "configure terminal",
                        "no access-list OUTSIDE_IN extended permit ip any any",
                        "access-list OUTSIDE_IN extended permit tcp 10.0.0.0 255.0.0.0 host 192.168.1.10 eq 443",
                        "access-list OUTSIDE_IN extended deny ip any any log",
                        "end",
                        "write memory",
                    ],
                    "show access-list OUTSIDE_IN",
                    [
                        "configure terminal",
                        "access-list OUTSIDE_IN extended permit ip any any",
                        "end",
                    ],
                    "HIGH",
                    8,
                )

        # SNMP community remediation
        if "snmp" in rule_ref.lower() or "public" in rule_ref.lower():
            if "fortinet" in v:
                return (
                    [
                        "config system snmp community",
                        "delete 1",
                        "end",
                    ],
                    "show system snmp community",
                    [],
                    "MEDIUM",
                    2,
                )
            elif "juniper" in v:
                return (
                    [
                        "delete snmp community public",
                        "delete snmp community private",
                        "commit",
                    ],
                    "show snmp",
                    [],
                    "MEDIUM",
                    2,
                )
            else:  # Cisco
                return (
                    [
                        "configure terminal",
                        "no snmp-server community public",
                        "no snmp-server community private",
                        "snmp-server group SECURE_GRP v3 priv",
                        "end",
                        "write memory",
                    ],
                    "show running-config | include snmp-server",
                    [
                        "configure terminal",
                        "snmp-server community public RO",
                        "end",
                    ],
                    "MEDIUM",
                    3,
                )

        # Default fallback steps derived from raw remediation
        steps = [s.strip() for s in raw_remediation.split(".") if s.strip()] if raw_remediation else ["Review and apply vendor hardening guidelines."]
        return (
            steps,
            "show running-config | include " + (rule_ref.split()[0] if rule_ref else "service"),
            ["Revert changes using previous configuration checkpoint."],
            "LOW",
            5,
        )


audit_service = AuditService()
