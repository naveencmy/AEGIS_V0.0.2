"""
IP-SAKTI Sahayak — PDF Parser
Extracts structured text from regulatory PDFs using pdfplumber.
Detects section headers, page numbers, and document structure via regex.
"""

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger("ipsakti.ingestion.parser")


@dataclass
class ParsedSection:
    """A parsed section from a PDF document."""
    section_number: Optional[str] = None
    clause_number: Optional[str] = None
    heading: str = ""
    text: str = ""
    page_number: int = 1
    paragraph_number: int = 0


@dataclass
class ParsedDocument:
    """Complete parsed output of a single PDF."""
    filename: str = ""
    source_title: str = ""
    total_pages: int = 0
    sections: list[ParsedSection] = field(default_factory=list)
    raw_text: str = ""
    language: str = "en"


# ── Section Header Regex Patterns ────────────────────────────────

SECTION_PATTERNS = [
    # Indian Acts: "Section 3(p)", "Section 25(1)(k)"
    re.compile(
        r"^(?:SECTION|Section|section)\s+(\d+[\(\w\)\-\.]*)\s*[\.\:\—\-]?\s*(.*)",
        re.MULTILINE
    ),
    # Rules: "Rule 161-B", "Rule 24"
    re.compile(
        r"^(?:RULE|Rule|rule)\s+(\d+[\-\w]*)\s*[\.\:\—\-]?\s*(.*)",
        re.MULTILINE
    ),
    # International: "Article 27.3(b)", "Article 65"
    re.compile(
        r"^(?:ARTICLE|Article|article)\s+(\d+[\.\d\(\w\)]*)\s*[\.\:\—\-]?\s*(.*)",
        re.MULTILINE
    ),
    # Chapters: "CHAPTER IV", "Chapter II"
    re.compile(
        r"^(?:CHAPTER|Chapter)\s+([IVXLC]+|\d+)\s*[\.\:\—\-]?\s*(.*)",
        re.MULTILINE
    ),
    # Numbered sections: "4.2.1 Labeling Requirements"
    re.compile(
        r"^(\d+\.\d+(?:\.\d+)?)\s+([A-Z].*)",
        re.MULTILINE
    ),
    # Schedule: "SCHEDULE E", "Schedule T"
    re.compile(
        r"^(?:SCHEDULE|Schedule)\s+([A-Z\d]+)\s*[\.\:\—\-]?\s*(.*)",
        re.MULTILINE
    ),
    # Annexure: "ANNEXURE-III"
    re.compile(
        r"^(?:ANNEXURE|Annexure)\s*[\-\s]*([A-Z\d\-]+)\s*[\.\:\—\-]?\s*(.*)",
        re.MULTILINE
    ),
]


def detect_language(text: str) -> str:
    """Detect language based on character script distribution."""
    devanagari = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    latin = sum(1 for c in text if 'a' <= c.lower() <= 'z')
    total = devanagari + latin
    if total == 0:
        return "en"
    if devanagari / total > 0.3:
        return "hi"
    return "en"


def infer_source_title(filename: str, first_page_text: str) -> str:
    """Infer document title from filename or first page content."""
    # Try to extract title from first few lines of the document
    lines = first_page_text.strip().split("\n")[:10]
    for line in lines:
        line = line.strip()
        # Look for lines that look like titles (all caps, or known patterns)
        if len(line) > 10 and (
            line.isupper()
            or "ACT" in line.upper()
            or "RULES" in line.upper()
            or "GUIDELINES" in line.upper()
            or "AGREEMENT" in line.upper()
        ):
            # Clean up and return
            return line.title().strip()

    # Fallback to cleaned filename
    name = Path(filename).stem
    name = re.sub(r"[_\-]+", " ", name)
    return name.title()


def infer_source_type(title: str) -> str:
    """Infer source document type from title."""
    title_lower = title.lower()
    if "act" in title_lower:
        return "Act"
    if "rule" in title_lower:
        return "Rules"
    if "guideline" in title_lower or "gmp" in title_lower:
        return "Guideline"
    if "circular" in title_lower:
        return "Circular"
    if "agreement" in title_lower or "trips" in title_lower or "treaty" in title_lower:
        return "InternationalAgreement"
    if any(k in title_lower for k in ("samhita", "pharmacopoeia", "charaka", "sushruta")):
        return "TraditionalText"
    return "Guideline"


