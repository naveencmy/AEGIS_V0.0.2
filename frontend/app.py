"""
IP-SAKTI Sahayak — Streamlit Frontend
Single-file Streamlit application with:
- Obsidian + Indigo dark theme
- Chat interface with citation cards
- Regime filters, language selector, PDF upload
- 5 demo scenario buttons
- Graceful error handling
"""

import os
import time
import json
import requests
import streamlit as st

# ── Configuration ────────────────────────────────────────────────

API_URL = os.getenv("API_URL", "http://localhost:8000")
APP_TITLE = "IP-SAKTI Sahayak"
APP_TAGLINE = "Every Ayurveda IP answer carries a legal receipt."
APP_ICON = "⚖️"

# ── Page Configuration ───────────────────────────────────────────

st.set_page_config(
    page_title=APP_TITLE,
    page_icon=APP_ICON,
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS — Obsidian + Indigo Theme ─────────────────────────

st.markdown("""
<style>
    /* ── Global Theme ── */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    .stApp {
        background: linear-gradient(135deg, #0A0E17 0%, #0F1629 50%, #0A0E17 100%);
        color: #F8FAFC;
        font-family: 'Inter', sans-serif;
    }

    /* ── Header Banner ── */
    .hero-banner {
        background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%);
        border: 1px solid rgba(99,102,241,0.2);
        border-radius: 16px;
        padding: 28px 32px;
        margin-bottom: 24px;
        text-align: center;
        backdrop-filter: blur(12px);
    }
    .hero-banner h1 {
        font-size: 2.2rem;
        font-weight: 700;
        background: linear-gradient(135deg, #6366F1, #8B5CF6, #A78BFA);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0 0 8px 0;
    }
    .hero-banner .tagline {
        color: #94A3B8;
        font-size: 1rem;
        font-weight: 400;
        letter-spacing: 0.5px;
    }

    /* ── Chat Messages ── */
    .stChatMessage {
        background-color: #111827 !important;
        border-radius: 12px !important;
        border-left: 3px solid #6366F1 !important;
        padding: 16px !important;
        margin: 8px 0 !important;
    }

    /* ── Citation Card ── */
    .citation-card {
        background: rgba(99,102,241,0.06);
        border: 1px solid rgba(99,102,241,0.25);
        border-radius: 10px;
        padding: 14px 18px;
        margin: 8px 0;
        transition: all 0.2s ease;
    }
    .citation-card:hover {
        border-color: rgba(99,102,241,0.5);
        background: rgba(99,102,241,0.1);
        transform: translateY(-1px);
    }
    .citation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    .citation-title {
        font-weight: 600;
        color: #E2E8F0;
        font-size: 0.95rem;
    }
    .citation-badge {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: #6366F1;
        background: rgba(99,102,241,0.12);
        padding: 3px 10px;
        border-radius: 20px;
        border: 1px solid rgba(99,102,241,0.3);
    }
    .citation-meta {
        font-size: 0.82rem;
        color: #94A3B8;
        line-height: 1.6;
    }
    .citation-meta strong {
        color: #CBD5E1;
    }

    /* ── Regime Badge ── */
    .regime-national {
        background: rgba(34,197,94,0.12);
        color: #4ADE80;
        border: 1px solid rgba(34,197,94,0.3);
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
    }
    .regime-international {
        background: rgba(59,130,246,0.12);
        color: #60A5FA;
        border: 1px solid rgba(59,130,246,0.3);
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
    }
    .regime-traditional {
        background: rgba(245,158,11,0.12);
        color: #FBBF24;
        border: 1px solid rgba(245,158,11,0.3);
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
    }

    /* ── Confidence Badge ── */
    .confidence-high {
        color: #4ADE80;
        font-weight: 600;
    }
    .confidence-medium {
        color: #FBBF24;
        font-weight: 600;
    }
    .confidence-low {
        color: #F87171;
        font-weight: 600;
    }

    /* ── Disclaimer ── */
    .disclaimer {
        font-size: 11px;
        color: #64748B;
        font-style: italic;
        margin-top: 16px;
        padding: 10px 14px;
        background: rgba(100,116,139,0.06);
        border-radius: 8px;
        border-left: 2px solid #475569;
    }

    /* ── Demo Buttons ── */
    .demo-btn-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 16px 0;
    }

    /* ── Stats Card ── */
    .stats-card {
        background: rgba(99,102,241,0.06);
        border: 1px solid rgba(99,102,241,0.15);
        border-radius: 10px;
        padding: 12px 16px;
        text-align: center;
    }
    .stats-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #6366F1;
    }
    .stats-label {
        font-size: 0.75rem;
        color: #94A3B8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* ── Sidebar ── */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0F1629 0%, #0A0E17 100%);
        border-right: 1px solid rgba(99,102,241,0.1);
    }
    [data-testid="stSidebar"] .stMarkdown h3 {
        color: #A78BFA;
    }

    /* ── Processing indicator ── */
    .processing-badge {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: #64748B;
        margin-top: 8px;
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #0A0E17; }
    ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #6366F1; }

    /* ── Source Panel ── */
    .source-item {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 8px;
        padding: 10px 14px;
        margin: 6px 0;
    }
    .source-item-title {
        font-weight: 500;
        color: #E2E8F0;
        font-size: 0.85rem;
    }
    .source-item-meta {
        font-size: 0.75rem;
        color: #64748B;
    }
</style>
""", unsafe_allow_html=True)


# ── Session State Initialization ─────────────────────────────────

if "messages" not in st.session_state:
    st.session_state.messages = []
if "sources_cache" not in st.session_state:
    st.session_state.sources_cache = None


# ── API Helper Functions ─────────────────────────────────────────

def api_chat(query: str, regime_filter: list[str], language: str = "auto") -> dict:
    """Send query to /chat endpoint."""
    try:
        payload = {
            "query": query,
            "language": language,
            "require_citations": True,
        }
        if regime_filter:
            payload["regime_filter"] = regime_filter

        resp = requests.post(
            f"{API_URL}/chat",
            json=payload,
            timeout=60,
        )
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": f"API returned status {resp.status_code}: {resp.text}"}
    except requests.ConnectionError:
        return {"error": "Cannot connect to IP-SAKTI API. Ensure the backend is running."}
    except requests.Timeout:
        return {"error": "API request timed out. The LLM may be processing a complex query."}
    except Exception as e:
        return {"error": f"API error: {str(e)}"}


def api_health() -> dict:
    """Check /health endpoint."""
    try:
        resp = requests.get(f"{API_URL}/health", timeout=5)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return {"status": "offline", "doc_count": 0, "llm_loaded": False}


def api_sources() -> dict:
    """Get /sources endpoint."""
    try:
        resp = requests.get(f"{API_URL}/sources", timeout=10)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return {"total_documents": 0, "total_chunks": 0, "sources": []}


def api_upload(file) -> dict:
    """Upload PDF via /upload endpoint."""
    try:
        files = {"file": (file.name, file.getvalue(), "application/pdf")}
        resp = requests.post(f"{API_URL}/upload", files=files, timeout=120)
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": f"Upload failed: {resp.text}"}
    except Exception as e:
        return {"error": f"Upload error: {str(e)}"}


def api_citation(chunk_id: str) -> dict:
    """Get full citation text via /citation/{chunk_id}."""
    try:
        resp = requests.get(f"{API_URL}/citation/{chunk_id}", timeout=10)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None


# ── Render Helpers ───────────────────────────────────────────────

def render_regime_badge(regime: str) -> str:
    """Generate HTML for a regime badge."""
    css_class = f"regime-{regime}" if regime in ("national", "international", "traditional") else "regime-national"
    label = regime.upper() if regime else "NATIONAL"
    return f'<span class="{css_class}">{label}</span>'


def render_citation_cards(citations: list[dict]):
    """Render citation cards below the response."""
    if not citations:
        return

    st.markdown("#### 📋 Source Citations")

    for idx, cit in enumerate(citations, 1):
        source_title = cit.get("source_title", "Unknown")
        section = cit.get("section", "N/A")
        page = cit.get("page", "N/A")
        authority = cit.get("authority", "")
        regime = cit.get("regime", "national")
        score = cit.get("relevance_score", 0.0)
        chunk_id = cit.get("chunk_id", "")
        full_text = cit.get("full_text", "")

        regime_html = render_regime_badge(regime)
        score_pct = f"{score * 100:.0f}%"

        st.markdown(f"""
        <div class="citation-card">
            <div class="citation-header">
                <span class="citation-title">📄 {source_title}</span>
                <span class="citation-badge">Score: {score_pct}</span>
            </div>
            <div class="citation-meta">
                <strong>Section:</strong> {section} &nbsp;|&nbsp;
                <strong>Page:</strong> {page} &nbsp;|&nbsp;
                <strong>Authority:</strong> {authority} &nbsp;|&nbsp;
                {regime_html}
            </div>
        </div>
        """, unsafe_allow_html=True)

        # View Full Text expander
        if full_text:
            with st.expander(f"📖 View Source Text — {source_title}, Section {section}", expanded=False):
                st.code(full_text, language=None)
                if chunk_id:
                    st.caption(f"Chunk ID: `{chunk_id}`")


def render_response_metadata(response: dict):
    """Render processing metadata below response."""
    cols = st.columns(4)

    with cols[0]:
        confidence = response.get("confidence", "medium")
        css_class = f"confidence-{confidence}"
        st.markdown(f'**Confidence:** <span class="{css_class}">{confidence.upper()}</span>', unsafe_allow_html=True)

    with cols[1]:
        time_ms = response.get("processing_time_ms", 0)
        st.markdown(f"**Latency:** `{time_ms:.0f}ms`")

    with cols[2]:
        lang = response.get("language_detected", "en")
        lang_labels = {"en": "English", "hi": "Hindi", "sa": "Sanskrit"}
        st.markdown(f"**Language:** {lang_labels.get(lang, lang)}")

    with cols[3]:
        mode = response.get("mode")
        if mode == "guaranteed_response":
            st.markdown("**Mode:** `Demo`")
        else:
            st.markdown("**Mode:** `Live RAG`")

    # Regime tags
    regime_tags = response.get("regime_tags", [])
    if regime_tags:
        tags_html = " ".join(render_regime_badge(r) for r in regime_tags)
        st.markdown(f"**Regimes:** {tags_html}", unsafe_allow_html=True)


# ── Sidebar ──────────────────────────────────────────────────────

with st.sidebar:
    # Logo and branding
    st.markdown("""
    <div style="text-align: center; padding: 16px 0;">
        <div style="font-size: 3rem;">⚖️</div>
        <h2 style="
            background: linear-gradient(135deg, #6366F1, #A78BFA);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 8px 0 4px 0;
            font-size: 1.5rem;
        ">IP-SAKTI Sahayak</h2>
        <p style="color: #94A3B8; font-size: 0.8rem; margin: 0;">
            Every answer carries a legal receipt
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    # ── System Status ────────────────────────────────────────────
    st.markdown("### 🔌 System Status")
    health = api_health()

    if health.get("status") == "healthy":
        st.success("API Online", icon="✅")
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Documents", health.get("doc_count", 0))
        with col2:
            llm_backend = health.get("llm_backend", "none")
            if health.get("llm_loaded"):
                st.metric("LLM", llm_backend.upper())
            else:
                st.metric("LLM", "DEMO")
    else:
        st.error("API Offline", icon="❌")
        st.caption("Start backend: `uvicorn backend.main:app`")

    st.divider()

    # ── Regime Filter ────────────────────────────────────────────
    st.markdown("### 🏛️ Regime Filter")
    filter_national = st.checkbox("☑ National (Indian)", value=True, key="filter_national")
    filter_international = st.checkbox("☑ International (TRIPS/WIPO)", value=True, key="filter_intl")
    filter_traditional = st.checkbox("☑ Traditional Texts", value=True, key="filter_trad")

    regime_filter = []
    if filter_national:
        regime_filter.append("national")
    if filter_international:
        regime_filter.append("international")
    if filter_traditional:
        regime_filter.append("traditional")

    # ── Language Selector ────────────────────────────────────────
    st.markdown("### 🌐 Language")
    language = st.selectbox(
        "Response Language",
        options=["auto", "en", "hi", "sa"],
        format_func=lambda x: {
            "auto": "🔄 Auto-detect",
            "en": "🇬🇧 English",
            "hi": "🇮🇳 Hindi (हिन्दी)",
            "sa": "📜 Sanskrit (संस्कृत)",
        }.get(x, x),
        index=0,
        key="language_select",
    )

    st.divider()

    # ── Document Upload ──────────────────────────────────────────
    st.markdown("### 📤 Upload Regulatory PDF")
    uploaded_file = st.file_uploader(
        "Drag and drop a PDF",
        type=["pdf"],
        help="Upload a regulatory PDF for ingestion. It will be parsed, chunked, and embedded into the knowledge base.",
        key="pdf_upload",
    )

    if uploaded_file:
        if st.button("🔄 Ingest Document", key="ingest_btn", use_container_width=True):
            with st.spinner(f"Ingesting {uploaded_file.name}..."):
                result = api_upload(uploaded_file)
                if "error" in result:
                    st.error(result["error"])
                else:
                    st.success(
                        f"✅ Ingested: {result.get('chunks_created', 0)} chunks "
                        f"({result.get('processing_time_ms', 0):.0f}ms)"
                    )
                    st.session_state.sources_cache = None  # Refresh

    st.divider()

    # ── Sources Panel ────────────────────────────────────────────
    st.markdown("### 📚 Ingested Sources")

    if st.session_state.sources_cache is None:
        st.session_state.sources_cache = api_sources()

    sources_data = st.session_state.sources_cache
    total_docs = sources_data.get("total_documents", 0)
    total_chunks = sources_data.get("total_chunks", 0)

    if total_docs > 0:
        st.caption(f"{total_docs} documents • {total_chunks} chunks")
        for src in sources_data.get("sources", []):
            with st.expander(f"📄 {src.get('source_title', 'Unknown')}", expanded=False):
                st.markdown(f"""
                - **Type:** {src.get('source_type', 'N/A')}
                - **Authority:** {src.get('issuing_authority', 'N/A')}
                - **Regime:** {src.get('regime', 'N/A')}
                - **Chunks:** {src.get('chunk_count', 0)}
                """)
    else:
        st.caption("No documents ingested yet.")
        st.info(
            "Upload PDFs above or run:\n"
            "`python -m backend.ingestion.embedder --input-dir data/sample_regulatory/`"
        )

    # ── Refresh Button ───────────────────────────────────────────
    if st.button("🔄 Refresh Sources", key="refresh_sources", use_container_width=True):
        st.session_state.sources_cache = None
        st.rerun()


# ── Main Panel ───────────────────────────────────────────────────

# Hero Banner
st.markdown("""
<div class="hero-banner">
    <h1>⚖️ IP-SAKTI Sahayak</h1>
    <div class="tagline">
        Sovereign AI for Ayurveda Intellectual Property & Regulatory Compliance
    </div>
</div>
""", unsafe_allow_html=True)


# ── Demo Scenario Buttons ───────────────────────────────────────

st.markdown("##### 🎯 Quick Demo Scenarios")

demo_queries = [
    "Can I patent a traditional Ayurvedic formulation?",
    "What are GMP requirements for AYUSH manufacturing units?",
    "How do I register an Ayurvedic drug for export to the EU?",
    "What is TKDL and how does it affect patentability?",
    "Explain Section 3(d) of Patents Act with examples.",
]

demo_cols = st.columns(len(demo_queries))
for idx, (col, demo_q) in enumerate(zip(demo_cols, demo_queries)):
    with col:
        short_label = demo_q[:35] + ("..." if len(demo_q) > 35 else "")
        if st.button(
            short_label,
            key=f"demo_{idx}",
            use_container_width=True,
            help=demo_q,
        ):
            st.session_state.messages.append({"role": "user", "content": demo_q})
            st.session_state["pending_query"] = demo_q

st.divider()

# ── Chat History ─────────────────────────────────────────────────

for msg in st.session_state.messages:
    role = msg["role"]
    content = msg["content"]

    with st.chat_message(role, avatar="👤" if role == "user" else "⚖️"):
        st.markdown(content)

        # Render citations and metadata for assistant messages
        if role == "assistant" and "response_data" in msg:
            resp = msg["response_data"]
            render_response_metadata(resp)
            render_citation_cards(resp.get("citations", []))

            # Disclaimer
            disclaimer = resp.get("disclaimer", "")
            if disclaimer:
                st.markdown(
                    f'<div class="disclaimer">⚠️ {disclaimer}</div>',
                    unsafe_allow_html=True,
                )

# ── Chat Input ───────────────────────────────────────────────────

user_input = st.chat_input(
    "Ask about Ayurveda IP, patents, GMP, TKDL, export regulations...",
    key="chat_input",
)

# Handle pending query from demo button
pending = st.session_state.pop("pending_query", None)
query = user_input or pending

if query:
    # Add user message if not already added (demo buttons add it above)
    if not pending:
        st.session_state.messages.append({"role": "user", "content": query})

    # Display user message
    with st.chat_message("user", avatar="👤"):
        st.markdown(query)

    # Get response
    with st.chat_message("assistant", avatar="⚖️"):
        with st.spinner("🔍 Searching regulatory corpus..."):
            response = api_chat(query, regime_filter, language)

        if "error" in response:
            st.error(f"❌ {response['error']}")
            answer = response["error"]
            st.session_state.messages.append({
                "role": "assistant",
                "content": answer,
            })
        else:
            answer = response.get("answer", "No answer available.")
            st.markdown(answer)

            # Metadata
            render_response_metadata(response)

            # Citation cards
            render_citation_cards(response.get("citations", []))

            # Disclaimer
            disclaimer = response.get("disclaimer", "")
            if disclaimer:
                st.markdown(
                    f'<div class="disclaimer">⚠️ {disclaimer}</div>',
                    unsafe_allow_html=True,
                )

            # Store response data with message
            st.session_state.messages.append({
                "role": "assistant",
                "content": answer,
                "response_data": response,
            })

    st.rerun()


# ── Footer ───────────────────────────────────────────────────────

st.markdown("---")
st.markdown("""
<div style="text-align: center; padding: 16px 0;">
    <p style="color: #475569; font-size: 0.75rem;">
        IP-SAKTI Sahayak v0.1 • Sovereign • On-Premise • Zero External API Calls<br/>
        Built for SIH 2026 — Ministry of Ayush Problem Statement (SIH26045)<br/>
        <em>This system does not constitute legal advice. Always consult a qualified IP attorney.</em>
    </p>
</div>
""", unsafe_allow_html=True)
