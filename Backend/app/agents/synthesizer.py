"""Synthesizer agent: synthesizes final answer based on all collected evidence."""
from typing import List, Dict, Any
from app.llm.llm import get_llm
from app.core.logging import get_logger
from app.state.state import AgentState
from app.mcp import mcp_registry

logger = get_logger(__name__)


def synthesize_answer(state: AgentState) -> Dict[str, Any]:
    """Synthesize final answer using retrieval results and search results.

    ALWAYS searches for recent information using MCP 'google' to provide current answers.
    Combines with retrieval results for comprehensive, fact-based responses.
    """
    llm = get_llm()
    query = state.reframed_query or state.query
    retrieval_results = state.retrieval_results or []
    search_results = state.search_results or []
    reasoning = state.reasoning or ""
    used_mcp = None
    mcp_results = []

    # ALWAYS try to search for recent info using MCP 'google'
    # This ensures answers are based on current information
    google_mcp = mcp_registry.get("google")
    if google_mcp:
        try:
            # Expect MCP instance to provide a `search(query, num=5)` method
            mcp_results = google_mcp.search(query, num=5)
            if mcp_results:
                # Normalize to expected format
                formatted = []
                for r in (mcp_results or [])[:5]:
                    formatted.append({
                        "title": r.get("title") or r.get("name") or "",
                        "link": r.get("link") or r.get("url") or "",
                        "snippet": r.get("snippet") or r.get("snippet_text") or "",
                    })
                search_results = formatted
                used_mcp = "google"
                logger.info("Synthesizer: ALWAYS used MCP 'google' to fetch %d search results for query: %s", len(formatted), query)
        except Exception as e:
            logger.warning("Synthesizer: MCP 'google' search attempt failed: %s. Will use state.search_results if available", e)
            # If MCP fails, fallback to state.search_results if available
            if not search_results:
                search_results = []

    # Build synthesis prompt with BOTH retrieval and search results
    prompt_parts = [
        f"You are a DevOps expert. Provide a comprehensive, accurate answer based on BOTH knowledge base documentation AND recent search results.",
        f"\n\nUser Query: {query}",
    ]

    if reasoning:
        prompt_parts.append(f"\nAgent Analysis: {reasoning}")

    # Always include retrieval results if available
    if retrieval_results:
        prompt_parts.append("\n=== KNOWLEDGE BASE (Internal Documentation) ===")
        for doc in retrieval_results:
            title = doc.get("title", "Unknown")
            content = doc.get("content", "")[:300]
            prompt_parts.append(f"- {title}: {content}...")
    else:
        prompt_parts.append("\n=== KNOWLEDGE BASE (Internal Documentation) ===")
        prompt_parts.append("- No internal documentation found for this query")

    # Always include search results (CRITICAL - always fetched)
    if search_results:
        prompt_parts.append("\n=== RECENT SEARCH RESULTS (Latest Information) ===")
        for result in search_results:
            title = result.get("title", "")
            snippet = result.get("snippet", "")
            link = result.get("link", "")
            prompt_parts.append(f"- {title}: {snippet}\n  Source: {link}")
    else:
        prompt_parts.append("\n=== RECENT SEARCH RESULTS (Latest Information) ===")
        prompt_parts.append("- No recent search results available")

    prompt_parts.append("\n\nFrame your answer by:")
    prompt_parts.append("1. First citing relevant knowledge base documentation")
    prompt_parts.append("2. Then incorporating recent search results and latest information")
    prompt_parts.append("3. Provide actionable, practical DevOps guidance")
    prompt_parts.append("4. Always cite sources when relevant")

    prompt = "\n".join(prompt_parts)
    logger.info("Synthesizer: generating answer based on retrieval (%d docs) + search (%d results) for query: %s", len(retrieval_results), len(search_results), query)

    try:
        response = llm.invoke(prompt)
        answer = response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        logger.error("Synthesizer: Error generating answer: %s", e)
        answer = f"Unable to generate answer: {str(e)}"

    result = {
        "final_answer": answer,
        "current_agent": "Synthesizer",
        "agent_steps": state.agent_steps + [{"agent": "Synthesizer", "status": "done"}],
    }
    if used_mcp:
        result["used_mcp"] = used_mcp
        # include the raw MCP results (titles/links/snippets) so frontend can show sources
        try:
            result["mcp_results"] = mcp_results
        except NameError:
            result["mcp_results"] = []
    return result
