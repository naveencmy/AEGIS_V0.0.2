"""RAG Hybrid Retrieval Engine using PostgreSQL + pgvector + tsvector + RRF + Cross-Encoder."""

import json
from pathlib import Path
from typing import Any
import yaml
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import get_settings
from backend.core.logging import logger
from backend.models.framework import FrameworkControl
from backend.schemas.framework import SearchResult

settings = get_settings()


class DenseEmbedder:
    """Singleton wrapper for sentence-transformers embedding model."""

    def __init__(self, model_name: str = "BAAI/bge-m3") -> None:
        self.model_name = model_name
        self._model = None

    def _get_model(self):
        if self._model is None:
            if settings.MOCK_LLM or settings.APP_ENV == "testing":
                self._model = "fallback"
                return self._model
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.model_name)
            except Exception as e:
                logger.warn("Could not load sentence-transformers model directly, using deterministic fallback", error=str(e))
                self._model = "fallback"
        return self._model

    def encode(self, texts: list[str]) -> list[list[float]]:
        model = self._get_model()
        if model != "fallback" and model is not None:
            try:
                embeddings = model.encode(texts, normalize_embeddings=True)
                return [emb.tolist() for emb in embeddings]
            except Exception as e:
                logger.error("Embedding generation failed, reverting to deterministic hash vector", error=str(e))

        # Deterministic 1024-dim fallback vector for testing/offline environments
        vectors = []
        dim = settings.EMBEDDING_DIMENSION
        for t in texts:
            np.random.seed(abs(hash(t)) % (2**32))
            v = np.random.randn(dim).astype(np.float32)
            norm = np.linalg.norm(v)
            if norm > 0:
                v = v / norm
            vectors.append(v.tolist())
        return vectors


class CrossEncoderReranker:
    """Wrapper for cross-encoder reranking."""

    def __init__(self, model_name: str = "BAAI/bge-reranker-base") -> None:
        self.model_name = model_name
        self._model = None

    def _get_model(self):
        if self._model is None:
            if settings.MOCK_LLM or settings.APP_ENV == "testing":
                self._model = "fallback"
                return self._model
            try:
                from sentence_transformers import CrossEncoder
                self._model = CrossEncoder(self.model_name)
            except Exception as e:
                logger.warn("Could not load cross-encoder model directly, using rank score fallback", error=str(e))
                self._model = "fallback"
        return self._model

    def rerank(self, query: str, results: list[SearchResult], top_k: int = 5) -> list[SearchResult]:
        if not results:
            return []
        model = self._get_model()
        if model != "fallback" and model is not None:
            try:
                pairs = [[query, f"{r.title}. {r.description}"] for r in results]
                scores = model.predict(pairs)
                scored_results = []
                for res, sc in zip(results, scores):
                    res.score = float(sc)
                    scored_results.append(res)
                scored_results.sort(key=lambda x: x.score, reverse=True)
                return scored_results[:top_k]
            except Exception as e:
                logger.error("Cross-encoder inference failed", error=str(e))

        # Sort by existing RRF score
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]


