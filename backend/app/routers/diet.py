"""Diet planning endpoints."""

from fastapi import APIRouter

router = APIRouter(prefix="/diet", tags=["diet"])

# TODO: Implement POST /assign-template
# TODO: Implement POST /apply-suggestion
