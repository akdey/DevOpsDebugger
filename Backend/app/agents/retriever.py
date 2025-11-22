"""Retriever agent: retrieves relevant documents from vector store."""
from typing import Dict, Any, List
from app.core.logging import get_logger
from app.core import auth
from app.state.state import AgentState

logger = get_logger(__name__)


def retrieve_docs(state: AgentState) -> Dict[str, Any]:
    """Retrieve relevant documents using keyword search from TinyDB."""
    query = state.reframed_query or state.query
    
    try:
        # Use the existing auth.search_docs function
        results = auth.search_docs(query, top_k=5)

        # Normalize results: ensure each item has id, title, content, score
        normalized = []
        for r in results:
            # different backends may return different shapes
            doc_id = r.get("id") or (r.get("metadata") or {}).get("id") or r.get("_id")
            title = r.get("title") or (r.get("metadata") or {}).get("title") or (r.get("document") or "")[:80]
            content = r.get("content") or r.get("document") or (r.get("metadata") or {}).get("content") or ""
            score = r.get("score") if r.get("score") is not None else r.get("distance")
            normalized.append({"id": doc_id, "title": title, "content": content, "score": score})

        logger.info("RetrieverAgent: retrieved %d docs for query=%s", len(normalized), query)

        return {
            "retrieval_results": normalized,
            "current_agent": "RetrieverAgent",
            "agent_steps": state.agent_steps + [{"agent": "RetrieverAgent", "status": "done", "results_count": len(normalized)}],
        }
    except Exception as e:
        logger.error("RetrieverAgent: Error during retrieval: %s", e)
        return {
            "retrieval_results": [],
            "current_agent": "RetrieverAgent",
            "agent_steps": state.agent_steps + [{"agent": "RetrieverAgent", "status": "error", "error": str(e)}],
        }
