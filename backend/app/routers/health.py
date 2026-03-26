"""Health check endpoints."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns:
        {"status": "ok", "version": "0.1.0"}
    """
    return {
        "status": "ok",
        "version": "0.1.0",
        "message": "bw-tracker backend is running",
    }
