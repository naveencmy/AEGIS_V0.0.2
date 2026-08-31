"""Framework Pydantic Schemas."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ControlResponse(BaseModel):
    id: uuid.UUID
    framework: str
    control_id: str
    title: str
    description: str
    guidance: str | None = None
    severity: str
    source_url: str | None = None
    source_page: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class SearchResult(BaseModel):
    control_id: str
    framework: str
    title: str
    description: str
    guidance: str | None = None
    source_url: str | None = None
    source_page: int | None = None
    score: float = 0.0


class FrameworkSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    controls: list[ControlResponse]
