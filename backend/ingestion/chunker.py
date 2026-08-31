"""
IP-SAKTI Sahayak — Section-Based Chunker
Converts ParsedDocument sections into DocumentChunk objects with full metadata.
Handles oversized sections by splitting at paragraph boundaries.
"""

import logging
import uuid
from typing import Optional

from backend.schemas import DocumentChunk
from backend.ingestion.parser import (
    ParsedDocument, ParsedSection,
    infer_source_type, infer_authority, infer_regime, infer_category,
)
from backend.config import settings

logger = logging.getLogger("ipsakti.ingestion.chunker")


def estimate_tokens(text: str) -> int:
    """Rough token estimate: ~4 characters per token for English."""
    return len(text) // 4


def chunk_document(doc: ParsedDocument) -> list[DocumentChunk]:
    """
    Convert a ParsedDocument into a list of DocumentChunks.
    Each chunk = one section. Oversized sections are split by paragraph.
    """
    source_type = infer_source_type(doc.source_title)
    authority = infer_authority(doc.source_title)
    regime = infer_regime(doc.source_title)

    chunks: list[DocumentChunk] = []

    for section in doc.sections:
        text = section.text.strip()
        if not text:
            continue

        category = infer_category(text, section.section_number or "")
        tokens = estimate_tokens(text)

        if tokens <= settings.CHUNK_MAX_TOKENS:
            # Section fits in one chunk
            chunk = DocumentChunk(
                chunk_id=str(uuid.uuid4()),
                source_title=doc.source_title,
                source_type=source_type,
                issuing_authority=authority,
                section_number=section.section_number,
                clause_number=section.clause_number if hasattr(section, 'clause_number') else None,
                page_number=section.page_number,
                paragraph_number=section.paragraph_number,
                text=text,
                language=doc.language,
                regime=regime,
                category=category,
            )
            chunks.append(chunk)
        else:
            # Split oversized section into sub-chunks by paragraph
            sub_chunks = _split_section(
                section=section,
                source_title=doc.source_title,
                source_type=source_type,
                authority=authority,
                regime=regime,
                category=category,
                language=doc.language,
                max_tokens=settings.CHUNK_MAX_TOKENS,
                overlap_tokens=settings.CHUNK_OVERLAP_TOKENS,
            )
            chunks.extend(sub_chunks)

    logger.info(
        f"Chunked '{doc.source_title}': {len(doc.sections)} sections → "
        f"{len(chunks)} chunks"
    )
    return chunks


def _split_section(
    section: ParsedSection,
    source_title: str,
    source_type: str,
    authority: str,
    regime: str,
    category: str,
    language: str,
    max_tokens: int,
    overlap_tokens: int,
) -> list[DocumentChunk]:
    """
    Split an oversized section into smaller chunks at paragraph boundaries.
    Includes section header as context prefix in each sub-chunk.
    """
    text = section.text.strip()
    paragraphs = text.split("\n")

    # Context prefix: section header for continuity
    header_prefix = ""
    if section.section_number:
        header_prefix = f"[Section {section.section_number}]"
        if section.heading:
            header_prefix += f" {section.heading}"
        header_prefix += "\n"

    sub_chunks = []
    current_text = header_prefix
    sub_idx = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        candidate = current_text + para + "\n"
        if estimate_tokens(candidate) > max_tokens and current_text.strip() != header_prefix.strip():
            # Save current chunk
            sub_idx += 1
            chunk = DocumentChunk(
                chunk_id=str(uuid.uuid4()),
                source_title=source_title,
                source_type=source_type,
                issuing_authority=authority,
                section_number=section.section_number,
                page_number=section.page_number,
                paragraph_number=(section.paragraph_number or 0) + sub_idx,
                text=current_text.strip(),
                language=language,
                regime=regime,
                category=category,
            )
            sub_chunks.append(chunk)

            # Start new chunk with overlap context
            overlap_text = _get_overlap(current_text, overlap_tokens)
            current_text = header_prefix + overlap_text + para + "\n"
        else:
            current_text = candidate

    # Save final sub-chunk
    if current_text.strip() and current_text.strip() != header_prefix.strip():
        sub_idx += 1
        chunk = DocumentChunk(
            chunk_id=str(uuid.uuid4()),
            source_title=source_title,
            source_type=source_type,
            issuing_authority=authority,
            section_number=section.section_number,
            page_number=section.page_number,
            paragraph_number=(section.paragraph_number or 0) + sub_idx,
            text=current_text.strip(),
            language=language,
            regime=regime,
            category=category,
        )
        sub_chunks.append(chunk)

    return sub_chunks


def _get_overlap(text: str, overlap_tokens: int) -> str:
    """Get the last `overlap_tokens` worth of text for context continuity."""
    if overlap_tokens <= 0:
        return ""
    overlap_chars = overlap_tokens * 4  # rough conversion
    if len(text) <= overlap_chars:
        return text
    return "..." + text[-overlap_chars:]


def chunks_to_jsonl(chunks: list[DocumentChunk]) -> str:
    """Serialize chunks to JSONL format for export."""
    import json
    lines = []
    for chunk in chunks:
        lines.append(json.dumps(chunk.model_dump(), ensure_ascii=False))
    return "\n".join(lines)


# ── CLI Entry Point ──────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    from backend.ingestion.parser import parse_pdf

    if len(sys.argv) < 2:
        print("Usage: python -m backend.ingestion.chunker <path-to-pdf>")
        sys.exit(1)

    doc = parse_pdf(sys.argv[1])
    chunks = chunk_document(doc)

    print(f"\nGenerated {len(chunks)} chunks from '{doc.source_title}':\n")
    for i, c in enumerate(chunks[:5], 1):
        print(f"  [{i}] ID: {c.chunk_id[:8]}...")
        print(f"      Section: {c.section_number}, Page: {c.page_number}")
        print(f"      Regime: {c.regime}, Category: {c.category}")
        print(f"      Text: {c.text[:100].strip()}...")
        print()
