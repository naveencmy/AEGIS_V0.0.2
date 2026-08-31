"""
IP-SAKTI Sahayak — ChromaDB Retriever with Regime Filtering
Wraps ChromaDB for similarity-threshold retrieval with metadata filters.
Supports regime filtering (national/international/traditional) and category filtering.
"""

import logging
from typing import Optional
from pathlib import Path

import chromadb
from chromadb.config import Settings as ChromaSettings

from backend.config import settings

logger = logging.getLogger("ipsakti.rag.retriever")


class IPSaktiEmbeddingFunction:
    """
    ChromaDB-compatible embedding function using sentence-transformers BGE-M3.
    Lazy-loads the model on first call to save startup memory.
    """

    def __init__(self, model_name: str = "BAAI/bge-m3"):
        self._model_name = model_name
        self._model = None

    def _load_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading embedding model: {self._model_name}...")
                self._model = SentenceTransformer(
                    self._model_name,
                    trust_remote_code=True
                )
                logger.info(f"Embedding model loaded: {self._model_name}")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                raise

    def __call__(self, input: list[str]) -> list[list[float]]:
        self._load_model()
        embeddings = self._model.encode(
            input,
            normalize_embeddings=True,
            show_progress_bar=False,
            batch_size=settings.EMBEDDING_BATCH_SIZE,
        )
        return embeddings.tolist()


