"""Non-DevOps agent: responds to non-DevOps queries."""
from typing import Dict, Any
from app.core.logging import get_logger
from app.state.state import AgentState

logger = get_logger(__name__)


def handle_non_devops(state: AgentState) -> Dict[str, Any]:
    """Return response for non-DevOps queries."""
    answer = "I can only answer DevOps-related queries. Please ask something related to deployment, infrastructure, CI/CD, or similar topics."
    logger.info("NonDevOpsAgent: handled non-devops query")
    
    return {
        "final_answer": answer,
        "current_agent": "NonDevOpsAgent",
        "agent_steps": state.agent_steps + [{"agent": "NonDevOpsAgent", "status": "done", "result": answer}],
    }
