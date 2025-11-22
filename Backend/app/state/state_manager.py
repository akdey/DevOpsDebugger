"""State manager for persisting chat sessions and messages."""
import os
from typing import Dict, Any, List
from tinydb import TinyDB, where
from app.core.logging import get_logger

logger = get_logger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "db.json")


def _get_db():
    db_dir = os.path.dirname(DB_PATH)
    os.makedirs(db_dir, exist_ok=True)
    return TinyDB(DB_PATH)


_db = _get_db()


def save_message(session_id: str, role: str, text: str) -> Dict[str, Any]:
    """Save a chat message to the database."""
    chats = _db.table("chats")
    entry = {"session_id": session_id, "role": role, "text": text}
    chats.insert(entry)
    logger.info("Saved message session=%s role=%s", session_id, role)
    return entry


def get_session_messages(session_id: str) -> List[Dict[str, Any]]:
    """Retrieve all messages for a session."""
    chats = _db.table("chats")
    return chats.search(where("session_id") == session_id)


def save_session_meta(session_id: str, meta: Dict[str, Any]) -> None:
    """Save session metadata."""
    sessions = _db.table("sessions")
    existing = sessions.search(where("session_id") == session_id)
    if existing:
        sessions.update(meta, where("session_id") == session_id)
    else:
        doc = {"session_id": session_id}
        doc.update(meta)
        sessions.insert(doc)
    logger.info("Saved session meta for %s", session_id)


def get_session_meta(session_id: str) -> Dict[str, Any] | None:
    """Retrieve session metadata."""
    sessions = _db.table("sessions")
    res = sessions.search(where("session_id") == session_id)
    return res[0] if res else None
