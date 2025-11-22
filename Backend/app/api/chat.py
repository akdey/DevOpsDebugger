"""WebSocket chat endpoint orchestrating agentic flow with streaming agent events."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, Any
import uuid

from app.core.logging import get_logger
from app.core import auth
from app.state.state import AgentState
from app.agents.validator import validate_query
from app.agents.non_devops import handle_non_devops
from app.agents.evaluator import evaluate_devops_query
from app.agents.synthesizer import synthesize_answer
from app.agents.retriever import retrieve_docs
from app.mcp import mcp_registry
from app.core import analytics as analytics_core

router = APIRouter()
logger = get_logger(__name__)


async def _send_agent_event(ws: WebSocket, agent_name: str, status: str, description: str | None = None, payload: Dict[str, Any] | None = None, using_mcp: bool | None = None):
    """Send an agent event to the client, including optional human-readable description.

    Adds a top-level `type` field and optional `using_mcp` boolean to make frontend handling explicit.
    """
    data: Dict[str, Any] = {"type": "agent_event", "agent": agent_name, "status": status}
    if description is not None:
        data["description"] = description
    if payload is not None:
        data["payload"] = payload
    if using_mcp is not None:
        data["using_mcp"] = using_mcp
    try:
        await ws.send_json(data)
    except Exception as e:
        logger.error("Error sending websocket event: %s", e)


def _agent_description(agent_name: str) -> str:
    mapping = {
        "Validator": "Performs guardrail checks and classifies whether the query is DevOps-related using the LLM.",
        "NonDevOpsAgent": "Handles non-DevOps queries and returns a helpful redirect message.",
        "Evaluator": "Classifies the DevOps query type (general/debug), reframes it and provides reasoning.",
        "Synthesizer": "Generates the final answer using available documentation, search results, and may call external MCP tools (e.g., Google) for recent information.",
        "Workflow": "Orchestrating the agentic workflow",
    }
    return mapping.get(agent_name, "")


@router.websocket("/chat")
async def websocket_chat(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket endpoint for chat with agentic flow.

    Token must be provided as URL query parameter:
    ws://localhost:8000/chat?token=<jwt_token>
    """
    try:
        # Validate token
        if not token:
            await websocket.accept()
            await websocket.send_json({"error": "token parameter required"})
            await websocket.close(code=1008)
            return

        # Verify JWT token (no legacy tokens allowed)
        payload = auth.verify_token(token)
        if not payload:
            await websocket.accept()
            await websocket.send_json({"error": "invalid or expired token"})
            await websocket.close(code=1008)
            return
        user = {"username": payload.get("username"), "role": payload.get("role")}
        logger.info("WebSocket authenticated with JWT for user=%s role=%s", payload.get("username"), payload.get("role"))

        await websocket.accept()
        await websocket.send_json({"info": "connected", "user": user.get("username")})
        # Send a default greeting message (as a chat response) to the client on connection
        try:
            await websocket.send_json({"type": "chatresponse", "message": "hi i am ur devops assistant"})
        except Exception:
            # If sending the greeting fails, continue without breaking the connection
            logger.exception("Failed to send greeting message to WebSocket client")
        logger.info("User connected via WebSocket: %s", user.get("username"))

        session_id = str(uuid.uuid4())
        chat_history = []  # Track conversation history for context

        while True:
            # Receive user message
            text = await websocket.receive_text()
            logger.info("[chat] user=%s session=%s query=%s", user.get("username"), session_id, text)

            # Create initial state with chat history for context awareness
            state = AgentState(
                query=text,
                session_id=session_id,
                user=user,
                chat_history=chat_history.copy(),  # Pass previous messages as context
                agent_steps=[],
            )

            try:
                # Start workflow
                await _send_agent_event(websocket, "Workflow", "starting", _agent_description("Workflow"))

                # 1) Validator
                await _send_agent_event(websocket, "Validator", "starting", _agent_description("Validator"))
                v_res = validate_query(state)
                # update state
                state.is_guardrail_passed = v_res.get("is_guardrail_passed", True)
                state.is_devops_query = v_res.get("is_devops_query", False)
                state.agent_steps = v_res.get("agent_steps", state.agent_steps)
                await _send_agent_event(websocket, "Validator", "complete", _agent_description("Validator"), {"result": v_res})

                # Guardrail failed -> return guardrail message
                if not state.is_guardrail_passed:
                    # send a structured chat response indicating blocking
                    await websocket.send_json({"type": "chatresponse", "error": "Query blocked by guardrail", "reason": v_res.get("guardail_reason"), "agent_steps": state.agent_steps})
                    await _send_agent_event(websocket, "Workflow", "complete", _agent_description("Workflow"), {"answer": None, "agent_steps": state.agent_steps})
                    # record blocked query
                    try:
                        analytics_core.record_question(user.get("username"), text, state.agent_steps, "", None, [])
                    except Exception:
                        logger.exception("Analytics: failed to record blocked query")
                    # Update chat history
                    chat_history.append({"role": "user", "content": text})
                    chat_history.append({"role": "assistant", "content": "Query blocked by guardrail"})
                    continue

                # If not a DevOps query -> non-devops handler
                if not state.is_devops_query:
                    await _send_agent_event(websocket, "NonDevOpsAgent", "starting", _agent_description("NonDevOpsAgent"))
                    nd_res = handle_non_devops(state)
                    state.agent_steps = nd_res.get("agent_steps", state.agent_steps)
                    await _send_agent_event(websocket, "NonDevOpsAgent", "complete", _agent_description("NonDevOpsAgent"), {"result": nd_res})
                    # send final chat response for non-devops queries
                    await _send_agent_event(websocket, "Workflow", "complete", _agent_description("Workflow"), {"answer": nd_res.get("final_answer"), "agent_steps": state.agent_steps})
                    await websocket.send_json({
                        "type": "chatresponse",
                        "answer": nd_res.get("final_answer"),
                        "agent_steps": state.agent_steps,
                    })
                    # record non-devops question
                    try:
                        analytics_core.record_question(user.get("username"), text, state.agent_steps, nd_res.get("final_answer"), None, [])
                    except Exception:
                        logger.exception("Analytics: failed to record non-devops question")
                    # Update chat history
                    chat_history.append({"role": "user", "content": text})
                    chat_history.append({"role": "assistant", "content": nd_res.get("final_answer")})
                    continue

                # 2) Evaluator
                await _send_agent_event(websocket, "Evaluator", "starting", _agent_description("Evaluator"))
                e_res = evaluate_devops_query(state)
                # update state with evaluation results
                state.query_type = e_res.get("query_type", "general")
                state.reframed_query = e_res.get("reframed_query", state.query)
                state.reasoning = e_res.get("reasoning", "")
                state.agent_steps = e_res.get("agent_steps", state.agent_steps)
                await _send_agent_event(websocket, "Evaluator", "complete", _agent_description("Evaluator"), {"result": e_res})

                # 3) Synthesizer (final agent). We intentionally bypass the separate search agent
                # Run Retriever to populate `state.retrieval_results` (semantic or keyword search)
                await _send_agent_event(websocket, "RetrieverAgent", "starting", _agent_description("RetrieverAgent"))
                try:
                    r_res = retrieve_docs(state)
                    retrieved = r_res.get("retrieval_results") if isinstance(r_res, dict) else []
                    # set into state so Synthesizer can consume
                    state.retrieval_results = retrieved or []
                    state.agent_steps = r_res.get("agent_steps", state.agent_steps) if isinstance(r_res, dict) else state.agent_steps
                    await _send_agent_event(websocket, "RetrieverAgent", "complete", _agent_description("RetrieverAgent"), {"results_count": len(state.retrieval_results)})
                except Exception as e:
                    logger.exception("RetrieverAgent failed: %s", e)
                    await _send_agent_event(websocket, "RetrieverAgent", "error", _agent_description("RetrieverAgent"), {"error": str(e)})

                # Check if an MCP named 'google' is available and let frontend know
                will_use_mcp = bool(mcp_registry.get("google"))
                await _send_agent_event(websocket, "Synthesizer", "starting", _agent_description("Synthesizer"), None, using_mcp=will_use_mcp)
                s_res = synthesize_answer(state)
                state.agent_steps = s_res.get("agent_steps", state.agent_steps)
                # If synthesizer used an MCP, note it in the description
                synth_desc = _agent_description("Synthesizer")
                used_mcp = s_res.get("used_mcp")
                if used_mcp:
                    synth_desc = synth_desc + f" Used MCP: {used_mcp}"
                # include retrieval titles and web sources (detailed) in the synthesizer complete event payload
                used_docs = []
                for d in (state.retrieval_results or []):
                    used_docs.append({
                        "id": d.get("id"),
                        "title": d.get("title"),
                        "score": d.get("score"),
                    })
                web_sources = []
                for r in (s_res.get("mcp_results") or []):
                    web_sources.append({"title": r.get("title"), "link": r.get("link"), "snippet": r.get("snippet")})
                await _send_agent_event(websocket, "Synthesizer", "complete", synth_desc, {"result": s_res, "used_docs": used_docs, "web_sources": web_sources}, using_mcp=bool(used_mcp))

                # Send final result
                final_answer = s_res.get("final_answer", "No answer generated")
                # Provide final answer and list of docs and web sources used to create it
                used_docs = []
                for d in (state.retrieval_results or []):
                    used_docs.append({"id": d.get("id"), "title": d.get("title"), "score": d.get("score")})
                web_sources = []
                for r in (s_res.get("mcp_results") or []):
                    web_sources.append({"title": r.get("title"), "link": r.get("link"), "snippet": r.get("snippet")})
                await _send_agent_event(websocket, "Workflow", "complete", _agent_description("Workflow"), {"answer": final_answer, "agent_steps": state.agent_steps, "used_mcp": used_mcp if 'used_mcp' in locals() else None, "used_docs": used_docs, "web_sources": web_sources})
                # also send a specific chat response message for frontend convenience
                try:
                    await websocket.send_json({
                        "type": "chatresponse",
                        "answer": final_answer,
                        "agent_steps": state.agent_steps,
                        "used_mcp": used_mcp if 'used_mcp' in locals() else None,
                        "used_docs": used_docs,
                        "web_sources": web_sources,
                    })
                except Exception:
                    logger.exception("Failed to send chatresponse message to WebSocket client")
                # record completed question (include mcp results if any)
                try:
                    analytics_core.record_question(user.get("username"), text, state.agent_steps, final_answer, used_mcp, s_res.get("mcp_results"))
                except Exception:
                    logger.exception("Analytics: failed to record completed question")
                
                # Update chat history with this exchange for context in follow-up questions
                chat_history.append({"role": "user", "content": text})
                chat_history.append({"role": "assistant", "content": final_answer})

                logger.info("[chat] completed for session=%s", session_id)

            except WebSocketDisconnect:
                logger.info("WebSocket disconnected for session=%s", session_id)
                break
            except Exception as e:
                logger.exception("Error in workflow execution: %s", e)
                await _send_agent_event(websocket, "Workflow", "error", _agent_description("Workflow"), {"error": str(e)})
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for session=%s", session_id if 'session_id' in locals() else "unknown")
    except Exception as e:
        logger.exception("WebSocket error: %s", e)
