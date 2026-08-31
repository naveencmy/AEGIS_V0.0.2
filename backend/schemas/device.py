"""Device Pydantic Schemas."""

import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class DeviceUploadResponse(BaseModel):
    device_config_id: uuid.UUID
    status: str
    message: str
    vendor: str
    device_name: str


class DeviceConfigResponse(BaseModel):
    id: uuid.UUID
    device_name: str
    vendor: str
    device_type: str
    status: str
    uploaded_at: datetime
    raw_config_snippet: str | None = None
    parsed_rules: dict[str, Any] | None = None

    class Config:
        from_attributes = True
