"""
IP-SAKTI Sahayak — Pydantic Request/Response Schemas
Defines all API contracts for the /chat, /upload, /health, /sources, /citation endpoints.
"""

from datetime import datetime
from typing import Literal, Optional, Any
from pydantic import BaseModel, Field

RegimeType = Literal["national", "international", "traditional"]
SourceType = Literal[
    "Act", "Rules", "Guideline", "Circular",
    "InternationalAgreement", "TraditionalText"
]
CategoryType = Literal[
    "patentability", "gmp", "export", "labeling", "tkdl", "prior_art", "general"
]
LanguageType = Literal["auto", "en", "hi", "sa"]
ConfidenceLevel = Literal["high", "medium", "low"]


# ── Citation Models ──────────────────────────────────────────────

class CitationItem(BaseModel):
    source_title: str = Field(..., description="Document title e.g. 'Patents Act, 1970'")
    section: Optional[str] = Field(None, description="Section/clause ref e.g. '3(p)'")
    page: Optional[int] = Field(None, description="Page number in source PDF")
    authority: Optional[str] = Field(None, description="Issuing authority e.g. 'IP India'")
    regime: Optional[RegimeType] = Field(None, description="Legal regime")
    relevance_score: float = Field(0.0, description="Cosine similarity score")
    chunk_id: Optional[str] = Field(None, description="UUID of the source chunk")
    full_text: Optional[str] = Field(None, description="Raw extracted text from PDF")


# ── Chat Endpoint ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str = Field(
        ..., min_length=2, max_length=500,
        description="Natural language regulatory query"
    )
    regime_filter: Optional[list[RegimeType]] = Field(
        None,
        description="Filter by regime: national, international, traditional"
    )
    language: LanguageType = Field(
        "auto",
        description="Response language preference"
    )
    require_citations: bool = Field(
        True,
        description="Require source citations in response"
    )


class ChatResponse(BaseModel):
    query: str = Field(..., description="Original user query")
    answer: str = Field(..., description="RAG-generated answer with inline citations")
    citations: list[CitationItem] = Field(
        default_factory=list,
        description="Source citations for every factual claim"
    )
    regime_tags: list[RegimeType] = Field(
        default_factory=list,
        description="Legal regimes referenced in answer"
    )
    confidence: ConfidenceLevel = Field(
        "medium", description="Answer confidence level"
    )
    disclaimer: str = Field(
        "This answer is for informational purposes only and does not constitute legal advice.",
        description="Mandatory legal disclaimer"
    )
    language_detected: str = Field("en", description="Detected query language")
    processing_time_ms: float = Field(0.0, description="End-to-end latency in ms")
    mode: Optional[str] = Field(
        None,
        description="'guaranteed_response' if mock mode was used"
    )


# ── Upload Endpoint ──────────────────────────────────────────────

class UploadResponse(BaseModel):
    filename: str
    chunks_created: int = 0
    chunks_embedded: int = 0
    status: str = "success"
    message: str = ""
    source_title: Optional[str] = None
    processing_time_ms: float = 0.0


# ── Health Endpoint ──────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "healthy"
    app_name: str = "IP-SAKTI Sahayak"
    version: str = "0.1.0"
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z"
    )
    llm_loaded: bool = False
    llm_backend: str = "none"
    chroma_status: str = "unknown"
    doc_count: int = 0
    embedding_model: str = ""
    demo_mode: bool = False


# ── Sources Endpoint ─────────────────────────────────────────────

class SourceDocument(BaseModel):
    source_title: str
    source_type: Optional[str] = None
    issuing_authority: Optional[str] = None
    regime: Optional[str] = None
    chunk_count: int = 0
    categories: list[str] = Field(default_factory=list)


class SourcesResponse(BaseModel):
    total_documents: int = 0
    total_chunks: int = 0
    sources: list[SourceDocument] = Field(default_factory=list)


# ── Citation Detail Endpoint ─────────────────────────────────────

class CitationDetailResponse(BaseModel):
    chunk_id: str
    source_title: str
    section_number: Optional[str] = None
    clause_number: Optional[str] = None
    page_number: Optional[int] = None
    paragraph_number: Optional[int] = None
    text: str = ""
    language: str = "en"
    regime: Optional[str] = None
    category: Optional[str] = None
    issuing_authority: Optional[str] = None
    source_type: Optional[str] = None


# ── Document Chunk Schema (Internal) ─────────────────────────────

class DocumentChunk(BaseModel):
    """Matches §4.2 ingestion schema exactly."""
    chunk_id: str = Field(..., description="UUID for this chunk")
    source_title: str = Field(..., description="Document title")
    source_type: SourceType = Field("Guideline", description="Document category")
    issuing_authority: str = Field("", description="Authority name")
    section_number: Optional[str] = Field(None, description="Section ref e.g. '3(p)'")
    clause_number: Optional[str] = Field(None, description="Clause ref e.g. '3(p)(i)'")
    page_number: Optional[int] = Field(None, description="Page in source PDF")
    paragraph_number: Optional[int] = Field(None, description="Paragraph index")
    text: str = Field(..., description="Exact extracted text")
    language: str = Field("en", description="ISO language code")
    regime: RegimeType = Field("national", description="Legal regime")
    category: CategoryType = Field("general", description="Topic category")
