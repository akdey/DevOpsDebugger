"""Authentication endpoints - login and token generation."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core import auth
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


class LoginRequest(BaseModel):
    username: str
    password: str = ""  # Optional for demo users


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str


class RegistrationRequest(BaseModel):
    username: str
    password: str = ""  # Optional for demo


@router.post("/auth/login", response_model=LoginResponse, tags=["auth"])
def login(payload: LoginRequest):
    """
    Login endpoint that returns a JWT token.
    
    For demo purposes, any username/password combination will work.
    In production, validate against hashed passwords.
    """
    username = payload.username.strip()
    
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    
    # Check if user exists and verify password
    user = auth.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not auth.verify_user_credentials(username, payload.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Generate JWT token
    access_token = auth.create_access_token(username, user.get("role", "user"))
    logger.info(f"User {username} logged in successfully")
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        username=username,
        role=user.get("role", "user")
    )


@router.post("/auth/register", response_model=LoginResponse, tags=["auth"])
def register(payload: RegistrationRequest):
    """
    Registration endpoint.
    Creates a new user and returns a JWT token.
    """
    username = payload.username.strip()
    
    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    
    # Check if user already exists
    existing_user = auth.get_user_by_username(username)
    if existing_user:
        raise HTTPException(status_code=409, detail="User already exists")
    
    # Create new user with password (public registration allowed, role forced to 'user')
    user = auth.add_user(username, payload.password, "user")

    # Generate JWT token
    access_token = auth.create_access_token(username, user.get("role", "user"))
    
    logger.info(f"New user registered: {username}")
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        username=username,
        role=user.get("role", "user")
    )
