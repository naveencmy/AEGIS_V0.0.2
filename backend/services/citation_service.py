"""Citation Extraction and Source Grounding Validation Service."""

from typing import Any
from backend.core.logging import logger
from backend.schemas.audit import FindingSchema
from backend.utils.validators import is_valid_citation_source


class CitationService:
    """Service to validate source citations, verify control IDs, and prevent hallucinations."""

    def validate_finding(
        self,
        finding: FindingSchema,
        valid_control_ids: set[str],
    ) -> bool:
        """Verify that finding references an existing, retrieved control ID and valid publication."""
        # 1. Control ID existence check
        if finding.control_id not in valid_control_ids:
            logger.warn(
                "Rejected hallucinated control ID",
                control_id=finding.control_id,
                valid_ids=list(valid_control_ids),
            )
            return False

        # 2. Source document check
        if not is_valid_citation_source(finding.citation_source):
            logger.warn(
                "Rejected unverified citation source",
                source=finding.citation_source,
            )
            return False

        return True

    def enrich_citations(
        self,
        findings: list[FindingSchema],
        control_metadata_map: dict[str, dict[str, Any]],
    ) -> list[FindingSchema]:
        """Enrich citations with exact URL and page numbers from ground truth database records."""
        enriched = []
        for f in findings:
            meta = control_metadata_map.get(f.control_id)
            if meta:
                # Fill missing URLs or pages from ground truth
                if not f.citation_url and meta.get("source_url"):
                    f.citation_url = meta["source_url"]
                if (not f.citation_page or f.citation_page <= 0) and meta.get("source_page"):
                    f.citation_page = meta["source_page"]
                if not f.citation_source and meta.get("framework"):
                    f.citation_source = meta.get("source_name", meta["framework"])
                if not f.citation_section:
                    f.citation_section = f.control_id
            enriched.append(f)
        return enriched


citation_service = CitationService()
