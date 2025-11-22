"""Simple local vector store backed by Chroma + SentenceTransformers.

This module provides a thin wrapper that will try to load ChromaDB and
SentenceTransformers (all-MiniLM-L6-v2). If those packages are not
available or fail to initialize, the wrapper will be disabled and callers
should fall back to the plaintext keyword search.

The Chroma collection is persisted under `.chromadb/` in the project root.
"""
from typing import List, Dict, Any, Optional
import os
from app.core.logging import get_logger

logger = get_logger(__name__)

_ready = False
_client = None
_collection = None
_model = None


def _init():
    global _ready, _client, _collection, _model
    try:
        import chromadb
        from sentence_transformers import SentenceTransformer

        persist_dir = os.path.join(os.path.dirname(__file__), "..", "..", ".chromadb")
        os.makedirs(persist_dir, exist_ok=True)

        # Use persistent client (works with latest ChromaDB versions)
        _client = chromadb.PersistentClient(path=persist_dir)

        # Get or create collection
        _collection = _client.get_or_create_collection(name="docs")

        # Load small, fast embedding model
        _model = SentenceTransformer("all-MiniLM-L6-v2")

        _ready = True
        logger.info("Vector store initialized (Chroma + SentenceTransformer)")
    except Exception as e:
        _ready = False
        logger.warning("Vector store unavailable: %s", e)


def is_ready() -> bool:
    if not _ready:
        # try initialize on first check
        _init()
    return _ready


def _embed(texts: List[str]) -> List[List[float]]:
    if not is_ready():
        raise RuntimeError("Vector store not initialized")
    return _model.encode(texts).tolist()


def add_document(doc_id: str, title: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> None:
    """Add a document to the vector store. `doc_id` must be unique."""
    if not is_ready():
        return
    try:
        text = (title or "") + "\n" + (content or "")
        emb = _embed([text])[0]
        # Chroma expects lists
        _collection.add(ids=[str(doc_id)], documents=[text], metadatas=[metadata or {}], embeddings=[emb])
        logger.info("Vector store: added doc id=%s", doc_id)
    except Exception as e:
        logger.error("Failed to add document to vector store: %s", e)


def query(query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Query the vector store and return list of results with fields: id, document, metadata, distance."""
    if not is_ready():
        return []
    try:
        q_emb = _embed([query_text])[0]

        # Different ChromaDB versions accept different `include` keys.
        # Try the older form first (which included 'ids'), then fall back
        # to newer include keys such as 'data' if needed.
        out = []
        try:
            results = _collection.query(query_embeddings=[q_emb], n_results=top_k, include=["metadatas", "documents", "distances", "ids"])
            ids = results.get("ids", [[]])[0]
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            dists = results.get("distances", [[]])[0]
        except Exception:
            # Fallback for newer Chroma versions where 'ids' is not an allowed include
            # and query returns a 'data' structure (or only documents/metadatas/distances).
            results = _collection.query(query_embeddings=[q_emb], n_results=top_k, include=["metadatas", "documents", "distances", "data"])
            # Extract lists safely (some keys might be missing depending on Chroma version)
            docs = results.get("documents", [[]])[0] if "documents" in results else []
            metas = results.get("metadatas", [[]])[0] if "metadatas" in results else []
            dists = results.get("distances", [[]])[0] if "distances" in results else []

            # 'data' is often a list of dicts containing id/uri information.
            data_list = results.get("data", [[]])[0]
            ids = []
            for item in data_list:
                if isinstance(item, dict):
                    ids.append(item.get("id") or item.get("uri") or item.get("uuid") or None)
                else:
                    ids.append(item)

        # Build normalized output
        for i in range(len(ids)):
            out.append({
                "id": ids[i],
                "document": docs[i] if i < len(docs) else None,
                "metadata": metas[i] if i < len(metas) else {},
                "distance": dists[i] if i < len(dists) else None,
            })
        return out
    except Exception as e:
        logger.error("Vector store query failed: %s", e)
        return []


# initialize eagerly but safely
_init()
