from fastapi import APIRouter, HTTPException, Depends, Query, Request, UploadFile, File
from pydantic import BaseModel
from typing import List

from app.core import auth
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


def get_current_user(request: Request) -> dict:
    """Get current user from request state (set by middleware)."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Dependency to ensure user is admin."""
    if not auth.is_admin(user):
        logger.warning("Admin access denied for user=%s", user.get("username"))
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class DocIn(BaseModel):
    title: str
    content: str


class DocOut(DocIn):
    id: int


@router.post("/documents/upload", response_model=DocOut)
async def upload_doc(file: UploadFile = File(...), admin_user: dict = Depends(require_admin)):
    """Upload a PDF or TXT document for embedding (admin only).
    
    Supported formats:
    - .txt (plain text)
    - .pdf (PDF documents)
    """
    # Validate file type
    allowed_extensions = {".txt", ".pdf"}
    file_ext = "." + (file.filename.split(".")[-1] if "." in file.filename else "").lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not supported. Allowed: {', '.join(allowed_extensions)}")
    
    try:
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file_ext == ".txt":
            text_content = content.decode("utf-8")
        elif file_ext == ".pdf":
            text_content = auth.extract_pdf_text(content)
        
        # Use filename (without extension) as title if not provided
        title = file.filename.rsplit(".", 1)[0]
        
        logger.info("Admin %s uploading file: %s (type=%s, size=%d bytes)", 
                   admin_user.get("username"), file.filename, file_ext, len(content))
        
        # Add document to database and vector store
        doc = auth.add_doc(title, text_content)
        
        return doc
    
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="TXT file must be valid UTF-8 encoded")
    except Exception as e:
        logger.error("Error uploading file %s: %s", file.filename, str(e))
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/documents", response_model=List[DocOut])
def get_docs(user: dict = Depends(get_current_user)):
    """List all documents (authenticated users only)."""
    logger.info("User %s listing documents", user.get("username"))
    docs = auth.list_docs()
    # Convert TinyDB's doc_id to id for response model
    for doc in docs:
        if "doc_id" in doc and "id" not in doc:
            doc["id"] = doc["doc_id"]
    return docs


@router.get("/documents/search", response_model=List[DocOut])
def search(q: str = Query(..., min_length=1), user: dict = Depends(get_current_user)):
    """Search documents (authenticated users only)."""
    logger.info("User %s searching documents: %s", user.get("username"), q)
    results = auth.search_docs(q)
    # Convert TinyDB's doc_id to id for response model
    for doc in results:
        if "doc_id" in doc and "id" not in doc:
            doc["id"] = doc["doc_id"]
    return results
