"""Device configuration management and parsing endpoints."""

import uuid
from typing import Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.logging import logger
from backend.dependencies import get_db
from backend.models.device import DeviceConfig
from backend.schemas.device import DeviceConfigResponse, DeviceUploadResponse
from backend.services.parser_service import parser_service
from backend.services.queue_service import queue_service

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.post("/upload", response_model=DeviceUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_device_config(
    file: UploadFile = File(..., description="Raw device configuration file"),
    vendor: str = Form(..., description="Vendor: cisco, palo_alto, juniper, fortinet"),
    device_name: str = Form(..., description="Device hostname or identifier"),
    device_type: str = Form(default="firewall", description="firewall, router, switch"),
    db: AsyncSession = Depends(get_db),
) -> DeviceUploadResponse:
    """Upload a network device configuration for automated parsing and audit."""
    content_bytes = await file.read()
    raw_config = content_bytes.decode("utf-8", errors="replace")

    # Quick synchronous parse to validate and store parsed rules
    parsed = parser_service.parse_config(vendor, raw_config)
    
    device = DeviceConfig(
        device_name=device_name or parsed.hostname,
        vendor=vendor.lower(),
        device_type=device_type,
        raw_config=raw_config,
        parsed_rules=parsed.model_dump(),
        status="parsed",
    )
    db.add(device)
    await db.commit()
    await db.refresh(device)

    # Also enqueue background parsing job to maintain queue pipeline
    await queue_service.enqueue(
        db=db,
        job_type="parse_config",
        payload={"device_config_id": str(device.id)},
    )

    logger.info("Device config uploaded and parsed", device_id=str(device.id), vendor=vendor)

    return DeviceUploadResponse(
        device_config_id=device.id,
        status="parsed",
        message="Configuration uploaded and parsed successfully",
        vendor=vendor,
        device_name=device.device_name,
    )


@router.get("", response_model=list[DeviceConfigResponse])
async def list_devices(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
) -> list[DeviceConfigResponse]:
    """List all ingested device configurations."""
    query = select(DeviceConfig).order_by(DeviceConfig.uploaded_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    devices = result.scalars().all()
    
    return [
        DeviceConfigResponse(
            id=d.id,
            device_name=d.device_name,
            vendor=d.vendor,
            device_type=d.device_type,
            status=d.status,
            uploaded_at=d.uploaded_at,
            raw_config_snippet=d.raw_config[:500] if d.raw_config else None,
            parsed_rules=d.parsed_rules,
        )
        for d in devices
    ]


@router.get("/{device_config_id}", response_model=DeviceConfigResponse)
async def get_device_config(
    device_config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DeviceConfigResponse:
    """Retrieve specific device configuration and extracted security rules."""
    device = await db.get(DeviceConfig, device_config_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device configuration '{device_config_id}' not found",
        )

    return DeviceConfigResponse(
        id=device.id,
        device_name=device.device_name,
        vendor=device.vendor,
        device_type=device.device_type,
        status=device.status,
        uploaded_at=device.uploaded_at,
        raw_config_snippet=device.raw_config,
        parsed_rules=device.parsed_rules,
    )


@router.post("/{device_config_id}/parse", response_model=DeviceConfigResponse)
async def reparse_device_config(
    device_config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DeviceConfigResponse:
    """Trigger re-parsing of raw device configuration."""
    device = await db.get(DeviceConfig, device_config_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    parsed = parser_service.parse_config(device.vendor, device.raw_config)
    device.parsed_rules = parsed.model_dump()
    device.status = "parsed"
    await db.commit()
    await db.refresh(device)

    return DeviceConfigResponse(
        id=device.id,
        device_name=device.device_name,
        vendor=device.vendor,
        device_type=device.device_type,
        status=device.status,
        uploaded_at=device.uploaded_at,
        raw_config_snippet=device.raw_config,
        parsed_rules=device.parsed_rules,
    )
