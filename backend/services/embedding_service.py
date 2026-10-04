"""Embedding service — BAAI/bge-m3 (1024-dim) with mock fallback."""

from __future__ import annotations

import hashlib
import logging
import random

from backend.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_model = None  # lazy-loaded


def _get_model():
    global _model
    if _model is not None:
        return _model
    if settings.MOCK_EMBEDDINGS:
        return None
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info("Embedding model loaded", extra={"model": settings.EMBEDDING_MODEL})
    except Exception as e:
        logger.warning("Embedding model unavailable — using mock", extra={"error": str(e)})
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts; fall back to deterministic mock vectors if model unavailable."""
    model = _get_model()
    if model is not None:
        vecs = model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)
        return vecs.tolist()
    # Deterministic mock: hash-based pseudo-vector
    return [_mock_vector(t) for t in texts]


def embed_text(text: str) -> list[float]:
    return embed_texts([text])[0]


def _mock_vector(text: str) -> list[float]:
    """Deterministic 1024-dim mock vector based on text hash."""
    seed = int(hashlib.md5(text.encode()).hexdigest(), 16) % (2 ** 31)
    rng  = random.Random(seed)
    raw  = [rng.gauss(0, 1) for _ in range(settings.EMBEDDING_DIM)]
    norm = (sum(x * x for x in raw) ** 0.5) or 1.0
    return [x / norm for x in raw]
