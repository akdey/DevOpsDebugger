"""Analytics helpers: record questions, categorize via LLM, and produce simple stats."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.logging import get_logger
from app.llm.llm import get_llm
from app.core import auth

logger = get_logger(__name__)


def _categorize_with_llm(text: str) -> List[str]:
    """Use the project's LLM to produce a short list of categories/tags for the question.

    Returns a list of short tags (strings). If LLM fails, returns an empty list.
    """
    try:
        llm = get_llm()
        prompt = (
            "You are a classifier. Given the following DevOps user question, return a comma-separated"
            " list of short tags describing the topic(s). Only return tags, no extra text."
            f"\n\nQuestion: {text}\n\nTags:"
        )
        response = llm.invoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)
        # split by comma or newline
        parts = [p.strip() for p in content.replace('\n', ',').split(',') if p.strip()]
        # keep up to 5 tags
        tags = parts[:5]
        return tags
    except Exception as e:
        logger.warning("Analytics: LLM categorization failed: %s", e)
        return []


def record_question(username: str, question: str, agent_steps: List[Dict[str, Any]], final_answer: str, used_mcp: Optional[str], mcp_results: Optional[List[Dict[str, Any]]]) -> Dict[str, Any]:
    """Record a question and its metadata into the DB and return the saved record.

    Stores fields: username, question, timestamp, tags, agent_steps, final_answer, used_mcp, mcp_results
    """
    questions = auth._DB.table("questions")
    timestamp = datetime.utcnow().isoformat() + "Z"
    tags = _categorize_with_llm(question)
    doc = {
        "username": username,
        "question": question,
        "timestamp": timestamp,
        "tags": tags,
        "agent_steps": agent_steps or [],
        "final_answer": final_answer,
        "used_mcp": used_mcp,
        "mcp_results": mcp_results or [],
    }
    doc_id = questions.insert(doc)
    doc["id"] = doc_id
    logger.info("Analytics: recorded question id=%s user=%s tags=%s", doc_id, username, tags)
    return doc


def list_questions(username: Optional[str] = None) -> List[Dict[str, Any]]:
    """Return recorded questions. If `username` is provided, filter by user."""
    questions = auth._DB.table("questions")
    if username:
        return [q for q in questions.all() if q.get("username") == username]
    return questions.all()


def stats_summary() -> Dict[str, Any]:
    """Return simple aggregated stats useful for visualizations.

    - total_questions
    - by_user: { username: count }
    - by_tag: { tag: count }
    - mcp_usage: { mcp_name: count }
    """
    questions = auth._DB.table("questions").all()
    total = len(questions)
    by_user: Dict[str, int] = {}
    by_tag: Dict[str, int] = {}
    mcp_usage: Dict[str, int] = {}

    for q in questions:
        user = q.get("username") or "unknown"
        by_user[user] = by_user.get(user, 0) + 1
        for tag in q.get("tags", []):
            by_tag[tag] = by_tag.get(tag, 0) + 1
        mcp = q.get("used_mcp")
        if mcp:
            mcp_usage[mcp] = mcp_usage.get(mcp, 0) + 1

    return {
        "total_questions": total,
        "by_user": by_user,
        "by_tag": by_tag,
        "mcp_usage": mcp_usage,
    }
