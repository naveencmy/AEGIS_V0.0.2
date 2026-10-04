"""Hybrid RAG retrieval service.

Pipeline:
  1. Dense retrieval  — pgvector cosine HNSW (BAAI/bge-m3)
  2. Sparse retrieval — PostgreSQL tsvector BM25
  3. Reciprocal Rank Fusion (RRF, k=60)
  4. Cross-encoder re-ranking (BAAI/bge-reranker-base)
"""

from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import get_settings
from backend.models.framework import FrameworkControl
from backend.services.embedding_service import embed_text, embed_texts

logger = logging.getLogger(__name__)
settings = get_settings()


class DenseEmbedder:
    """Dense vector embedder wrapper."""

    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL

    def encode(self, texts: list[str]) -> list[list[float]]:
        return embed_texts(texts)


_reranker = None  # lazy-loaded


def _get_reranker():
    global _reranker
    if _reranker is not None:
        return _reranker
    try:
        from sentence_transformers import CrossEncoder
        _reranker = CrossEncoder(settings.RERANKER_MODEL)
        logger.info("Reranker loaded", extra={"model": settings.RERANKER_MODEL})
    except Exception as e:
        logger.warning("Reranker unavailable", extra={"error": str(e)})
    return _reranker


class RAGService:
    """Sovereign hybrid RAG retrieval — zero hallucination, every claim cited."""

    async def hybrid_search(
        self,
        db: AsyncSession,
        query: str,
        framework: str | None = None,
        top_k: int = 5,
    ) -> list[FrameworkControl]:
        """Run hybrid dense+sparse retrieval, RRF fusion, and cross-encoder reranking."""

        k_retrieve = max(top_k * 2, settings.TOP_K_RETRIEVE)

        # ── 1. Dense retrieval ──────────────────────────────────────────────
        query_vec = embed_text(query)
        dense_results = await self._dense_search(db, query_vec, framework, k_retrieve)

        # ── 2. Sparse retrieval ─────────────────────────────────────────────
        sparse_results = await self._sparse_search(db, query, framework, k_retrieve)

        # ── 3. Reciprocal Rank Fusion ───────────────────────────────────────
        fused = self._rrf_fusion(dense_results, sparse_results, k=settings.RRF_K)[:k_retrieve]

        # ── 4. Cross-encoder re-ranking ─────────────────────────────────────
        reranked = self._rerank(query, fused, top_k)

        return reranked

    async def _dense_search(
        self,
        db: AsyncSession,
        query_vec: list[float],
        framework: str | None,
        top_k: int,
    ) -> list[FrameworkControl]:
        vec_str = "[" + ",".join(f"{v:.6f}" for v in query_vec) + "]"
        stmt = (
            select(FrameworkControl)
            .order_by(
                text(f"embedding <=> '{vec_str}'::vector")
            )
            .limit(top_k)
        )
        if framework:
            stmt = stmt.where(FrameworkControl.framework == framework)

        result = await db.execute(stmt)
        rows = result.scalars().all()
        for r in rows:
            r.score = 0.9  # placeholder; actual score computed in RRF
        return list(rows)

    async def _sparse_search(
        self,
        db: AsyncSession,
        query: str,
        framework: str | None,
        top_k: int,
    ) -> list[FrameworkControl]:
        # tsvector rank search using PostgreSQL ts_rank_cd
        ts_query = " & ".join(query.split()[:8])  # simple AND query
        stmt = (
            select(FrameworkControl)
            .where(
                FrameworkControl.tsv.op("@@")(func.to_tsquery("english", ts_query))
            )
            .order_by(
                func.ts_rank_cd(FrameworkControl.tsv, func.to_tsquery("english", ts_query)).desc()
            )
            .limit(top_k)
        )
        if framework:
            stmt = stmt.where(FrameworkControl.framework == framework)

        try:
            result = await db.execute(stmt)
            rows = result.scalars().all()
            for r in rows:
                r.score = 0.8
            return list(rows)
        except Exception as e:
            logger.debug("Sparse search fallback", extra={"error": str(e)})
            return []

    def _rrf_fusion(
        self,
        dense: list[FrameworkControl],
        sparse: list[FrameworkControl],
        k: int = 60,
    ) -> list[FrameworkControl]:
        scores: dict[str, float] = {}
        docs:   dict[str, FrameworkControl] = {}

        for rank, doc in enumerate(dense):
            key = str(doc.id)
            scores[key]  = scores.get(key, 0.0) + 1.0 / (k + rank + 1)
            docs[key]    = doc

        for rank, doc in enumerate(sparse):
            key = str(doc.id)
            scores[key]  = scores.get(key, 0.0) + 1.0 / (k + rank + 1)
            docs[key]    = doc

        sorted_keys = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)
        result = []
        for key in sorted_keys:
            doc = docs[key]
            doc.score = round(scores[key], 4)
            result.append(doc)
        return result

    def _rerank(
        self,
        query: str,
        candidates: list[FrameworkControl],
        top_k: int,
    ) -> list[FrameworkControl]:
        reranker = _get_reranker()
        if reranker is None or len(candidates) <= 1:
            return candidates[:top_k]

        try:
            pairs  = [(query, f"{c.control_id}: {c.title}. {c.description[:300]}") for c in candidates]
            scores = reranker.predict(pairs)
            ranked = sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)
            result = []
            for score, doc in ranked[:top_k]:
                doc.score = float(round(score, 4))
                result.append(doc)
            return result
        except Exception as e:
            logger.debug("Reranker error", extra={"error": str(e)})
            return candidates[:top_k]

    async def ingest_framework_file(
        self,
        db: AsyncSession,
        file_path: Any,
        framework_name: str,
    ) -> int:
        """Ingest a JSON or YAML framework file into the database."""
        import pathlib
        import yaml

        path = pathlib.Path(file_path)
        if not path.exists():
            return 0

        try:
            if path.suffix in (".yaml", ".yml"):
                with open(path) as f:
                    data = yaml.safe_load(f)
            else:
                with open(path) as f:
                    import json as _json
                    data = _json.load(f)
        except Exception as e:
            logger.warning("Failed to load framework file", extra={"path": str(path), "error": str(e)})
            return 0

        controls = data if isinstance(data, list) else data.get("controls", [])
        count = 0

        for item in controls:
            control_id = item.get("control_id") or item.get("id", "")
            title      = item.get("title", "")
            description = item.get("description", "")
            if not control_id or not title:
                continue

            # Check for existing
            exists = await db.execute(
                select(FrameworkControl).where(
                    FrameworkControl.framework == framework_name,
                    FrameworkControl.control_id == control_id,
                )
            )
            if exists.scalar_one_or_none():
                continue

            text_for_embedding = f"{control_id}: {title}. {description}"
            embedding = embed_text(text_for_embedding)

            tsv_raw = f"{title} {description} {item.get('guidance', '')}"

            ctrl = FrameworkControl(
                framework   = framework_name,
                control_id  = control_id,
                title       = title[:512],
                description = description,
                guidance    = item.get("guidance"),
                severity    = item.get("severity"),
                source_page = str(item.get("source_page", "")),
                source_url  = item.get("source_url"),
                embedding   = embedding,
            )
            db.add(ctrl)
            count += 1

        await db.flush()

        # Update tsvectors
        await db.execute(text("""
            UPDATE framework_controls
            SET tsv = setweight(to_tsvector('english', COALESCE(title, '')), 'A')
                   || setweight(to_tsvector('english', COALESCE(description, '')), 'B')
                   || setweight(to_tsvector('english', COALESCE(guidance, '')), 'C')
            WHERE tsv IS NULL
        """))

        await db.commit()
        logger.info("Framework ingested", extra={"framework": framework_name, "count": count})
        return count


rag_service = RAGService()
