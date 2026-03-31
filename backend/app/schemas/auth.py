"""Auth and invitation endpoint schemas."""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class CheckEmailRequest(BaseModel):
    email: EmailStr


class CheckEmailResponse(BaseModel):
    exists: bool


class CompleteRegistrationRequest(BaseModel):
    plan: str  # self_coached | self_coached_ai | coach | coach_pro
    invite_token: Optional[UUID] = None
    gender: Optional[str] = None  # male | female | other
    dob: Optional[str] = None  # YYYY-MM-DD
    height: Optional[float] = None
    height_unit: Optional[str] = "cm"
    initial_weight: Optional[float] = None
    weight_unit: Optional[str] = "kg"
    unit_system: Optional[str] = "metric"
    goal: Optional[str] = None  # lose_fat | recomp | build_muscle | maintain
    goal_rate: Optional[str] = "moderate"  # conservative | moderate | aggressive
    activity_level: Optional[str] = None  # desk | light | moderate | very_active
    gym_days_per_week: Optional[int] = None
    diet_framework: Optional[str] = "omnivore"
    meal_frequency: Optional[int] = 3
    hard_nos: Optional[List[str]] = []


class InvitationSendRequest(BaseModel):
    athlete_email: EmailStr


class InvitationAcceptRequest(BaseModel):
    token: UUID


class InvitationResponse(BaseModel):
    id: UUID
    coach_id: UUID
    invitee_email: str
    token: UUID
    status: str
    created_at: datetime
    expires_at: datetime
    coach_name: Optional[str] = None
