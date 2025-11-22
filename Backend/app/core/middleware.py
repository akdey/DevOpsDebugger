from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

from app.core.logging import get_logger
from app.core import auth

logger = get_logger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Allow OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Skip auth for WebSocket connections (handled in WebSocket endpoint)
        # Handle both /chat and /chat/ paths
        # path = request.url.path.rstrip('/')
        path = request.url.path
        if path == "/chat":
            return await call_next(request)
        
        # Skip auth for public endpoints
        if request.url.path in ["/api/auth/login", "/api/auth/register", "/docs", "/openapi.json", "/api/health"]:
            return await call_next(request)
        
        # Protect /api endpoints (except auth)
        if request.url.path.startswith("/api"):
            auth_header = request.headers.get("authorization")
            token = None
            
            if auth_header:
                parts = auth_header.split()
                if len(parts) == 2 and parts[0].lower() == "bearer":
                    token = parts[1]
            
            if not token:
                return JSONResponse(status_code=401, content={"detail": "Missing auth token"})
            
            # Verify JWT token and set request.state.user with username and role
            payload = auth.verify_token(token)
            if not payload:
                return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})
            request.state.user = {"username": payload.get("username"), "role": payload.get("role")}
            logger.info("Authenticated JWT request user=%s role=%s path=%s", payload.get("username"), payload.get("role"), request.url.path)
        
        return await call_next(request)
