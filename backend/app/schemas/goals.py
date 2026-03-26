"""Goal management endpoint schemas."""

from typing import Literal
from pydantic import BaseModel


class SetGoalRequest(BaseModel):
    """Request to set a new goal for an athlete."""

    athlete_id: str
    target_weight: float | None = None
    steps_goal: int | None = None
    water_goal: float | None = None
    target_calories: int | None = None
    target_protein: int | None = None
    target_carbs: int | None = None
    target_fats: int | None = None
    phase: Literal["bulk", "cut", "maintenance", "reverse_diet"] | None = None
    notes: str | None = None


class SetGoalResponse(BaseModel):
    """Response from setting a goal."""

    goal_id: str
    athlete_id: str
    phase: str | None
    target_weight: float | None
    effective_from: str
