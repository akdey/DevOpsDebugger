"""FastAPI application entrypoint."""
from fastapi import FastAPI
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.docs import router as docs_router
from app.api.users import router as users_router
from app.core.config import settings
from app.core.middleware import AuthMiddleware
from app.mcp import mcp_registry
from app.mcp.google_mcp import GoogleMCP


def create_app() -> FastAPI:
    middleware = [
        Middleware(CORSMiddleware, 
                   allow_origins=["*"],
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"]),
        Middleware(AuthMiddleware)
    ]
    app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, middleware=middleware)
    # Register MCP clients (Google via SerpAPI) if configured
    try:
        google_mcp = GoogleMCP()
        # Only register if it can be instantiated; the MCP will internally check for API key
        mcp_registry.register("google", google_mcp)
    except Exception:
        # Don't fail startup if MCP registration fails — it's optional
        pass
    # Base routes
    app.include_router(api_router, prefix="/api")
    # Auth endpoints (public)
    app.include_router(auth_router, prefix="/api")
    # Analytics endpoints
    from app.api.analytics import router as analytics_router
    app.include_router(analytics_router, prefix="/api")
    # Analytics charts endpoints
    from app.api.analytics_charts import router as analytics_charts_router
    app.include_router(analytics_charts_router, prefix="/api")
    # Docs and chat endpoints
    app.include_router(docs_router, prefix="/api")
    app.include_router(users_router, prefix="/api")
    app.include_router(chat_router)
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