def infer_authority(title: str) -> str:
    """Infer issuing authority from document title."""
    title_lower = title.lower()
    if any(k in title_lower for k in ("patent", "trademark", "design", "ip india")):
        return "IP India"
    if any(k in title_lower for k in ("ayush", "gmp", "asu")):
        return "Ministry of Ayush"
    if any(k in title_lower for k in ("drug", "cosmetic", "cdsco")):
        return "CDSCO"
    if any(k in title_lower for k in ("trips", "wto")):
        return "WTO"
    if any(k in title_lower for k in ("wipo", "pct")):
        return "WIPO"
    if any(k in title_lower for k in ("tkdl", "csir")):
        return "CSIR"
    if any(k in title_lower for k in ("samhita", "pharmacopoeia", "api")):
        return "Ministry of Ayush"
    return "Government of India"


def infer_regime(title: str) -> str:
    """Infer legal regime from document title."""
    title_lower = title.lower()
    if any(k in title_lower for k in ("trips", "wipo", "pct", "wto", "international", "eu")):
        return "international"
    if any(k in title_lower for k in ("samhita", "charaka", "sushruta", "pharmacopoeia")):
        return "traditional"
    return "national"


def infer_category(text: str, section: str = "") -> str:
    """Infer topic category from text content."""
    combined = (text + " " + section).lower()
    if any(k in combined for k in ("patent", "3(p)", "3(d)", "inventive step", "novelty")):
        return "patentability"
    if any(k in combined for k in ("gmp", "good manufacturing", "schedule t", "premises")):
        return "gmp"
    if any(k in combined for k in ("export", "registration", "import")):
        return "export"
    if any(k in combined for k in ("label", "packaging", "marking")):
        return "labeling"
    if any(k in combined for k in ("tkdl", "traditional knowledge digital", "prior art")):
        return "tkdl"
    if any(k in combined for k in ("prior art", "anticipation", "novelty search")):
        return "prior_art"
    return "general"


def parse_pdf(filepath: str | Path) -> ParsedDocument:
    """
    Parse a regulatory PDF into structured sections.
    Uses pdfplumber for text extraction with layout preservation.
    Falls back to PyPDF2 if pdfplumber fails.
    """
    filepath = Path(filepath)
    if not filepath.exists():
        raise FileNotFoundError(f"PDF not found: {filepath}")

    logger.info(f"Parsing PDF: {filepath.name}")

    # ── Try pdfplumber first ─────────────────────────────────────
    try:
        return _parse_with_pdfplumber(filepath)
    except Exception as e:
        logger.warning(f"pdfplumber failed for {filepath.name}: {e}. Trying PyPDF2...")

    # ── Fallback to PyPDF2 ───────────────────────────────────────
    try:
        return _parse_with_pypdf2(filepath)
    except Exception as e:
        logger.error(f"Both parsers failed for {filepath.name}: {e}")
        raise


def _parse_with_pdfplumber(filepath: Path) -> ParsedDocument:
    """Parse PDF using pdfplumber (preserves layout)."""
    import pdfplumber

    page_texts = []
    with pdfplumber.open(filepath) as pdf:
        total_pages = len(pdf.pages)
        for page in pdf.pages:
            text = page.extract_text() or ""
            page_texts.append((page.page_number, text))

    if not page_texts:
        raise ValueError(f"No text extracted from {filepath.name}")

    # Build full text and detect sections
    full_text = "\n".join(text for _, text in page_texts)
    first_page = page_texts[0][1] if page_texts else ""

    source_title = infer_source_title(filepath.name, first_page)
    language = detect_language(full_text)

    sections = _extract_sections(page_texts)

    doc = ParsedDocument(
        filename=filepath.name,
        source_title=source_title,
        total_pages=total_pages,
        sections=sections,
        raw_text=full_text,
        language=language,
    )

    logger.info(
        f"Parsed {filepath.name}: {total_pages} pages, "
        f"{len(sections)} sections, language={language}"
    )
    return doc


