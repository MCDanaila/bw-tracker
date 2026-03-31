"""Authentication and registration endpoints."""

import logging

from fastapi import APIRouter, HTTPException

from ..dependencies import CurrentUserDep
from ..lib.supabase_client import get_service_client
from ..schemas.auth import (
    CheckEmailRequest,
    CheckEmailResponse,
    CompleteRegistrationRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

PLAN_ROLE_MAP = {
    "self_coached": ("self_coached", False),
    "self_coached_ai": ("self_coached", True),
    "coach": ("coach", False),
    "coach_pro": ("coach", True),
}

_ALLERGIES = {"nuts", "fish", "eggs", "shellfish", "soy"}
_INTOLERANCES = {"lactose", "gluten", "fructose"}


@router.post("/check-email", response_model=CheckEmailResponse)
async def check_email(body: CheckEmailRequest):
    """Check if an email already has an account. No auth required."""
    supabase = await get_service_client()
    result = await supabase.table("profiles").select("id").eq("email", body.email).limit(1).execute()
    return CheckEmailResponse(exists=len(result.data) > 0)


@router.post("/complete-registration")
async def complete_registration(
    body: CompleteRegistrationRequest,
    current_user: CurrentUserDep,
):
    """
    Set plan/role/ai_enabled and write onboarding data to profiles and
    athlete_preferences. Must be called after supabase.auth.signUp.
    Uses service role to bypass RLS.
    """
    if body.plan not in PLAN_ROLE_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {body.plan}")

    role, ai_enabled = PLAN_ROLE_MAP[body.plan]
    user_id = current_user.id

    hard_nos = body.hard_nos or []
    allergies = [x for x in hard_nos if x in _ALLERGIES]
    intolerances = [x for x in hard_nos if x in _INTOLERANCES]

    supabase = await get_service_client()

    # Build profile update — omit None values
    profile_update = {
        "plan": body.plan,
        "role": role,
        "ai_enabled": ai_enabled,
        "gender": body.gender,
        "dob": body.dob,
        "height": body.height,
        "initial_weight": body.initial_weight,
        "unit_system": body.unit_system,
        "goal": body.goal,
        "goal_rate": body.goal_rate,
        "activity_level": body.activity_level,
        "gym_days_per_week": body.gym_days_per_week,
    }
    profile_update = {k: v for k, v in profile_update.items() if v is not None}

    await supabase.table("profiles").update(profile_update).eq("id", user_id).execute()

    prefs_upsert = {
        "user_id": user_id,
        "diet_framework": body.diet_framework or "omnivore",
        "meal_frequency": body.meal_frequency or 3,
        "allergies": allergies,
        "intolerances": intolerances,
    }
    await supabase.table("athlete_preferences").upsert(prefs_upsert, on_conflict="user_id").execute()

    # Handle invite token — link athlete to coach
    if body.invite_token:
        invite_result = (
            await supabase.table("invitations")
            .select("*")
            .eq("token", str(body.invite_token))
            .eq("status", "pending")
            .limit(1)
            .execute()
        )
        if invite_result.data:
            invite = invite_result.data[0]
            await supabase.table("coach_athletes").insert(
                {
                    "coach_id": invite["coach_id"],
                    "athlete_id": user_id,
                    "status": "active",
                }
            ).execute()
            await supabase.table("invitations").update({"status": "accepted"}).eq("id", invite["id"]).execute()

    return {"success": True, "role": role, "ai_enabled": ai_enabled}
