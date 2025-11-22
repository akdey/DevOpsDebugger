"""Evaluator agent: classifies DevOps query as general or debug, reasons and reframes."""
from typing import Dict, Any
from app.core.logging import get_logger
from app.llm.llm import get_llm
from app.state.state import AgentState

logger = get_logger(__name__)

DEBUG_KEYWORDS = ["error", "crash", "fail", "debug", "exception", "traceback", "issue", "broken", "not working"]


def evaluate_devops_query(state: AgentState) -> Dict[str, Any]:
    """Classify query as general or debug, and reframe if needed."""
    query = state.query
    llm = get_llm()
    
    # 1. Classify as general or debug using LLM
    classify_prompt = f"""Classify the following DevOps query as either "GENERAL" (asking for how-to, best practices, configuration) or "DEBUG" (asking to help troubleshoot or fix an issue):

Query: {query}

Answer with only "GENERAL" or "DEBUG"."""
    
    try:
        response = llm.invoke(classify_prompt)
        query_type = "debug" if "DEBUG" in response.content.upper() else "general"
    except Exception as e:
        logger.error("Evaluator: Error classifying query: %s", e)
        query_type = "general"
    
    # 2. Reframe and add reasoning if needed
    reframe_prompt = f"""For the following DevOps query, provide:
1. A short reasoning about what the query is asking
2. A reframed version of the query (clearer, more structured if needed)
3. Suggest any context or previous steps that might be relevant

Query: {query}
Query Type: {query_type}

Respond in the format:
REASONING: <reasoning>
REFRAMED: <reframed query>
CONTEXT: <suggested context>"""
    
    try:
        response = llm.invoke(reframe_prompt)
        content = response.content
        # Parse response
        reasoning = content.split("REASONING:")[1].split("REFRAMED:")[0].strip() if "REASONING:" in content else ""
        reframed = content.split("REFRAMED:")[1].split("CONTEXT:")[0].strip() if "REFRAMED:" in content else query
    except Exception as e:
        logger.error("Evaluator: Error reframing query: %s", e)
        reasoning = "No reasoning available"
        reframed = query
    
    logger.info("Evaluator: query_type=%s reasoning=%s", query_type, reasoning[:50])
    
    return {
        "query_type": query_type,
        "reframed_query": reframed,
        "reasoning": reasoning,
        "current_agent": "Evaluator",
        "agent_steps": state.agent_steps + [{"agent": "Evaluator", "status": "done", "query_type": query_type}],
    }
