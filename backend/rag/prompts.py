"""
AEGIS-NTRO — Sovereign Network Security Compliance Prompt Templates.
Citation-native prompt engineering enforcing grounded regulatory reasoning
against NIST SP 800-53 Rev 5, CIS Controls v8, ISO/IEC 27001, and PCI-DSS v4.0.
"""

# ── System Prompt (AEGIS Persona) ──────────────────────────────────

SYSTEM_PROMPT = """You are AEGIS-NTRO, a sovereign AI network security compliance auditor.
You answer questions based ONLY on the provided regulatory controls and network security standards.

RULES:
1. Every factual compliance assertion MUST cite the exact source: Standard/Publication Title, Control ID, Section/Page Number.
   Format citations inline as [Publication Title, Control ID, p.Page].
2. If the context does not contain sufficient information, say: "Insufficient regulatory context available in the current knowledge base."
3. Zero-Hallucination: Do NOT fabricate control IDs, clauses, or vendor parameters.
4. Distinguish clearly between regulatory mandates across NIST SP 800-53 Rev 5, CIS Controls v8, ISO 27001, and PCI-DSS v4.0.
5. Provide actionable, vendor-accurate hardening and remediation steps for network appliances (Cisco, Palo Alto, Fortinet, Juniper).
6. Always end with: "Audit Reference: Sovereign AEGIS-NTRO Verification Engine."
"""


# ── User Prompt Template ──────────────────────────────────────────

USER_PROMPT_TEMPLATE = """REGULATORY CONTROLS CONTEXT:
{context}

USER QUERY:
{question}

COMPLIANCE AUDIT SYNTHESIS (with explicit control citations for every statement):"""


def build_context_block(documents: list[dict]) -> str:
    """Format retrieved regulatory control chunks into labelled context blocks."""
    blocks = []
    for idx, doc in enumerate(documents, 1):
        meta = doc.get("metadata", {})
        source_title = meta.get("source_title", meta.get("framework", "Security Standard"))
        control_id = meta.get("control_id", meta.get("section_number", "N/A"))
        page = meta.get("page_number", meta.get("source_page", "N/A"))
        authority = meta.get("issuing_authority", meta.get("authority", "Standards Body"))
        content = doc.get("content", doc.get("description", "")).strip()

        block = (
            f"[CONTROL {idx}: {source_title} | ID: {control_id} | "
            f"Page: {page} | Authority: {authority}]\n"
            f"{content}\n"
        )
        blocks.append(block)

    return "\n---\n".join(blocks)


def build_prompt(query: str, documents: list[dict]) -> tuple[str, str]:
    """Construct system + user prompts for the LLM."""
    context_text = build_context_block(documents)
    user_prompt = USER_PROMPT_TEMPLATE.format(
        context=context_text,
        question=query
    )
    return SYSTEM_PROMPT, user_prompt


def build_langchain_prompt_template():
    """Return a LangChain-compatible PromptTemplate for RetrievalQA."""
    try:
        try:
            from langchain_core.prompts import PromptTemplate  # type: ignore[import-not-found, import-untyped]
        except ImportError:
            from langchain.prompts import PromptTemplate  # type: ignore[import-not-found, import-untyped]

        combined_template = SYSTEM_PROMPT + "\n\n" + USER_PROMPT_TEMPLATE
        return PromptTemplate(
            template=combined_template,
            input_variables=["context", "question"]
        )
    except ImportError:
        return None
