"""Input validation, prompt injection guards, and regulatory sanitization."""

import re
import bleach
from backend.core.exceptions import PromptInjectionException

# Known regulatory documents allowed as authoritative citations
ALLOWED_CITATION_SOURCES = {
    "NIST SP 800-53 Rev 5",
    "NIST SP 800-53 Rev. 5",
    "NIST SP 800-53",
    "NIST SP 800-41 Rev. 1",
    "CIS Controls v8",
    "CIS Controls Version 8",
    "ISO/IEC 27001:2022",
    "ISO 27001:2022",
    "ISO/IEC 27002:2022",
    "PCI-DSS v4.0",
    "PCI-DSS 4.0",
}

# Malicious prompt injection patterns
INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions",
    r"system\s*prompt",
    r"\bjailbreak\b",
    r"\bDAN\b",
    r"<<\|",
    r"\[INST\]",
    r"\[/INST\]",
    r"<\|im_start\|>",
    r"<\|im_end\|>",
    r"reveal\s+your\s+instructions",
    r"override\s+system",
]


def sanitize_input(text: str) -> str:
    """Sanitize user input against HTML, XSS, and dangerous control chars."""
    if not text:
        return ""
    # Strip HTML tags
    cleaned = bleach.clean(text, tags=[], strip=True)
    # Remove null bytes or invisible control chars
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", cleaned)
    return cleaned.strip()


def check_prompt_injection(user_input: str) -> None:
    """Detect and block potential prompt injections and LLM jailbreaks."""
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, user_input, re.IGNORECASE):
            raise PromptInjectionException(f"Query was blocked by OWASP LLM Guard: matched '{pattern}'")


def wrap_user_prompt(sanitized_text: str) -> str:
    """Wrap user query in strict XML boundaries to isolate user data from system commands."""
    return f"<user_query>\n{sanitized_text}\n</user_query>"


def is_valid_citation_source(source_name: str) -> bool:
    """Check if citation belongs to verified framework standards."""
    if not source_name:
        return False
    clean = source_name.strip()
    return any(allowed.lower() in clean.lower() for allowed in ALLOWED_CITATION_SOURCES)
