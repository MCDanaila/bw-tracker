"""Diet planning endpoint schemas."""

from pydantic import BaseModel


class AssignTemplateRequest(BaseModel):
    """Request to assign a meal plan template to an athlete."""

    template_id: str
    athlete_id: str


class AssignTemplateResponse(BaseModel):
    """Response from assigning a template."""

    plans_created: int


class ApplySuggestionRequest(BaseModel):
    """Request to apply an AI suggestion as meal plans."""

    suggestion_id: str
    athlete_id: str
    food_matches: dict[str, str]  # { ai_food_name: food_id }


class ApplySuggestionResponse(BaseModel):
    """Response from applying a suggestion."""

    plans_created: int
    suggestion_id: str