class IPSaktiRetriever:
    """
    Sovereign retriever over ChromaDB with:
    - Similarity-score threshold (0.65 default)
    - Regime filtering (national, international, traditional)
    - Category filtering (patentability, gmp, export, etc.)
    - Top-k retrieval (k=5 default)
    """

    def __init__(self):
        self.persist_dir = Path(settings.CHROMA_PERSIST_DIR)
        self.persist_dir.mkdir(parents=True, exist_ok=True)

        self.embedding_fn = IPSaktiEmbeddingFunction(settings.EMBEDDING_MODEL)

        self.client = chromadb.PersistentClient(
            path=str(self.persist_dir),
            settings=ChromaSettings(
                anonymized_telemetry=False,
                is_persistent=True
            )
        )

        self.collection = self.client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )

        logger.info(
            f"ChromaDB initialized at {self.persist_dir} — "
            f"Collection '{settings.CHROMA_COLLECTION_NAME}' "
            f"has {self.collection.count()} chunks"
        )

    def retrieve(
        self,
        query: str,
        regime_filter: Optional[list[str]] = None,
        category_filter: Optional[list[str]] = None,
        k: int = None,
        score_threshold: float = None,
    ) -> list[dict]:
        """
        Retrieve top-k relevant document chunks for a query.

        Returns list of dicts with keys:
          - id, content, metadata, distance, similarity, relevance_score
        """
        k = k or settings.RETRIEVAL_TOP_K
        score_threshold = score_threshold or settings.SIMILARITY_THRESHOLD

        count = self.collection.count()
        if count == 0:
            logger.warning("ChromaDB collection is empty — no documents to retrieve.")
            return []

        # Build ChromaDB where filter
        where_filter = self._build_where_filter(regime_filter, category_filter)

        try:
            query_kwargs = {
                "query_texts": [query],
                "n_results": min(k * 2, count),  # over-fetch, then threshold-filter
                "include": ["documents", "metadatas", "distances"],
            }
            if where_filter:
                query_kwargs["where"] = where_filter

            results = self.collection.query(**query_kwargs)
        except Exception as e:
            logger.error(f"ChromaDB query error: {e}")
            # Retry without filter (filter may have invalid values)
            if where_filter:
                logger.info("Retrying without where filter...")
                results = self.collection.query(
                    query_texts=[query],
                    n_results=min(k * 2, count),
                    include=["documents", "metadatas", "distances"],
                )
            else:
                return []

        if not results or not results.get("documents") or not results["documents"][0]:
            return []

        docs = results["documents"][0]
        metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
        dists = results["distances"][0] if results.get("distances") else [0.0] * len(docs)
        ids = results["ids"][0] if results.get("ids") else [""] * len(docs)

        # Convert distance to similarity and threshold-filter
        retrieved = []
        for doc_id, content, meta, dist in zip(ids, docs, metas, dists):
            # ChromaDB cosine distance: similarity = 1 - distance/2 (for normalized vectors)
            similarity = max(0.0, 1.0 - (dist / 2.0)) if dist <= 2.0 else 0.0

            if similarity < score_threshold:
                continue

            retrieved.append({
                "id": doc_id,
                "content": content,
                "metadata": meta,
                "distance": dist,
                "similarity": round(similarity, 4),
                "relevance_score": round(similarity, 4),
            })

        # Sort by similarity descending, take top-k
        retrieved.sort(key=lambda x: x["similarity"], reverse=True)
        retrieved = retrieved[:k]

        logger.info(
            f"Retrieved {len(retrieved)} chunks above threshold "
            f"{score_threshold} (from {len(docs)} candidates)"
        )
        return retrieved

    def _build_where_filter(
        self,
        regime_filter: Optional[list[str]] = None,
        category_filter: Optional[list[str]] = None,
    ) -> Optional[dict]:
        """Build a ChromaDB $and/$or where clause."""
        conditions = []

        if regime_filter and len(regime_filter) > 0:
            if len(regime_filter) == 1:
                conditions.append({"regime": {"$eq": regime_filter[0]}})
            else:
                conditions.append({"regime": {"$in": regime_filter}})

        if category_filter and len(category_filter) > 0:
            if len(category_filter) == 1:
                conditions.append({"category": {"$eq": category_filter[0]}})
            else:
                conditions.append({"category": {"$in": category_filter}})

        if not conditions:
            return None
        if len(conditions) == 1:
            return conditions[0]
        return {"$and": conditions}

    def get_chunk_by_id(self, chunk_id: str) -> Optional[dict]:
        """Retrieve a single chunk by its ID for the /citation endpoint."""
        try:
            result = self.collection.get(
                ids=[chunk_id],
                include=["documents", "metadatas"]
            )
            if result and result.get("ids") and result["ids"]:
                return {
                    "id": result["ids"][0],
                    "content": result["documents"][0] if result.get("documents") else "",
                    "metadata": result["metadatas"][0] if result.get("metadatas") else {},
                }
        except Exception as e:
            logger.error(f"Failed to retrieve chunk {chunk_id}: {e}")
        return None

    def get_all_sources(self) -> list[dict]:
        """Get summary of all ingested documents grouped by source_title."""
        count = self.collection.count()
        if count == 0:
            return []

        try:
            # Fetch all metadata (for small corpora this is fine)
            fetch_count = min(count, 10000)
            result = self.collection.get(
                limit=fetch_count,
                include=["metadatas"]
            )
        except Exception as e:
            logger.error(f"Failed to get sources: {e}")
            return []

        if not result or not result.get("metadatas"):
            return []

        # Group by source_title
        source_map: dict[str, dict] = {}
        for meta in result["metadatas"]:
            title = meta.get("source_title", "Unknown")
            if title not in source_map:
                source_map[title] = {
                    "source_title": title,
                    "source_type": meta.get("source_type"),
                    "issuing_authority": meta.get("issuing_authority"),
                    "regime": meta.get("regime"),
                    "chunk_count": 0,
                    "categories": set(),
                }
            source_map[title]["chunk_count"] += 1
            cat = meta.get("category")
            if cat:
                source_map[title]["categories"].add(cat)

        # Convert sets to lists
        sources = []
        for s in source_map.values():
            s["categories"] = sorted(list(s["categories"]))
            sources.append(s)

        return sources

    def get_stats(self) -> dict:
        """Get collection statistics."""
        count = self.collection.count()
        sources = self.get_all_sources()
        return {
            "total_chunks": count,
            "total_documents": len(sources),
            "sources": sources,
        }


# Module-level singleton
retriever = IPSaktiRetriever()
