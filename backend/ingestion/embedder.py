"""
IP-SAKTI Sahayak — Embedder
Embeds DocumentChunks using BGE-M3 and stores them in ChromaDB.
Also exports to JSONL for portability.

Usage:
    python -m backend.ingestion.embedder --input-dir data/sample_regulatory/
    python -m backend.ingestion.embedder --input-file data/sample_regulatory/patents_act.pdf
"""

import json
import logging
import sys
from pathlib import Path
from typing import Optional

from backend.config import settings
from backend.schemas import DocumentChunk
from backend.ingestion.parser import parse_pdf
from backend.ingestion.chunker import chunk_document, chunks_to_jsonl

logger = logging.getLogger("ipsakti.ingestion.embedder")


def embed_and_store(
    chunks: list[DocumentChunk],
    persist_dir: Optional[str] = None,
    collection_name: Optional[str] = None,
) -> int:
    """
    Embed document chunks with BGE-M3 and upsert into ChromaDB.
    Returns the number of chunks stored.
    """
    if not chunks:
        logger.warning("No chunks to embed.")
        return 0

    # Import retriever to reuse the singleton ChromaDB client
    from backend.rag.retriever import retriever

    collection = retriever.collection
    existing_ids = set()

    # Check which chunks already exist (idempotent)
    try:
        batch_size = 100
        chunk_ids = [c.chunk_id for c in chunks]
        for i in range(0, len(chunk_ids), batch_size):
            batch_ids = chunk_ids[i:i + batch_size]
            result = collection.get(ids=batch_ids)
            if result and result.get("ids"):
                existing_ids.update(result["ids"])
    except Exception:
        pass  # First run, collection may be empty

    # Filter out already-embedded chunks
    new_chunks = [c for c in chunks if c.chunk_id not in existing_ids]

    if not new_chunks:
        logger.info(f"All {len(chunks)} chunks already embedded. Skipping.")
        return 0

    logger.info(
        f"Embedding {len(new_chunks)} new chunks "
        f"({len(existing_ids)} already exist)"
    )

    # Prepare batch data
    ids = []
    documents = []
    metadatas = []

    for chunk in new_chunks:
        ids.append(chunk.chunk_id)
        documents.append(chunk.text)
        metadatas.append({
            "source_title": chunk.source_title,
            "source_type": chunk.source_type,
            "issuing_authority": chunk.issuing_authority,
            "section_number": chunk.section_number or "",
            "clause_number": chunk.clause_number or "",
            "page_number": chunk.page_number or 0,
            "paragraph_number": chunk.paragraph_number or 0,
            "language": chunk.language,
            "regime": chunk.regime,
            "category": chunk.category,
        })

    # Upsert in batches
    batch_size = settings.EMBEDDING_BATCH_SIZE
    total_stored = 0

    for i in range(0, len(ids), batch_size):
        batch_ids = ids[i:i + batch_size]
        batch_docs = documents[i:i + batch_size]
        batch_metas = metadatas[i:i + batch_size]

        try:
            collection.upsert(
                ids=batch_ids,
                documents=batch_docs,
                metadatas=batch_metas,
            )
            total_stored += len(batch_ids)
            logger.info(
                f"Embedded batch {i // batch_size + 1}: "
                f"{len(batch_ids)} chunks (total: {total_stored})"
            )
        except Exception as e:
            logger.error(f"ChromaDB upsert error at batch {i // batch_size + 1}: {e}")

    logger.info(
        f"Embedding complete: {total_stored} chunks stored in "
        f"collection '{collection.name}'"
    )
    return total_stored


def export_jsonl(chunks: list[DocumentChunk], output_path: Optional[str] = None) -> str:
    """Export chunks to JSONL file."""
    output_path = output_path or settings.JSONL_OUTPUT_PATH
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    jsonl_content = chunks_to_jsonl(chunks)

    with open(output_file, "a", encoding="utf-8") as f:
        f.write(jsonl_content + "\n")

    logger.info(f"Exported {len(chunks)} chunks to {output_file}")
    return str(output_file)


def ingest_pdf(filepath: str | Path) -> dict:
    """
    Full ingestion pipeline for a single PDF:
    Parse → Chunk → Embed → Export JSONL
    Returns summary dict.
    """
    filepath = Path(filepath)
    logger.info(f"Starting ingestion: {filepath.name}")

    # 1. Parse
    doc = parse_pdf(filepath)

    # 2. Chunk
    chunks = chunk_document(doc)

    if not chunks:
        return {
            "filename": filepath.name,
            "source_title": doc.source_title,
            "pages": doc.total_pages,
            "sections": len(doc.sections),
            "chunks_created": 0,
            "chunks_embedded": 0,
            "status": "no_content",
        }

    # 3. Embed and store
    stored = embed_and_store(chunks)

    # 4. Export JSONL
    export_jsonl(chunks)

    result = {
        "filename": filepath.name,
        "source_title": doc.source_title,
        "pages": doc.total_pages,
        "sections": len(doc.sections),
        "chunks_created": len(chunks),
        "chunks_embedded": stored,
        "status": "success",
    }

    logger.info(f"Ingestion complete: {result}")
    return result


def ingest_directory(directory: str | Path) -> list[dict]:
    """
    Ingest all PDFs in a directory.
    Returns list of per-file summary dicts.
    """
    directory = Path(directory)
    if not directory.exists():
        logger.error(f"Directory not found: {directory}")
        return []

    pdf_files = sorted(directory.glob("*.pdf"))
    if not pdf_files:
        logger.warning(f"No PDF files found in {directory}")
        return []

    logger.info(f"Found {len(pdf_files)} PDFs in {directory}")
    results = []

    for pdf_path in pdf_files:
        try:
            result = ingest_pdf(pdf_path)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed to ingest {pdf_path.name}: {e}")
            results.append({
                "filename": pdf_path.name,
                "status": "error",
                "error": str(e),
            })

    # Summary
    total_chunks = sum(r.get("chunks_created", 0) for r in results)
    total_embedded = sum(r.get("chunks_embedded", 0) for r in results)
    logger.info(
        f"Directory ingestion complete: {len(results)} files, "
        f"{total_chunks} chunks created, {total_embedded} embedded"
    )

    return results


# ── CLI Entry Point ──────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s"
    )

    parser = argparse.ArgumentParser(
        description="IP-SAKTI Document Ingestion Pipeline"
    )
    parser.add_argument(
        "--input-dir",
        type=str,
        help="Directory containing regulatory PDFs to ingest"
    )
    parser.add_argument(
        "--input-file",
        type=str,
        help="Single PDF file to ingest"
    )
    parser.add_argument(
        "--output-jsonl",
        type=str,
        default=None,
        help="Output JSONL file path (default: data/ingested_corpus.jsonl)"
    )

    args = parser.parse_args()

    if args.input_file:
        result = ingest_pdf(args.input_file)
        print(f"\nResult: {json.dumps(result, indent=2)}")
    elif args.input_dir:
        results = ingest_directory(args.input_dir)
        print(f"\nResults:")
        for r in results:
            status = r.get("status", "unknown")
            name = r.get("filename", "?")
            chunks = r.get("chunks_created", 0)
            print(f"  {name}: {status} ({chunks} chunks)")
    else:
        # Default: ingest sample_regulatory directory
        sample_dir = settings.SAMPLE_PDF_DIR
        if sample_dir.exists():
            results = ingest_directory(sample_dir)
            print(f"\nIngested {len(results)} files from {sample_dir}")
        else:
            print(f"No input specified and {sample_dir} not found.")
            print("Usage: python -m backend.ingestion.embedder --input-dir <path>")
