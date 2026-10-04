"""Device upload, listing, retrieval, and configuration drift router."""

import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db, limiter
from backend.models.device import DeviceConfig
from backend.schemas.audit import (
    DeviceUploadResponse,
    DriftAnalysisResponse,
    DriftAnalyzeRequest,
    DriftLineResponse,
    SemanticDriftResponse,
)
from backend.services.drift_service import drift_service

router = APIRouter(prefix="/devices", tags=["Devices"])
logger = logging.getLogger("aegis.router.devices")

ALLOWED_VENDORS = {
    "cisco_ios", "cisco_asa", "cisco",
    "palo_alto", "paloalto",
    "juniper", "junos",
    "fortinet", "fortigate", "fortios",
}


@router.post("/upload", response_model=DeviceUploadResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def upload_device_config(
    request: Request,
    file: UploadFile = File(...),
    vendor: str = Form(...),
    device_name: str = Form(default=None),
    device_type: str = Form(default="firewall"),
    db: AsyncSession = Depends(get_db),
) -> DeviceUploadResponse:
    """Upload and store a raw device configuration file."""
    vendor_normalized = vendor.lower().strip().replace("-", "_").replace(" ", "_")
    if vendor_normalized not in ALLOWED_VENDORS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported vendor '{vendor}'. Supported: {sorted(ALLOWED_VENDORS)}",
        )

    # Read config content
    content_bytes = await file.read()
    if len(content_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=413, detail="Config file too large (max 10 MB)")

    try:
        raw_config = content_bytes.decode("utf-8", errors="replace")
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to decode file as UTF-8")

    device = DeviceConfig(
        vendor=vendor_normalized,
        device_name=device_name or file.filename,
        device_type=device_type,
        raw_config=raw_config,
        filename=file.filename,
    )
    db.add(device)
    await db.flush()

    logger.info("Device config uploaded", extra={"vendor": vendor_normalized, "id": str(device.id)})

    return DeviceUploadResponse(
        id=device.id,
        vendor=device.vendor,
        device_name=device.device_name,
        device_type=device.device_type,
        filename=device.filename,
        created_at=device.created_at,
    )


@router.get("", response_model=List[DeviceUploadResponse])
async def list_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[DeviceUploadResponse]:
    """List all registered device configurations."""
    result = await db.execute(
        select(DeviceConfig)
        .order_by(DeviceConfig.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    devices = result.scalars().all()
    return [
        DeviceUploadResponse(
            id=d.id,
            vendor=d.vendor,
            device_name=d.device_name,
            device_type=d.device_type,
            filename=d.filename,
            created_at=d.created_at,
        )
        for d in devices
    ]


@router.get("/{device_id}", response_model=DeviceUploadResponse)
async def get_device(
    device_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DeviceUploadResponse:
    """Retrieve a device config by ID."""
    result = await db.execute(select(DeviceConfig).where(DeviceConfig.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found")

    return DeviceUploadResponse(
        id=device.id,
        vendor=device.vendor,
        device_name=device.device_name,
        device_type=device.device_type,
        filename=device.filename,
        created_at=device.created_at,
    )


@router.post("/drift", response_model=DriftAnalysisResponse)
@limiter.limit("20/minute")
async def analyze_config_drift(
    request: Request,
    body: DriftAnalyzeRequest,
) -> DriftAnalysisResponse:
    """Analyze configuration drift between baseline and current configuration."""
    report = drift_service.analyze_drift(
        vendor=body.vendor,
        baseline_config=body.baseline_config,
        current_config=body.current_config,
        hostname=body.hostname or "network-device",
    )
    return DriftAnalysisResponse(
        vendor=report.vendor,
        hostname=report.hostname,
        total_added_lines=report.total_added_lines,
        total_removed_lines=report.total_removed_lines,
        drift_severity=report.drift_severity,
        security_regressions_detected=report.security_regressions_detected,
        security_improvements_detected=report.security_improvements_detected,
        semantic_drift=[
            SemanticDriftResponse(
                category=s.category,
                action=s.action,
                severity=s.severity,
                description=s.description,
                remediation_advice=s.remediation_advice,
            )
            for s in report.semantic_drift
        ],
        line_diff=[
            DriftLineResponse(
                change_type=l.change_type,
                line_number=l.line_number,
                content=l.content,
                security_impact=l.security_impact,
                impact_description=l.impact_description,
            )
            for l in report.line_diff
        ],
        summary=report.summary,
    )
