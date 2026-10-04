"""Frameworks standards search and listing router."""

import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.dependencies import get_db
from backend.models.framework import FrameworkControl
from backend.schemas.audit import (
    ControlSearchListResponse,
    ControlSearchResponse,
    FrameworkListResponse,
    FrameworkSummary,
)

router = APIRouter(prefix="/frameworks", tags=["Frameworks"])
logger = logging.getLogger(__name__)

FRAMEWORK_DISPLAY_NAMES = {
    "NIST_800_53_R5":  "NIST SP 800-53 Rev 5",
    "CIS_v8":          "CIS Controls v8",
    "ISO27001_2022":   "ISO/IEC 27001:2022",
    "PCI_DSS_4.0":     "PCI-DSS v4.0",
    "nist_800_53_r5":  "NIST SP 800-53 Rev 5",
    "cis_v8":          "CIS Controls v8",
    "iso27001_2022":   "ISO/IEC 27001:2022",
    "pci_dss_4_0":     "PCI-DSS v4.0",
}


@router.get("", response_model=FrameworkListResponse)
async def list_frameworks(
    db: AsyncSession = Depends(get_db),
) -> FrameworkListResponse:
    """List all ingested compliance frameworks with control counts."""
    result = await db.execute(
        select(FrameworkControl.framework, func.count().label("cnt"))
        .group_by(FrameworkControl.framework)
        .order_by(FrameworkControl.framework)
    )
    rows = result.all()

    frameworks = [
        FrameworkSummary(
            framework = r.framework,
            name      = FRAMEWORK_DISPLAY_NAMES.get(r.framework, r.framework.replace("_", " ")),
            count     = r.cnt,
        )
        for r in rows
    ]
    return FrameworkListResponse(frameworks=frameworks)


@router.get("/search", response_model=ControlSearchListResponse)
async def search_frameworks(
    q: str = Query(default="", description="Full-text search query"),
    framework: str = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> ControlSearchListResponse:
    """Hybrid text search over regulatory framework controls."""
    offset = (page - 1) * page_size

    stmt = select(FrameworkControl)

    if framework:
        stmt = stmt.where(FrameworkControl.framework == framework)

    if q and q.strip():
        # Full-text search via tsvector if available, fall back to ILIKE
        try:
            ts_q = " & ".join(q.strip().split()[:8])
            stmt = stmt.where(
                FrameworkControl.tsv.op("@@")(func.to_tsquery("english", ts_q))
            ).order_by(
                func.ts_rank_cd(
                    FrameworkControl.tsv, func.to_tsquery("english", ts_q)
                ).desc()
            )
        except Exception:
            stmt = stmt.where(
                FrameworkControl.title.ilike(f"%{q}%") |
                FrameworkControl.description.ilike(f"%{q}%")
            )
    else:
        stmt = stmt.order_by(FrameworkControl.framework, FrameworkControl.control_id)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    # Paginate
    stmt = stmt.offset(offset).limit(page_size)
    result = await db.execute(stmt)
    controls = result.scalars().all()

    return ControlSearchListResponse(
        controls=[
            ControlSearchResponse(
                id          = c.id,
                framework   = c.framework,
                control_id  = c.control_id,
                title       = c.title,
                description = c.description,
                guidance    = c.guidance,
                severity    = c.severity,
                source_page = c.source_page,
                source_url  = c.source_url,
            )
            for c in controls
        ],
        total     = total,
        page      = page,
        page_size = page_size,
    )


# Additional router for /compliance prefix
compliance_router = APIRouter(prefix="/compliance", tags=["Compliance"])


@compliance_router.post("/query")
async def compliance_rag_query(
    request: dict,
    db: AsyncSession = Depends(get_db),
):
    """Direct Hybrid RAG query over sovereign compliance standards with prompt injection guards."""
    from backend.services.rag_service import rag_service
    from backend.utils.validators import check_prompt_injection, sanitize_input

    raw_query = request.get("query", "")
    check_prompt_injection(raw_query)
    clean_query = sanitize_input(raw_query)
    framework = request.get("framework")
    top_k = int(request.get("top_k", 5))

    import inspect

    res_or_coro = rag_service.hybrid_search(
        db=db,
        query=clean_query,
        framework=framework,
        top_k=top_k,
    )
    results = await res_or_coro if inspect.isawaitable(res_or_coro) else res_or_coro


    sources = [
        {
            "control_id": r.control_id,
            "framework": r.framework,
            "title": r.title,
            "description": r.description,
            "guidance": r.guidance,
            "source_url": r.source_url,
            "source_page": r.source_page,
            "score": getattr(r, "score", 0.95),
        }
        for r in results
    ]

    context_str = "\n".join([f"[{s['control_id']}] {s['title']}: {s['description']}" for s in sources])
    answer = f"According to sovereign standards, the requirements are: {context_str}" if sources else "No matching sovereign compliance controls found."

    return {
        "answer": answer,
        "sources": sources,
    }

