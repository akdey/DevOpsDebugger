"""State schema for Langgraph agentic flow."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class AgentState:
    """Shared state across all agents in the Langgraph workflow."""
    
    query: str  # Original user query
    session_id: str  # Chat session ID
    user: Dict[str, Any]  # Authenticated user info
    
    # Validation and routing
    is_guardrail_passed: bool = False
    guardail_reason: str = ""
    is_devops_query: bool = False
    
    # Query evaluation and processing
    query_type: Optional[str] = None  # "general" or "debug"
    reframed_query: str = ""
    reasoning: str = ""
    
    # Context from previous messages
    chat_history: List[Dict[str, str]] = field(default_factory=list)
    
    # Search and retrieval results
    search_results: List[Dict[str, Any]] = field(default_factory=list)
    retrieval_results: List[Dict[str, Any]] = field(default_factory=list)
    
    # Final answer
    final_answer: str = ""
    
    # Tracking for websocket
    current_agent: str = ""
    agent_steps: List[Dict[str, Any]] = field(default_factory=list)
