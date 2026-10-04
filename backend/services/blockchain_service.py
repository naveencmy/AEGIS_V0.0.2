"""
AEGIS-NTRO — Sovereign Cryptographic Blockchain Evidence Service.
Implements SHA-256 Merkle tree calculation, immutable block chaining,
tamper detection, and verification certificates for compliance audits.
"""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.audit import AuditFinding, AuditJob
from backend.models.blockchain import BlockchainBlock
from backend.models.device import DeviceConfig

logger = logging.getLogger("aegis.blockchain")

GENESIS_PREV_HASH = "0" * 64


def sha256_hash(data: str | bytes) -> str:
    """Compute SHA-256 hexadecimal digest."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def compute_merkle_root(leaves: list[str]) -> str:
    """Compute cryptographic SHA-256 Merkle Tree Root from a list of leaf hashes."""
    if not leaves:
        return sha256_hash("EMPTY_MERKLE_TREE")

    current_level = [l if len(l) == 64 else sha256_hash(l) for l in leaves]

    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            # If odd number of nodes, duplicate the last one
            right = current_level[i + 1] if i + 1 < len(current_level) else left
            combined = sha256_hash(left + right)
            next_level.append(combined)
        current_level = next_level

    return current_level[0]


class BlockchainService:
    """Sovereign audit evidence chaining and cryptographic verification service."""

    async def _ensure_genesis_block(self, db: AsyncSession) -> BlockchainBlock:
        """Ensure Genesis Block (Height #0) is minted."""
        result = await db.execute(
            select(BlockchainBlock).order_by(BlockchainBlock.block_height.asc()).limit(1)
        )
        genesis = result.scalar_one_or_none()
        if genesis is not None:
            return genesis

        ts = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        genesis_payload = {
            "title": "AEGIS Sovereign Genesis Block",
            "protocol": "AEGIS-NTRO-PROOF-OF-COMPLIANCE-v2.0",
            "authority": "NTRO SIH26155",
        }
        config_hash = sha256_hash("GENESIS_CONFIG_SNAPSHOT")
        results_hash = sha256_hash(json.dumps(genesis_payload, sort_keys=True))
        merkle = compute_merkle_root([config_hash, results_hash])

        block_header = f"0:{GENESIS_PREV_HASH}:{ts.isoformat()}:GENESIS:{merkle}:{config_hash}:{results_hash}:aegis-root"
        block_hash = sha256_hash(block_header)

        genesis_block = BlockchainBlock(
            block_height=0,
            block_hash=block_hash,
            prev_block_hash=GENESIS_PREV_HASH,
            timestamp=ts,
            config_snapshot_hash=config_hash,
            audit_results_hash=results_hash,
            merkle_root=merkle,
            auditor_id="aegis-root",
            status="GENESIS",
            compliance_score="100.0",
            payload_metadata=genesis_payload,
        )
        db.add(genesis_block)
        await db.flush()
        logger.info("Minted Sovereign Genesis Block #0", extra={"block_hash": block_hash})
        return genesis_block

    async def anchor_audit(
        self,
        db: AsyncSession,
        audit_job_id: uuid.UUID,
        auditor_id: str = "sovereign-auditor-01",
    ) -> BlockchainBlock:
        """Anchor a completed compliance audit into the immutable blockchain ledger."""
        await self._ensure_genesis_block(db)

        # Check if already anchored
        existing = await db.execute(
            select(BlockchainBlock).where(BlockchainBlock.audit_job_id == audit_job_id)
        )
        found = existing.scalar_one_or_none()
        if found:
            logger.info("Audit job already anchored to blockchain", extra={"block_height": found.block_height})
            return found

        # Fetch audit job + findings + device config
        res = await db.execute(
            select(AuditJob)
            .where(AuditJob.id == audit_job_id)
            .options(selectinload(AuditJob.findings))
        )
        job = res.scalar_one_or_none()
        if not job:
            raise ValueError(f"Audit job '{audit_job_id}' not found")

        dev_res = await db.execute(
            select(DeviceConfig).where(DeviceConfig.id == job.device_config_id)
        )
        device = dev_res.scalar_one_or_none()
        raw_config = device.raw_config if device else ""

        # 1. Compute config snapshot hash
        config_hash = sha256_hash(raw_config)

        # 2. Compute canonical findings payload hash & Merkle leaves
        finding_leaves: list[str] = []
        findings_canonical: list[dict[str, Any]] = []

        for f in sorted(job.findings or [], key=lambda x: str(x.id)):
            item = {
                "id": str(f.id),
                "control_id": f.control_id,
                "framework": f.framework,
                "severity": f.severity,
                "finding_title": f.finding_title,
                "finding_description": f.finding_description,
                "device_rule_reference": f.device_rule_reference,
            }
            f_str = json.dumps(item, sort_keys=True)
            f_hash = sha256_hash(f_str)
            finding_leaves.append(f_hash)
            findings_canonical.append(item)

        results_hash = sha256_hash(json.dumps(findings_canonical, sort_keys=True))
        merkle_root = compute_merkle_root(finding_leaves)

        # 3. Get latest block to chain
        last_block_res = await db.execute(
            select(BlockchainBlock).order_by(BlockchainBlock.block_height.desc()).limit(1)
        )
        last_block = last_block_res.scalar_one()

        new_height = last_block.block_height + 1
        now_ts = datetime.now(timezone.utc)

        # 4. Construct block header and compute block hash
        header = f"{new_height}:{last_block.block_hash}:{now_ts.isoformat()}:{str(job.id)}:{merkle_root}:{config_hash}:{results_hash}:{auditor_id}"
        block_hash = sha256_hash(header)

        block = BlockchainBlock(
            block_height=new_height,
            block_hash=block_hash,
            prev_block_hash=last_block.block_hash,
            timestamp=now_ts,
            audit_job_id=job.id,
            device_config_id=job.device_config_id,
            config_snapshot_hash=config_hash,
            audit_results_hash=results_hash,
            merkle_root=merkle_root,
            auditor_id=auditor_id,
            status="COMMITTED",
            compliance_score=str(job.compliance_score_percent),
            payload_metadata={
                "total_findings": job.total_findings,
                "critical_count": job.critical_count,
                "high_count": job.high_count,
                "frameworks": job.framework_filter,
                "vendor": device.vendor if device else "unknown",
                "device_name": device.device_name if device else "unknown",
            },
        )
        db.add(block)
        await db.flush()

        logger.info(
            "Audit successfully anchored to blockchain",
            extra={
                "audit_job_id": str(job.id),
                "block_height": new_height,
                "block_hash": block_hash,
                "merkle_root": merkle_root,
            },
        )
        return block

    async def verify_audit(
        self,
        db: AsyncSession,
        audit_job_id: uuid.UUID,
    ) -> dict[str, Any]:
        """Independently verify cryptographic integrity of an audit run against ledger."""
        # Find block
        block_res = await db.execute(
            select(BlockchainBlock).where(BlockchainBlock.audit_job_id == audit_job_id)
        )
        block = block_res.scalar_one_or_none()
        if not block:
            return {
                "status": "UNANCHORED",
                "is_valid": False,
                "message": f"Audit job '{audit_job_id}' has not been anchored to the blockchain ledger.",
                "audit_job_id": str(audit_job_id),
                "verified_at": datetime.now(timezone.utc).isoformat(),
            }

        # Fetch current database state
        job_res = await db.execute(
            select(AuditJob)
            .where(AuditJob.id == audit_job_id)
            .options(selectinload(AuditJob.findings))
        )
        job = job_res.scalar_one_or_none()
        if not job:
            return {
                "status": "AUDIT_DELETED",
                "is_valid": False,
                "message": "Audit job record missing from active database.",
                "block_height": block.block_height,
                "block_hash": block.block_hash,
            }

        dev_res = await db.execute(
            select(DeviceConfig).where(DeviceConfig.id == job.device_config_id)
        )
        device = dev_res.scalar_one_or_none()
        current_raw_config = device.raw_config if device else ""

        # Recompute hashes
        recomputed_config_hash = sha256_hash(current_raw_config)

        finding_leaves: list[str] = []
        findings_canonical: list[dict[str, Any]] = []

        for f in sorted(job.findings or [], key=lambda x: str(x.id)):
            item = {
                "id": str(f.id),
                "control_id": f.control_id,
                "framework": f.framework,
                "severity": f.severity,
                "finding_title": f.finding_title,
                "finding_description": f.finding_description,
                "device_rule_reference": f.device_rule_reference,
            }
            f_str = json.dumps(item, sort_keys=True)
            f_hash = sha256_hash(f_str)
            finding_leaves.append(f_hash)
            findings_canonical.append(item)

        recomputed_results_hash = sha256_hash(json.dumps(findings_canonical, sort_keys=True))
        recomputed_merkle_root = compute_merkle_root(finding_leaves)

        config_match = recomputed_config_hash == block.config_snapshot_hash
        results_match = recomputed_results_hash == block.audit_results_hash
        merkle_match = recomputed_merkle_root == block.merkle_root

        is_tampered = not (config_match and results_match and merkle_match)

        status_str = "VALID"
        if not config_match:
            status_str = "TAMPERED_CONFIG"
        elif not results_match or not merkle_match:
            status_str = "TAMPERED_FINDINGS"

        return {
            "status": status_str,
            "is_valid": not is_tampered,
            "audit_job_id": str(audit_job_id),
            "block_height": block.block_height,
            "block_hash": block.block_hash,
            "prev_block_hash": block.prev_block_hash,
            "timestamp": block.timestamp.isoformat(),
            "merkle_root": block.merkle_root,
            "recomputed_merkle_root": recomputed_merkle_root,
            "config_snapshot_hash": block.config_snapshot_hash,
            "recomputed_config_hash": recomputed_config_hash,
            "audit_results_hash": block.audit_results_hash,
            "recomputed_results_hash": recomputed_results_hash,
            "config_integrity_verified": config_match,
            "findings_integrity_verified": results_match and merkle_match,
            "auditor_id": block.auditor_id,
            "compliance_score": block.compliance_score,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "certificate_qr_payload": {
                "type": "AEGIS_COMPLIANCE_PROOF",
                "audit_id": str(audit_job_id),
                "block_height": block.block_height,
                "block_hash": block.block_hash,
                "merkle_root": block.merkle_root,
                "status": status_str,
            },
        }

    async def list_blocks(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
    ) -> list[BlockchainBlock]:
        """List blockchain blocks in reverse chronological order."""
        await self._ensure_genesis_block(db)
        result = await db.execute(
            select(BlockchainBlock)
            .order_by(BlockchainBlock.block_height.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def verify_entire_chain(self, db: AsyncSession) -> dict[str, Any]:
        """Verify hash continuity and integrity across all blocks from Genesis to Top."""
        await self._ensure_genesis_block(db)
        result = await db.execute(
            select(BlockchainBlock).order_by(BlockchainBlock.block_height.asc())
        )
        blocks = list(result.scalars().all())

        if not blocks:
            return {"status": "EMPTY", "is_valid": True, "total_blocks": 0}

        corrupted_blocks = []
        for i in range(1, len(blocks)):
            current = blocks[i]
            prev = blocks[i - 1]

            if current.prev_block_hash != prev.block_hash:
                corrupted_blocks.append({
                    "height": current.block_height,
                    "expected_prev": prev.block_hash,
                    "actual_prev": current.prev_block_hash,
                })

        is_healthy = len(corrupted_blocks) == 0
        return {
            "status": "HEALTHY" if is_healthy else "CHAIN_CORRUPTED",
            "is_valid": is_healthy,
            "total_blocks": len(blocks),
            "genesis_block_hash": blocks[0].block_hash,
            "latest_block_height": blocks[-1].block_height,
            "latest_block_hash": blocks[-1].block_hash,
            "corrupted_blocks": corrupted_blocks,
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }


blockchain_service = BlockchainService()
