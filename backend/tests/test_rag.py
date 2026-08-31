"""Unit tests for RAG embedding, RRF calculation, and citation enrichment."""

from backend.schemas.audit import FindingSchema
from backend.services.citation_service import citation_service
from backend.services.rag_service import DenseEmbedder


def test_dense_embedder():
    embedder = DenseEmbedder(model_name="fallback")
    vectors = embedder.encode(["Firewall rule security violation", "Access control AC-4"])
    assert len(vectors) == 2
    assert len(vectors[0]) == 1024


def test_citation_enrichment():
    findings = [
        FindingSchema(
            control_id="AC-4",
            framework="NIST_800_53_R5",
            severity="Critical",
            finding_title="Information Flow Violation",
            finding_description="Permit any-any rule detected",
            device_rule_reference="access-list OUTSIDE_IN permit ip any any",
            remediation="Apply least privilege",
            citation_source="NIST SP 800-53 Rev 5",
            citation_section="Section 3.4 AC-4",
            citation_url=None,
            citation_page=None,
            confidence_score=0.98,
        )
    ]

    meta_map = {
        "AC-4": {
            "source_url": "https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final",
            "source_page": 47,
            "framework": "NIST SP 800-53 Rev 5",
        }
    }

    enriched = citation_service.enrich_citations(findings, meta_map)
    assert enriched[0].citation_page == 47
    assert "https://csrc.nist.gov" in enriched[0].citation_url
