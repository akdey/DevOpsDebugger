from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "HackathonLabRAGApp"
    VERSION: str = "0.1.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # LLM and API keys
    GOOGLE_API_KEY: str | None = None
    SERPAPI_API_KEY: str | None = None
    
    # JWT configuration (loaded from .env)
    JWT_SECRET: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    class Config:
        env_file = ".env"


settings = Settings()
