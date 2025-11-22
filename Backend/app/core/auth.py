import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import jwt
from io import BytesIO

from passlib.context import CryptContext

from tinydb import TinyDB, Query
from app.core import vector_store

from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)


DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "db.json")


def _ensure_db():
    db_dir = os.path.dirname(DB_PATH)
    os.makedirs(db_dir, exist_ok=True)
    return TinyDB(DB_PATH)


def init_db():
    db = _ensure_db()
    users = db.table("users")
    # create default dev users if none exist
    if len(users) == 0:
            # Create initial admin and user. Change these passwords in production.
            pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
            # Use shorter passwords to avoid bcrypt 72-byte limit
            admin_hash = pwd_ctx.hash("Admin@123")
            user_hash = pwd_ctx.hash("User@123")
            users.insert({
                "username": "admin",
                "password_hash": admin_hash,
                "role": "admin"
            })
            users.insert({
                "username": "user",
                "password_hash": user_hash,
                "role": "user"
            })
            logger.info("Created initial admin and user. Update passwords immediately in production.")
    return db


_DB = init_db()


def extract_pdf_text(pdf_content: bytes) -> str:
    """Extract text from PDF content (bytes).
    
    Args:
        pdf_content: PDF file content as bytes
        
    Returns:
        Extracted text from all pages
        
    Raises:
        Exception: If PDF cannot be read
    """
    try:
        from PyPDF2 import PdfReader
        
        pdf_file = BytesIO(pdf_content)
        pdf_reader = PdfReader(pdf_file)
        
        text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n--- Page {page_num + 1} ---\n{page_text}"
        
        if not text.strip():
            raise ValueError("No text could be extracted from PDF")
        
        logger.info("Extracted %d characters from PDF with %d pages", len(text), len(pdf_reader.pages))
        return text
        
    except ImportError:
        logger.error("PyPDF2 not installed. Install with: pip install PyPDF2")
        raise RuntimeError("PDF support not available. Please install PyPDF2.")
    except Exception as e:
        logger.error("Error extracting PDF text: %s", str(e))
        raise


def add_user(username: str, password: Optional[str] = None, role: Optional[str] = None) -> Dict[str, Any]:
    """Create a new user. Password, if provided, will be hashed and stored as `password_hash`.

    `role` is a single string; defaults to 'user'.
    """
    users = _DB.table("users")
    doc: Dict[str, Any] = {"username": username, "role": role or "user"}
    if password is not None:
        # store bcrypt hash of the password
        # Bcrypt has a 72-byte limit; truncate password if necessary
        password_truncated = password[:72]
        pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
        doc["password_hash"] = pwd_ctx.hash(password_truncated)
    users.insert(doc)
    logger.info("Created user %s with role %s", username, doc["role"])
    return doc


def has_role(user: Dict[str, Any], required_role: str) -> bool:
    """Check if user has a specific role (single `role` field)."""
    role = user.get("role")
    return role == required_role


def is_admin(user: Dict[str, Any]) -> bool:
    """Check if user is admin."""
    return has_role(user, "admin")


def verify_user_credentials(username: str, password: str) -> bool:
    """Verify username/password against stored password_hash (bcrypt via passlib)."""
    user = get_user_by_username(username)
    if not user:
        return False
    stored = user.get("password_hash")
    if not stored:
        return False
    pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    try:
        # Bcrypt has a 72-byte limit; truncate password if necessary
        password_truncated = password[:72]
        return pwd_ctx.verify(password_truncated, stored)
    except Exception:
        return False


# Document storage and simple search for RAG
def add_doc(title: str, content: str) -> Dict[str, Any]:
    docs = _DB.table("docs")
    doc = {"title": title, "content": content}
    doc_id = docs.insert(doc)
    doc["id"] = doc_id
    logger.info("Added doc %s id=%s", title, doc_id)
    # add to vector store if available
    try:
        if vector_store.is_ready():
            # use the TinyDB numeric id as string key
            vector_store.add_document(str(doc_id), title, content, metadata={"id": doc_id, "title": title})
    except Exception as e:
        logger.warning("Failed to add doc to vector store: %s", e)
    return doc


def list_docs() -> List[Dict[str, Any]]:
    docs = _DB.table("docs")
    return docs.all()


def search_docs(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Search documents.

    If a vector store is available, use semantic search. Otherwise fall back
    to the existing simple keyword count ranking.
    """
    # Try vector search first
    try:
        if vector_store.is_ready():
            vs_results = vector_store.query(query, top_k=top_k)
            out = []
            for r in vs_results:
                meta = r.get("metadata", {}) or {}
                # Try to retrieve the original doc from TinyDB by id if possible
                doc_id = meta.get("id") or r.get("id")
                try:
                    docs_table = _DB.table("docs")
                    # TinyDB stores numeric ids; if id is str digit convert
                    db_doc = None
                    if isinstance(doc_id, str) and doc_id.isdigit():
                        db_doc = docs_table.get(doc_id=int(doc_id))
                    else:
                        # fallback search by title match
                        all_docs = docs_table.all()
                        for dd in all_docs:
                            if str(dd.get("id")) == str(doc_id) or dd.get("title") == meta.get("title"):
                                db_doc = dd
                                break
                    entry = dict(db_doc) if db_doc else {"id": doc_id, "title": meta.get("title"), "content": r.get("document")}
                except Exception:
                    entry = {"id": doc_id, "title": meta.get("title"), "content": r.get("document")}
                entry["score"] = 1.0 - float(r.get("distance", 0.0)) if r.get("distance") is not None else 1.0
                out.append(entry)
            return out[:top_k]
    except Exception as e:
        logger.warning("Vector search failed, falling back to keyword search: %s", e)

    # Fallback: naive keyword-based search: ranks by number of occurrences
    docs = _DB.table("docs").all()
    q = query.lower()
    scored = []
    for d in docs:
        content = (d.get("content") or "").lower()
        title = (d.get("title") or "").lower()
        score = content.count(q) + title.count(q)
        if score > 0:
            d_copy = dict(d)
            d_copy["score"] = score
            scored.append(d_copy)
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]


# JWT Token management
def create_access_token(username: str, role: str) -> str:
    """Generate JWT access token containing username and single role."""
    expiration = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    payload = {
        "username": username,
        "role": role,
        "exp": expiration,
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    logger.debug(f"Generated JWT token for user {username}")
    return token


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username."""
    users = _DB.table("users")
    User = Query()
    res = users.search(User.username == username)
    return res[0] if res else None
