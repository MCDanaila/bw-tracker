"""AI-related endpoints (diet suggestions, document embedding)."""

from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["ai"])

# TODO: Implement POST /generate-diet-suggestion
# TODO: Implement POST /embed-document