def _parse_with_pypdf2(filepath: Path) -> ParsedDocument:
    """Parse PDF using PyPDF2 (simpler fallback)."""
    from PyPDF2 import PdfReader

    reader = PdfReader(str(filepath))
    total_pages = len(reader.pages)

    page_texts = []
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        page_texts.append((i, text))

    if not page_texts:
        raise ValueError(f"No text extracted from {filepath.name}")

    full_text = "\n".join(text for _, text in page_texts)
    first_page = page_texts[0][1] if page_texts else ""

    source_title = infer_source_title(filepath.name, first_page)
    language = detect_language(full_text)

    sections = _extract_sections(page_texts)

    return ParsedDocument(
        filename=filepath.name,
        source_title=source_title,
        total_pages=total_pages,
        sections=sections,
        raw_text=full_text,
        language=language,
    )


def _extract_sections(page_texts: list[tuple[int, str]]) -> list[ParsedSection]:
    """
    Extract section-bounded chunks from page texts.
    Uses regex patterns to detect section headers and split accordingly.
    """
    sections: list[ParsedSection] = []
    current_section: Optional[ParsedSection] = None
    paragraph_counter = 0

    for page_num, page_text in page_texts:
        lines = page_text.split("\n")

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # Check if this line is a section header
            matched_header = False
            for pattern in SECTION_PATTERNS:
                match = pattern.match(stripped)
                if match:
                    # Save previous section
                    if current_section and current_section.text.strip():
                        sections.append(current_section)

                    # Start new section
                    section_num = match.group(1).strip()
                    heading = match.group(2).strip() if match.lastindex >= 2 else ""

                    paragraph_counter += 1
                    current_section = ParsedSection(
                        section_number=section_num,
                        heading=heading,
                        text=stripped + "\n",
                        page_number=page_num,
                        paragraph_number=paragraph_counter,
                    )
                    matched_header = True
                    break

            if not matched_header:
                if current_section:
                    current_section.text += stripped + "\n"
                else:
                    # Content before first detected section — create intro section
                    paragraph_counter += 1
                    current_section = ParsedSection(
                        section_number=None,
                        heading="Preamble",
                        text=stripped + "\n",
                        page_number=page_num,
                        paragraph_number=paragraph_counter,
                    )

    # Save last section
    if current_section and current_section.text.strip():
        sections.append(current_section)

    # If no sections were detected via regex, split by paragraphs
    if len(sections) <= 1:
        logger.info("No section headers detected — falling back to paragraph splitting")
        sections = _split_by_paragraphs(page_texts)

    return sections


def _split_by_paragraphs(
    page_texts: list[tuple[int, str]], min_length: int = 100
) -> list[ParsedSection]:
    """Fallback: split text into paragraph-based chunks."""
    sections = []
    para_counter = 0

    for page_num, page_text in page_texts:
        paragraphs = re.split(r"\n\s*\n", page_text)
        for para in paragraphs:
            para = para.strip()
            if len(para) < min_length:
                # Merge short paragraphs with previous
                if sections:
                    sections[-1].text += "\n" + para
                continue

            para_counter += 1
            sections.append(ParsedSection(
                section_number=None,
                heading="",
                text=para,
                page_number=page_num,
                paragraph_number=para_counter,
            ))

    return sections


# ── CLI Entry Point ──────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m backend.ingestion.parser <path-to-pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    doc = parse_pdf(pdf_path)
    print(f"\n{'='*60}")
    print(f"File: {doc.filename}")
    print(f"Title: {doc.source_title}")
    print(f"Pages: {doc.total_pages}")
    print(f"Sections: {len(doc.sections)}")
    print(f"Language: {doc.language}")
    print(f"{'='*60}\n")

    for i, sec in enumerate(doc.sections[:10], 1):
        print(f"[Section {i}] {sec.section_number or 'N/A'} — {sec.heading}")
        print(f"  Page: {sec.page_number}, Para: {sec.paragraph_number}")
        print(f"  Text: {sec.text[:120].strip()}...")
        print()
