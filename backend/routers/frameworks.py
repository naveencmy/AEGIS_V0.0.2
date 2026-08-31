"""Compliance Frameworks search and management endpoints."""

from pathlib import Path
from typing import Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import get_settings
from backend.dependencies import get_db
from backend.models.framework import FrameworkControl
from backend.schemas.framework import ControlResponse, FrameworkSearchResponse
from backend.services.rag_service import rag_service

router = APIRouter(prefix="/frameworks", tags=["Frameworks"])
settings = get_settings()


@router.get("", response_model=dict[str, list[dict[str, str | int]]])
async def list_frameworks(
    db: AsyncSession = Depends(get_db),
) -> dict[str, list[dict[str, str | int]]]:
    """List available compliance standards and their control statistics."""
    query = select(
        FrameworkControl.framework,
        func.count(FrameworkControl.id).label("count"),
    ).group_by(FrameworkControl.framework)
    
    result = await db.execute(query)
    rows = result.fetchall()

    supported_defaults = [
        {"framework": "NIST_800_53_R5", "name": "NIST SP 800-53 Rev 5", "count": 0},
        {"framework": "CIS_v8", "name": "CIS Controls v8", "count": 0},
        {"framework": "ISO27001_2022", "name": "ISO/IEC 27001:2022", "count": 0},
        {"framework": "PCI_DSS_4.0", "name": "PCI-DSS 4.0", "count": 0},
    ]

    count_map = {r.framework: r.count for r in rows}
    for item in supported_defaults:
        if item["framework"] in count_map:
            item["count"] = count_map[item["framework"]]

    return {"frameworks": supported_defaults}


@router.get("/search", response_model=FrameworkSearchResponse)
async def search_framework_controls(
    q: str = Query(default="", description="Search text query"),
    framework: str | None = Query(default=None, description="Optional framework filter"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> FrameworkSearchResponse:
    """Fast full-text search across all compliance standards using PostgreSQL tsvector."""
    offset = (page - 1) * page_size
    framework_clause = "AND framework = :framework" if framework else ""

    if q.strip():
        # TSVector search
        count_sql = text(f"""
            SELECT COUNT(*) FROM framework_controls
            WHERE tsv @@ plainto_tsquery('english', :query) {framework_clause}
        """)
        search_sql = text(f"""
            SELECT id, framework, control_id, title, description, guidance, severity, source_url, source_page, created_at
            FROM framework_controls
            WHERE tsv @@ plainto_tsquery('english', :query) {framework_clause}
            ORDER BY ts_rank_cd(tsv, plainto_tsquery('english', :query)) DESC
            LIMIT :limit OFFSET :offset
        """)
        params = {"query": q, "limit": page_size, "offset": offset}
        if framework:
            params["framework"] = framework

        total = (await db.execute(count_sql, params)).scalar_one()
        rows = (await db.execute(search_sql, params)).fetchall()
    else:
        # Generic list
        count_sql = text(f"SELECT COUNT(*) FROM framework_controls WHERE 1=1 {framework_clause}")
        search_sql = text(f"""
            SELECT id, framework, control_id, title, description, guidance, severity, source_url, source_page, created_at
            FROM framework_controls
            WHERE 1=1 {framework_clause}
            ORDER BY framework, control_id
            LIMIT :limit OFFSET :offset
        """)
        params = {"limit": page_size, "offset": offset}
        if framework:
            params["framework"] = framework

        total = (await db.execute(count_sql, params)).scalar_one()
        rows = (await db.execute(search_sql, params)).fetchall()

    controls = [
        ControlResponse(
            id=r.id,
            framework=r.framework,
            control_id=r.control_id,
            title=r.title,
            description=r.description,
            guidance=r.guidance,
            severity=r.severity,
            source_url=r.source_url,
            source_page=r.source_page,
            created_at=r.created_at,
        )
        for r in rows
    ]

    return FrameworkSearchResponse(
        total=total,
        page=page,
        page_size=page_size,
        controls=controls,
    )


@router.post("/ingest", status_code=status.HTTP_200_OK)
async def trigger_framework_ingestion(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Ingest bundled compliance standards JSON/YAML into PostgreSQL."""
    fw_dir = settings.FRAMEWORKS_DIR
    results = {}

    files = [
        (fw_dir / "nist_sp_800_53_rev5.json", "NIST_800_53_R5"),
        (fw_dir / "cis_controls_v8.yaml", "CIS_v8"),
        (fw_dir / "iso27001_2022.json", "ISO27001_2022"),
    ]

    for fpath, name in files:
        if fpath.exists():
            cnt = await rag_service.ingest_framework_file(db, fpath, name)
            results[name] = cnt

    return {"status": "success", "ingested": results}
