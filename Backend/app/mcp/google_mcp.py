"""Simple SerpAPI-based Google MCP wrapper.

Implements a minimal `GoogleMCP` class with a `search(query, num=5)` method
that returns a list of result dicts with `title`, `link` and `snippet` keys.
"""
from typing import List, Dict, Any, Optional
from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)


class GoogleMCP:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SERPAPI_API_KEY

    def search(self, query: str, num: int = 5) -> List[Dict[str, Any]]:
        """Perform a Google search via SerpAPI and return normalized results.

        Each result is a dict: { title, link, snippet }
        """
        try:
            import serpapi

            if not self.api_key:
                logger.warning("GoogleMCP: no SERPAPI_API_KEY configured")
                return []

            params = {
                "q": query,
                "engine": "google",
                "api_key": self.api_key,
                "num": num,
            }
            results_dict = serpapi.search(params)

            organic_results = results_dict.get("organic_results", [])[:num]
            formatted: List[Dict[str, Any]] = []
            for r in organic_results:
                formatted.append({
                    "title": r.get("title") or r.get("name") or "",
                    "link": r.get("link") or r.get("url") or "",
                    "snippet": r.get("snippet") or r.get("snippet_text") or "",
                })
            return formatted
        except Exception as e:
            logger.error("GoogleMCP: error during search: %s", e)
            return []