class RAGService:
    """Sovereign Hybrid RAG Engine operating exclusively on PostgreSQL 16."""

    def __init__(self) -> None:
        self.embedder = DenseEmbedder(settings.EMBEDDING_MODEL)
        self.reranker = CrossEncoderReranker(settings.RERANKER_MODEL)

    async def hybrid_search(
        self,
        db: AsyncSession,
        query: str,
        framework: str | None = None,
        top_k: int = 5,
    ) -> list[SearchResult]:
        """Execute hybrid search combining pgvector cosine similarity and tsvector BM25 with RRF."""
        logger.info("Executing hybrid compliance search", query=query[:60], framework=framework)

        # 1. Generate query vector
        query_vector = self.embedder.encode([query])[0]
        query_vector_str = f"[{','.join(str(x) for x in query_vector)}]"

        # 2. Dense Vector Search (pgvector)
        framework_clause = "AND framework = :framework" if framework else ""
        
        dense_sql = text(f"""
            SELECT id, framework, control_id, title, description, guidance, source_url, source_page,
                   (1 - (embedding <=> (:query_vector)::vector)) AS sim_score
            FROM framework_controls
            WHERE embedding IS NOT NULL {framework_clause}
            ORDER BY embedding <=> (:query_vector)::vector ASC
            LIMIT 30
        """)
        
        params: dict[str, Any] = {"query_vector": query_vector_str}
        if framework:
            params["framework"] = framework

        try:
            dense_res = await db.execute(dense_sql, params)
            dense_rows = dense_res.fetchall()
        except Exception as e:
            logger.warn("Dense search fallback or vector extension warning", error=str(e))
            dense_rows = []

        # 3. Sparse Full-Text Search (tsvector)
        sparse_sql = text(f"""
            SELECT id, framework, control_id, title, description, guidance, source_url, source_page,
                   ts_rank_cd(tsv, plainto_tsquery('english', :text_query)) AS text_rank
            FROM framework_controls
            WHERE tsv @@ plainto_tsquery('english', :text_query) {framework_clause}
            ORDER BY text_rank DESC
            LIMIT 30
        """)
        
        sparse_params: dict[str, Any] = {"text_query": query}
        if framework:
            sparse_params["framework"] = framework

        try:
            sparse_res = await db.execute(sparse_sql, sparse_params)
            sparse_rows = sparse_res.fetchall()
        except Exception as e:
            logger.warn("Sparse search fallback", error=str(e))
            sparse_rows = []

        # Fallback if both empty (e.g. initial setup without embeddings / plain LIKE search)
        if not dense_rows and not sparse_rows:
            fallback_sql = text(f"""
                SELECT id, framework, control_id, title, description, guidance, source_url, source_page, 0.5 as score
                FROM framework_controls
                WHERE 1=1 {framework_clause}
                ORDER BY created_at DESC
                LIMIT 10
            """)
            fb_res = await db.execute(fallback_sql, {"framework": framework} if framework else {})
            fallback_rows = fb_res.fetchall()
            return [
                SearchResult(
                    control_id=r.control_id,
                    framework=r.framework,
                    title=r.title,
                    description=r.description,
                    guidance=r.guidance,
                    source_url=r.source_url,
                    source_page=r.source_page,
                    score=0.5,
                )
                for r in fallback_rows[:top_k]
            ]

        # 4. Reciprocal Rank Fusion (RRF)
        # RRF Score = sum(1.0 / (k + rank)) for k=60
        k = settings.RAG_RRF_K
        rrf_scores: dict[str, float] = {}
        row_map: dict[str, Any] = {}

        for rank, row in enumerate(dense_rows):
            cid = f"{row.framework}:{row.control_id}"
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (k + rank + 1))
            row_map[cid] = row

        for rank, row in enumerate(sparse_rows):
            cid = f"{row.framework}:{row.control_id}"
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (k + rank + 1))
            row_map[cid] = row

        # Assemble fused candidates
        fused_candidates: list[SearchResult] = []
        for cid, score in rrf_scores.items():
            row = row_map[cid]
            fused_candidates.append(
                SearchResult(
                    control_id=row.control_id,
                    framework=row.framework,
                    title=row.title,
                    description=row.description,
                    guidance=row.guidance,
                    source_url=row.source_url,
                    source_page=row.source_page,
                    score=score,
                )
            )

        fused_candidates.sort(key=lambda x: x.score, reverse=True)
        top_candidates = fused_candidates[:15]

        # 5. Cross-Encoder Re-Ranking
        reranked = self.reranker.rerank(query, top_candidates, top_k=top_k)
        return reranked

    async def ingest_framework_file(
        self,
        db: AsyncSession,
        file_path: Path,
        framework_name: str,
    ) -> int:
        """Ingest framework controls from JSON or YAML file into PostgreSQL."""
        if not file_path.exists():
            logger.warn("Framework file does not exist", path=str(file_path))
            return 0

        raw_text = file_path.read_text(encoding="utf-8")
        controls_data = []

        if file_path.suffix in [".yaml", ".yml"]:
            data = yaml.safe_load(raw_text)
            if isinstance(data, dict) and "controls" in data:
                controls_data = data["controls"]
            elif isinstance(data, list):
                controls_data = data
        else:
            data = json.loads(raw_text)
            if isinstance(data, dict) and "controls" in data:
                controls_data = data["controls"]
            elif isinstance(data, list):
                controls_data = data

        if not controls_data:
            return 0

        # Generate embeddings in batches
        texts_to_embed = [
            f"{c.get('control_id', '')} {c.get('title', '')}: {c.get('description', '')}"
            for c in controls_data
        ]
        embeddings = self.embedder.encode(texts_to_embed)

        count = 0
        for item, emb in zip(controls_data, embeddings):
            cid = item.get("control_id") or item.get("id") or f"CTRL-{count+1}"
            title = item.get("title") or item.get("name") or cid
            desc = item.get("description") or title
            guidance = item.get("guidance") or item.get("implementation_guidance") or None
            severity = item.get("severity") or "Medium"
            source_url = item.get("source_url")
            source_page = item.get("source_page")

            # Upsert into framework_controls
            upsert_sql = text("""
                INSERT INTO framework_controls (
                    id, framework, control_id, title, description, guidance, severity, embedding, source_url, source_page, created_at
                )
                VALUES (
                    uuid_generate_v4(), :framework, :control_id, :title, :description, :guidance, :severity, (:embedding)::vector, :source_url, :source_page, NOW()
                )
                ON CONFLICT (framework, control_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    guidance = EXCLUDED.guidance,
                    severity = EXCLUDED.severity,
                    embedding = EXCLUDED.embedding,
                    source_url = EXCLUDED.source_url,
                    source_page = EXCLUDED.source_page
            """)

            emb_str = f"[{','.join(str(x) for x in emb)}]"
            await db.execute(
                upsert_sql,
                {
                    "framework": framework_name,
                    "control_id": cid,
                    "title": title,
                    "description": desc,
                    "guidance": guidance,
                    "severity": severity,
                    "embedding": emb_str,
                    "source_url": source_url,
                    "source_page": source_page,
                },
            )
            count += 1

        await db.commit()
        logger.info("Successfully ingested framework", framework=framework_name, count=count)
        return count


rag_service = RAGService()
