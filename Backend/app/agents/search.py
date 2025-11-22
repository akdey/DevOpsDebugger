"""Search agent: uses SerpAPI to search Google."""
from typing import Dict, Any, List
from app.core.logging import get_logger
from app.core.config import settings
from app.state.state import AgentState

logger = get_logger(__name__)


def search_google(state: AgentState) -> Dict[str, Any]:
    """Search Google using SerpAPI for the (possibly reframed) query."""
    query = state.reframed_query or state.query
    
    try:
        import serpapi
        
        if not settings.SERPAPI_API_KEY:
            logger.warning("SearchAgent: No SERPAPI_API_KEY, returning empty results")
            return {
                "search_results": [],
                "current_agent": "SearchAgent",
                "agent_steps": state.agent_steps + [{"agent": "SearchAgent", "status": "done", "results_count": 0}],
            }
        
        params = {
            "q": query,
            "engine": "google",
            "api_key": settings.SERPAPI_API_KEY,
            "num": 5,
        }
        results_dict = serpapi.search(params)
        
        organic_results = results_dict.get("organic_results", [])[:5]
        formatted = []
        for r in organic_results:
            formatted.append({
                "title": r.get("title"),
                "link": r.get("link"),
                "snippet": r.get("snippet"),
            })
        
        logger.info("SearchAgent: found %d results for query=%s", len(formatted), query)
        
        return {
            "search_results": formatted,
            "current_agent": "SearchAgent",
            "agent_steps": state.agent_steps + [{"agent": "SearchAgent", "status": "done", "results_count": len(formatted)}],
        }
    except Exception as e:
        logger.error("SearchAgent: Error during search: %s", e)
        return {
            "search_results": [],
            "current_agent": "SearchAgent",
            "agent_steps": state.agent_steps + [{"agent": "SearchAgent", "status": "error", "error": str(e)}],
        }
