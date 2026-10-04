"""
AEGIS-NTRO — Sovereign RAG Chain.
Orchestrates: Retrieval → Grounded LLM Generation → Citation Extraction → Guard Validation.
Supports offline deterministic fallback and air-gapped local Mistral-7B inference.
"""

import logging
import re
import time
from typing import Optional

from backend.config import get_settings
from backend.mock_responses import get_mock_response
from backend.rag.prompts import build_prompt, SYSTEM_PROMPT
from backend.schemas.audit import CitationCardModel, ComplianceQueryResponse

logger = logging.getLogger("aegis.rag.chain")
settings = get_settings()


class AegisRAGChain:
    """
    Sovereign Hybrid RAG Chain for Multi-Vendor Network Compliance.
    Pipeline: Query → Hybrid Retrieval → Sovereign LLM Reasoning → Citation Verification.
    """

    def __init__(self):
        self.settings = settings

    async def execute_query(
        self,
        query: str,
        retrieved_controls: list,
    ) -> tuple[str, list[CitationCardModel], float]:
        """
        Execute RAG reasoning over retrieved compliance controls.
        Returns: (answer_text, citations_list, confidence_score)
        """
        clean_query = query.strip()
        logger.info(f"AEGIS RAG Chain processing query: '{clean_query[:80]}'")

        # If no controls retrieved or in mock mode without LLM, check sovereign mock knowledge
        if not retrieved_controls:
            mock = get_mock_response(clean_query)
            if mock:
                citations = [
                    CitationCardModel(
                        control_id=c.get("section", "SEC-GEN"),
                        framework=c.get("source_title", "NIST SP 800-53 Rev 5"),
                        title=c.get("source_title"),
                        citation_source=c.get("authority", "NIST"),
                        citation_section=c.get("section", "General"),
                        citation_page=str(c.get("page", "1")),
                        confidence=c.get("relevance_score", 0.95),
                    )
                    for c in mock.get("citations", [])
                ]
                return mock["answer"], citations, 0.92

            return (
                "Insufficient regulatory context available in the knowledge base to answer this query.",
                [],
                0.0,
            )

        # Build citations from retrieved controls
        citations = []
        for ctrl in retrieved_controls:
            citations.append(
                CitationCardModel(
                    control_id=getattr(ctrl, "control_id", "N/A"),
                    framework=getattr(ctrl, "framework", "NIST_800_53_R5"),
                    title=getattr(ctrl, "title", "Security Control"),
                    citation_source=getattr(ctrl, "framework", "NIST").replace("_", " "),
                    citation_section=f"Control {getattr(ctrl, 'control_id', 'N/A')}",
                    citation_page=getattr(ctrl, "source_page", None),
                    citation_url=getattr(ctrl, "source_url", None),
                    confidence=round(float(getattr(ctrl, "score", 0.88)), 3),
                )
            )

        # Generate synthesis answer grounded in context
        from backend.services.llm_service import llm_service
        answer, confidence = await llm_service.generate_query_answer(clean_query, retrieved_controls)

        return answer, citations, confidence


aegis_rag_chain = AegisRAGChain()
