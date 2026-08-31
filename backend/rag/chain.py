"""
IP-SAKTI Sahayak — RAG Chain
Orchestrates: Retrieval → LLM Generation → Citation Extraction → Guard Validation.
Implements LangChain RetrievalQA with citation-native prompt and demo-mode fallback.
"""

import logging
import re
import time
from typing import Optional

from backend.config import settings
from backend.schemas import (
    ChatRequest, ChatResponse, CitationItem,
)
from backend.rag.retriever import retriever
from backend.rag.prompts import build_prompt, SYSTEM_PROMPT
from backend.models.llm_loader import llm_loader
from backend.mock_responses import get_mock_response

logger = logging.getLogger("ipsakti.rag.chain")


# ── Section Number Validation ────────────────────────────────────

SECTION_PATTERNS = [
    re.compile(r"Section\s+(\d+[\(\w\)\-\.]*)", re.IGNORECASE),
    re.compile(r"Rule\s+(\d+[\-\w]*)", re.IGNORECASE),
    re.compile(r"Article\s+(\d+[\.\d\(\w\)]*)", re.IGNORECASE),
    re.compile(r"Schedule\s+([A-Z\d]+)", re.IGNORECASE),
    re.compile(r"Circular\s+([\d/]+)", re.IGNORECASE),
]

INLINE_CITATION_PATTERN = re.compile(
    r"\[([^\]]+?),\s*(?:Section|Rule|Article|Clause)\s+([^\],]+?)(?:,\s*p\.?\s*(\d+))?\]",
    re.IGNORECASE,
)


