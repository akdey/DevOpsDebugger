"""Langgraph workflow definition for the RAG chatbot agentic flow."""
from typing import Literal
from langgraph.graph import StateGraph, END
from app.state.state import AgentState
from app.agents.validator import validate_query
from app.agents.non_devops import handle_non_devops
from app.agents.evaluator import evaluate_devops_query
from app.agents.search import search_google
from app.agents.retriever import retrieve_docs
from app.agents.synthesizer import synthesize_answer
from app.core.logging import get_logger

logger = get_logger(__name__)


def route_after_validation(state: AgentState) -> Literal["non_devops_agent", "evaluator_agent"]:
    """Route based on guardrail and DevOps check."""
    if not state.is_guardrail_passed:
        return "end"
    if not state.is_devops_query:
        return "non_devops_agent"
    return "evaluator_agent"


def route_after_evaluation(state: AgentState) -> Literal["search_agent", "retriever_search_agents"]:
    """Route based on query type (general or debug)."""
    if state.query_type == "general":
        return "search_agent"
    else:  # debug
        return "retriever_search_agents"


def build_graph() -> StateGraph:
    """Build and return the Langgraph workflow."""
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("validator_agent", validate_query)
    graph.add_node("non_devops_agent", handle_non_devops)
    graph.add_node("evaluator_agent", evaluate_devops_query)
    graph.add_node("search_agent", search_google)
    graph.add_node("retriever_agent", retrieve_docs)
    graph.add_node("synthesizer_agent", synthesize_answer)
    
    # Add edges
    graph.set_entry_point("validator_agent")
    
    # Validator -> route
    graph.add_conditional_edges(
        "validator_agent",
        route_after_validation,
        {
            "non_devops_agent": "non_devops_agent",
            "evaluator_agent": "evaluator_agent",
            "end": END,
        },
    )
    
    # Non-DevOps ends
    graph.add_edge("non_devops_agent", END)
    
    # Evaluator -> route based on query type
    graph.add_conditional_edges(
        "evaluator_agent",
        route_after_evaluation,
        {
            "search_agent": "search_agent",
            "retriever_search_agents": "retriever_agent",
        },
    )
    
    # General flow: search -> synthesizer -> end
    graph.add_edge("search_agent", "synthesizer_agent")
    graph.add_edge("synthesizer_agent", END)
    
    # Debug flow: both retriever and search in parallel, then synthesizer -> end
    graph.add_edge("retriever_agent", "search_agent")
    graph.add_edge("search_agent", "synthesizer_agent")
    
    logger.info("Built Langgraph workflow")
    return graph


def get_workflow():
    """Get compiled workflow (singleton)."""
    global _workflow
    if _workflow is None:
        _workflow = build_graph().compile()
    return _workflow


_workflow = None
