"""User management endpoints (admin only)."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List

from app.core import auth
from app.core.logging import get_logger
from app.api.docs import require_admin, get_current_user

router = APIRouter()
logger = get_logger(__name__)


class UserCreate(BaseModel):
    username: str
    password: str = ""  # optional password for the new user
    role: str = "user"  # single role string


class UserResponse(BaseModel):
    username: str
    role: str


@router.post("/users", response_model=UserResponse)
def create_user(payload: UserCreate, admin_user: dict = Depends(require_admin)):
    """Create a new user (admin only)."""
    logger.info("Admin %s creating user: %s with role %s", admin_user.get("username"), payload.username, payload.role)
    user = auth.add_user(payload.username, payload.password or None, payload.role or "user")
    # Return a sanitized response
    return UserResponse(username=user.get("username"), role=user.get("role", "user"))
