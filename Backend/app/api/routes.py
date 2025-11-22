from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


@router.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}


class EchoIn(BaseModel):
    text: str


@router.post("/echo", tags=["utils"])
def echo(payload: EchoIn):
    """Simple echo endpoint for testing POST requests."""
    return {"echo": payload.text}
