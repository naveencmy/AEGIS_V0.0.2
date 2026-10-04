"""Input sanitization and prompt injection guards."""

from __future__ import annotations

import re
from backend.core.exceptions import PromptInjectionException

# Supported authentic framework publications
VALID_CITATION_SOURCES = {
    "NIST SP 800-53 Rev 5",
    "NIST SP 800-53",
    "CIS Controls v8",
    "CIS Controls",
    "ISO/IEC 27001:2022",
    "ISO 27001",
    "ISO/IEC 27001",
    "PCI-DSS v4.0",
    "PCI-DSS",
    "PCI DSS",
}

# OWASP LLM Top 10 — Prompt Injection Patterns
_INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:previous|above|prior|earlier)\s+instructions",
    r"you\s+are\s+(?:now\s+)?(?:a|an|dan)\s+(?:evil|jailbreak|dan|unrestricted)",
    r"you\s+are\s+now\s+dan",
    r"do\s+anything\s+now",
    r"jailbreak",
    r"bypass\s+(?:all\s+)?(?:safety|restrictions|filters|guidelines|controls)",
    r"act\s+as\s+(?:a|an)\s+unrestricted",
    r"disregard\s+(?:all\s+)?(?:rules|guidelines|instructions|restrictions)",
    r"forget\s+(?:all\s+)?(?:your\s+)?(?:training|instructions|guidelines)",
    r"<\s*script\s*>",
    r"system\s*prompt\s*:",
]

_COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE | re.DOTALL) for p in _INJECTION_PATTERNS]


def sanitize_input(text: str) -> str:
    """Sanitize input — strip HTML tags, null bytes, excessive whitespace, control chars."""
    if not text:
        return ""
    text = text.replace("\x00", "").replace("\r", " ")
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"\s{3,}", "  ", text)
    return text.strip()[:4096]


def check_prompt_injection(text: str) -> None:
    """Raise PromptInjectionException if prompt injection pattern detected."""
    for pattern in _COMPILED_PATTERNS:
        if pattern.search(text):
            raise PromptInjectionException("Query rejected: potential prompt injection detected")


def is_valid_citation_source(source: str | None) -> bool:
    """Check if the citation source matches recognized sovereign compliance standards."""
    if not source:
        return False
    source_clean = source.strip()
    return any(valid.lower() in source_clean.lower() for valid in VALID_CITATION_SOURCES)


def wrap_user_prompt(prompt: str) -> str:
    """Wrap user query in strict delimiter tags to mitigate indirect prompt injection."""
    return f"<user_query>\n{prompt}\n</user_query>"