class IPSaktiRAGChain:
    """
    Sovereign RAG Chain for Ayurveda IP & Regulatory Compliance.
    Pipeline: Query → Retrieve → Generate → Extract Citations → Validate → Respond.
    """

    def __init__(self):
        self.retriever = retriever
        self.llm = llm_loader

    def run(self, request: ChatRequest) -> ChatResponse:
        """Execute the full RAG pipeline."""
        start_time = time.perf_counter()
        query = request.query.strip()

        logger.info(f"RAG Chain executing: '{query[:80]}...'")

        # ── Step 0: Demo Mode Check ──────────────────────────────
        if settings.DEMO_MODE or not self.llm.is_loaded:
            mock = get_mock_response(query)
            if mock:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return self._build_response_from_mock(
                    query, mock, elapsed_ms
                )

        # ── Step 1: Retrieve ─────────────────────────────────────
        regime_filter = request.regime_filter
        chunks = self.retriever.retrieve(
            query=query,
            regime_filter=regime_filter,
            k=settings.RETRIEVAL_TOP_K,
            score_threshold=settings.SIMILARITY_THRESHOLD,
        )

        if not chunks:
            logger.info("No relevant chunks found above threshold.")
            # Try mock as fallback
            mock = get_mock_response(query)
            if mock:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return self._build_response_from_mock(query, mock, elapsed_ms)

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return ChatResponse(
                query=query,
                answer=settings.NO_ANSWER_RESPONSE,
                citations=[],
                regime_tags=[],
                confidence="low",
                disclaimer=settings.LEGAL_DISCLAIMER,
                language_detected=self._detect_language(query),
                processing_time_ms=round(elapsed_ms, 2),
            )

        # ── Step 2: Generate with LLM ────────────────────────────
        system_prompt, user_prompt = build_prompt(query, chunks)
        raw_answer = None

        if self.llm.is_loaded:
            try:
                raw_answer = self.llm.generate(system_prompt, user_prompt)
            except Exception as e:
                logger.error(f"LLM generation failed: {e}")

        # ── Step 3: Fallback to structured synthesis if LLM fails
        if not raw_answer:
            # Check mock first
            mock = get_mock_response(query)
            if mock:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return self._build_response_from_mock(query, mock, elapsed_ms)

            # Synthesize from chunks directly
            raw_answer = self._synthesize_from_chunks(query, chunks)

        # ── Step 4: Extract Citations from Retrieved Chunks ──────
        citations = self._extract_citations(chunks)

        # ── Step 5: Validate Section Numbers ─────────────────────
        raw_answer = self._validate_citations_in_text(raw_answer, chunks)

        # ── Step 6: Extract Regime Tags ──────────────────────────
        regime_tags = self._extract_regime_tags(chunks)

        # ── Step 7: Compute Confidence ───────────────────────────
        avg_score = (
            sum(c.relevance_score for c in citations) / len(citations)
            if citations else 0.0
        )
        confidence = "high" if avg_score > 0.85 else ("medium" if avg_score > 0.65 else "low")

        # ── Step 8: Ensure Disclaimer ────────────────────────────
        if settings.LEGAL_DISCLAIMER not in raw_answer:
            raw_answer += f"\n\n*{settings.LEGAL_DISCLAIMER}*"

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return ChatResponse(
            query=query,
            answer=raw_answer,
            citations=citations,
            regime_tags=regime_tags,
            confidence=confidence,
            disclaimer=settings.LEGAL_DISCLAIMER,
            language_detected=self._detect_language(query),
            processing_time_ms=round(elapsed_ms, 2),
        )

    def _extract_citations(self, chunks: list[dict]) -> list[CitationItem]:
        """Build CitationItem list from retrieved chunks."""
        citations = []
        for chunk in chunks:
            meta = chunk.get("metadata", {})
            citations.append(CitationItem(
                source_title=meta.get("source_title", "Unknown Document"),
                section=meta.get("section_number"),
                page=meta.get("page_number"),
                authority=meta.get("issuing_authority"),
                regime=meta.get("regime"),
                relevance_score=round(chunk.get("relevance_score", 0.0), 4),
                chunk_id=chunk.get("id"),
                full_text=chunk.get("content", ""),
            ))
        return citations

    def _validate_citations_in_text(self, text: str, chunks: list[dict]) -> str:
        """
        Anti-hallucination guardrail: validate that section numbers in the
        LLM output actually exist in the retrieved chunk metadata.
        """
        # Collect all known section numbers from chunks
        known_sections = set()
        for chunk in chunks:
            meta = chunk.get("metadata", {})
            for key in ("section_number", "clause_number"):
                val = meta.get(key)
                if val:
                    known_sections.add(str(val).strip().lower())

        # Find inline citations in LLM output
        for match in INLINE_CITATION_PATTERN.finditer(text):
            doc_title = match.group(1).strip()
            section_ref = match.group(2).strip()

            # Check if section exists in known metadata
            if section_ref.lower() not in known_sections:
                # Strip the invalid citation — replace with generic reference
                old = match.group(0)
                new = f"[{doc_title}, exact section reference unavailable]"
                text = text.replace(old, new)
                logger.warning(
                    f"[GUARD] Stripped hallucinated section: {section_ref} "
                    f"from document '{doc_title}'"
                )

        return text

    def _extract_regime_tags(self, chunks: list[dict]) -> list[str]:
        """Extract unique regime tags from retrieved chunks."""
        regimes = set()
        for chunk in chunks:
            meta = chunk.get("metadata", {})
            regime = meta.get("regime")
            if regime:
                regimes.add(regime)
        return sorted(list(regimes))

    def _synthesize_from_chunks(self, query: str, chunks: list[dict]) -> str:
        """
        Structured synthesis when LLM is unavailable.
        Compiles chunk content into a formatted answer with inline citations.
        """
        sections = []
        sections.append(f"### Regulatory Intelligence Summary\n")

        for idx, chunk in enumerate(chunks, 1):
            meta = chunk.get("metadata", {})
            title = meta.get("source_title", "Unknown")
            section = meta.get("section_number", "N/A")
            page = meta.get("page_number", "N/A")
            authority = meta.get("issuing_authority", "")
            regime = meta.get("regime", "national").upper()
            content = chunk.get("content", "").strip()

            # Truncate long content
            if len(content) > 500:
                content = content[:500] + "..."

            citation = f"[{title}, Section {section}, p.{page}]"
            sections.append(
                f"**[{regime}]** {content} {citation}\n"
            )

        return "\n".join(sections)

    def _detect_language(self, text: str) -> str:
        """Simple language detection based on character scripts."""
        devanagari_count = sum(1 for c in text if '\u0900' <= c <= '\u097F')
        total_alpha = sum(1 for c in text if c.isalpha())

        if total_alpha == 0:
            return "en"
        if devanagari_count / total_alpha > 0.3:
            return "hi"
        # Sanskrit uses Devanagari too — check for common Sanskrit markers
        sanskrit_markers = ["श्लोक", "सूत्र", "अध्याय", "संहिता", "आयुर्वेद"]
        if any(m in text for m in sanskrit_markers):
            return "sa"
        return "en"

    def _build_response_from_mock(
        self, query: str, mock: dict, elapsed_ms: float
    ) -> ChatResponse:
        """Build ChatResponse from a mock/demo response dict."""
        citations = []
        for c in mock.get("citations", []):
            citations.append(CitationItem(
                source_title=c.get("source_title", ""),
                section=c.get("section"),
                page=c.get("page"),
                authority=c.get("authority"),
                regime=c.get("regime"),
                relevance_score=c.get("relevance_score", 0.0),
                chunk_id=c.get("chunk_id"),
                full_text=c.get("full_text"),
            ))

        return ChatResponse(
            query=query,
            answer=mock.get("answer", ""),
            citations=citations,
            regime_tags=mock.get("regime_tags", []),
            confidence=mock.get("confidence", "high"),
            disclaimer=settings.LEGAL_DISCLAIMER,
            language_detected=mock.get("language_detected", "en"),
            processing_time_ms=round(elapsed_ms, 2),
            mode="guaranteed_response",
        )


# Module-level singleton
rag_chain = IPSaktiRAGChain()
