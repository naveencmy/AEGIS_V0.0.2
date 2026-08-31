"""
IP-SAKTI Sahayak — Citation-Native Prompt Template
Implements the strict IP-SAKTI persona with 6 mandatory rules for
source-cited Ayurveda IP and regulatory compliance answers.
"""

# ── System Prompt (IP-SAKTI Persona) ────────────────────────────

SYSTEM_PROMPT = """You are IP-SAKTI, an expert AI assistant on Ayurveda Intellectual Property and regulatory compliance.
You answer questions based ONLY on the provided regulatory documents.

RULES:
1. Every factual claim MUST cite the exact source: Document Title, Section/Clause, Page Number.
   Format citations inline as [Document Title, Section X, p.Y].
2. If the context does not contain the answer, say: "The provided regulatory corpus does not contain sufficient information to answer this question. Please consult a qualified IP attorney."
3. Do NOT hallucinate section numbers. If you cannot find the exact section, do not cite it.
4. For multilingual queries, detect the language and respond in the same language when possible.
5. Distinguish between national (Indian) and international (TRIPS/WIPO) regimes clearly.
   Prefix national references with [NATIONAL] and international with [INTERNATIONAL] when both apply.
6. For patentability questions, always check TKDL prior art implications.
7. Always end your response with: "Disclaimer: This answer is for informational purposes only and does not constitute legal advice."
"""


# ── User Prompt Template ────────────────────────────────────────

USER_PROMPT_TEMPLATE = """Context:
{context}

Question: {question}

Answer (with source citations for every claim):"""


def build_context_block(documents: list[dict]) -> str:
    """
    Format retrieved document chunks into labelled context blocks.
    Each block preserves: source title, section, page, authority, regime.
    """
    blocks = []
    for idx, doc in enumerate(documents, 1):
        meta = doc.get("metadata", {})
        source_title = meta.get("source_title", "Unknown Document")
        section = meta.get("section_number", "N/A")
        page = meta.get("page_number", "N/A")
        authority = meta.get("issuing_authority", "Unknown")
        regime = meta.get("regime", "national")
        content = doc.get("content", "").strip()

        block = (
            f"[SOURCE {idx}: {source_title} | Section: {section} | "
            f"Page: {page} | Authority: {authority} | Regime: {regime}]\n"
            f"{content}\n"
        )
        blocks.append(block)

    return "\n---\n".join(blocks)


def build_prompt(query: str, documents: list[dict]) -> tuple[str, str]:
    """
    Construct system + user prompts for the LLM.
    Returns (system_prompt, user_prompt).
    """
    context_text = build_context_block(documents)
    user_prompt = USER_PROMPT_TEMPLATE.format(
        context=context_text,
        question=query
    )
    return SYSTEM_PROMPT, user_prompt


def build_langchain_prompt_template():
    """
    Return a LangChain-compatible PromptTemplate for RetrievalQA.
    """
    from langchain.prompts import PromptTemplate

    combined_template = (
        SYSTEM_PROMPT + "\n\n" + USER_PROMPT_TEMPLATE
    )

    return PromptTemplate(
        template=combined_template,
        input_variables=["context", "question"]
    )
