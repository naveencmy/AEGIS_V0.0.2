"""
AEGIS-NTRO — Blockchain Evidence Ledger Router.
Exposes endpoints to query immutable audit blocks, verify audit tampering status,
and validate the cryptographic continuity of the Merkle chain.
"""

import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, limiter
from backend.schemas.audit import (
    BlockchainBlockResponse,
    BlockchainVerifyResponse,
    ChainVerifyResponse,
)
from backend.services.blockchain_service import blockchain_service

router = APIRouter(prefix="/blockchain", tags=["Blockchain Evidence Ledger"])
logger = logging.getLogger("aegis.router.blockchain")


@router.get("/blocks", response_model=List[BlockchainBlockResponse])
@limiter.limit("30/minute")
async def list_blockchain_blocks(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[BlockchainBlockResponse]:
    """Retrieve immutable audit ledger blocks in reverse chronological order."""
    blocks = await blockchain_service.list_blocks(db=db, skip=skip, limit=limit)
    return [
        BlockchainBlockResponse(
            id=b.id,
            block_height=b.block_height,
            block_hash=b.block_hash,
            prev_block_hash=b.prev_block_hash,
            timestamp=b.timestamp,
            audit_job_id=b.audit_job_id,
            device_config_id=b.device_config_id,
            config_snapshot_hash=b.config_snapshot_hash,
            audit_results_hash=b.audit_results_hash,
            merkle_root=b.merkle_root,
            auditor_id=b.auditor_id,
            status=b.status,
            compliance_score=b.compliance_score,
            payload_metadata=b.payload_metadata or {},
        )
        for b in blocks
    ]


@router.get("/verify/{audit_job_id}", response_model=BlockchainVerifyResponse)
@limiter.limit("30/minute")
async def verify_audit_integrity(
    request: Request,
    audit_job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> BlockchainVerifyResponse:
    """
    Independently verify cryptographic integrity of an audit run.
    Recomputes SHA-256 hashes of config snapshot, finding payload, and Merkle tree root.
    """
    try:
        report = await blockchain_service.verify_audit(db=db, audit_job_id=audit_job_id)
        return BlockchainVerifyResponse(**report)
    except Exception as e:
        logger.exception("Failed to verify audit on blockchain")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}",
        )


@router.post("/anchor/{audit_job_id}", response_model=BlockchainBlockResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def anchor_audit_job(
    request: Request,
    audit_job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> BlockchainBlockResponse:
    """Manually anchor or re-anchor an audit job into the blockchain ledger."""
    try:
        block = await blockchain_service.anchor_audit(db=db, audit_job_id=audit_job_id)
        return BlockchainBlockResponse(
            id=block.id,
            block_height=block.block_height,
            block_hash=block.block_hash,
            prev_block_hash=block.prev_block_hash,
            timestamp=block.timestamp,
            audit_job_id=block.audit_job_id,
            device_config_id=block.device_config_id,
            config_snapshot_hash=block.config_snapshot_hash,
            audit_results_hash=block.audit_results_hash,
            merkle_root=block.merkle_root,
            auditor_id=block.auditor_id,
            status=block.status,
            compliance_score=block.compliance_score,
            payload_metadata=block.payload_metadata or {},
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.exception("Failed to anchor audit job")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anchoring failed: {str(e)}",
        )


@router.get("/verify-chain", response_model=ChainVerifyResponse)
@limiter.limit("20/minute")
async def verify_entire_chain(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ChainVerifyResponse:
    """Validate hash continuity across all blocks from Genesis (#0) to the latest block."""
    result = await blockchain_service.verify_entire_chain(db=db)
    return ChainVerifyResponse(**result)
