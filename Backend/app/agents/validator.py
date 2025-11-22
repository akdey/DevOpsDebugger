"""Validator agent: checks guardrails and if query is DevOps-related."""
from typing import Dict, Any
from app.core.logging import get_logger
from app.llm.llm import get_llm
from app.state.state import AgentState

logger = get_logger(__name__)

FORBIDDEN_KEYWORDS = ["attack", "bomb", "illegal", "hack"]


def validate_query(state: AgentState) -> Dict[str, Any]:
    """Check guardrails and determine if query is DevOps-related using LLM.
    
    Considers chat history for better context on follow-up questions.
    """
    query = state.query
    
    # 1. Basic guardrail check
    query_lower = query.lower()
    for keyword in FORBIDDEN_KEYWORDS:
        if keyword in query_lower:
            logger.warning("Validator: Query blocked by guardrail - forbidden keyword: %s", keyword)
            return {
                "is_guardrail_passed": False,
                "guardail_reason": "Query is blocked due to guardrail violation",
                "is_devops_query": False,
                "current_agent": "Validator",
            }
    
    # 2. Check if DevOps-related using LLM
    # Build context from chat history if available
    context_str = ""
    if state.chat_history:
        # Include last few messages for context (max 3 previous exchanges)
        recent_history = state.chat_history[-6:]  # Last 3 exchanges (3 user + 3 assistant msgs)
        for msg in recent_history:
            role = msg.get("role", "").capitalize()
            content = msg.get("content", "")
            context_str += f"{role}: {content}\n"
        context_str = "Recent conversation context:\n" + context_str + "\n"
    
    llm = get_llm()
    check_prompt = f"""Determine if the following query is related to DevOps (includes: deployment, kubernetes, docker, CI/CD, infrastructure, monitoring, cloud, networking, security, etc.):

{context_str}Current Query: {query}

Consider the full conversation context above. Even if the current query seems generic, if previous messages discussed DevOps topics, this should be considered a DevOps-related follow-up.

Answer with only "YES" or "NO"."""
    
    try:
        response = llm.invoke(check_prompt)
        is_devops = "YES" in response.content.upper()
    except Exception as e:
        logger.error("Validator: Error calling LLM: %s", e)
        is_devops = False
    
    logger.info("Validator: query is_devops=%s (context=%d msgs)", is_devops, len(state.chat_history))
    
    return {
        "is_guardrail_passed": True,
        "guardail_reason": "Passed guardrail check",
        "is_devops_query": is_devops,
        "current_agent": "Validator",
    }
