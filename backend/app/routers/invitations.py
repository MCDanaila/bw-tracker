"""Invitation management endpoints."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..dependencies import CoachDep, CurrentUserDep
from ..lib.supabase_client import get_service_client
from ..schemas.auth import InvitationAcceptRequest, InvitationSendRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/invitations", tags=["invitations"])

PLAN_ATHLETE_LIMITS = {"coach": 5, "coach_pro": 25}


@router.post("/send")
async def send_invitation(body: InvitationSendRequest, current_user: CoachDep):
    """Coach only. Create an invitation and send email to the athlete."""
    supabase = await get_service_client()

    # Fetch coach profile to get plan and display name
    coach_result = await supabase.table("profiles").select("plan, full_name").eq("id", current_user.id).limit(1).execute()
    if not coach_result.data:
        raise HTTPException(status_code=404, detail="Coach profile not found")

    coach_profile = coach_result.data[0]
    coach_plan = coach_profile.get("plan", "coach")

    if coach_plan not in PLAN_ATHLETE_LIMITS:
        raise HTTPException(status_code=403, detail="Your plan does not support managing athletes")

    limit = PLAN_ATHLETE_LIMITS[coach_plan]

    # Count active athletes + pending invitations for this coach
    active_result = (
        await supabase.table("coach_athletes")
        .select("id", count="exact")
        .eq("coach_id", current_user.id)
        .eq("status", "active")
        .execute()
    )
    pending_result = (
        await supabase.table("invitations")
        .select("id", count="exact")
        .eq("coach_id", current_user.id)
        .eq("status", "pending")
        .execute()
    )

    active_count = active_result.count or 0
    pending_count = pending_result.count or 0

    if (active_count + pending_count) >= limit:
        raise HTTPException(status_code=403, detail="Athlete limit reached for your plan")

    # Insert invitation row (token and expires_at use DB defaults)
    insert_result = (
        await supabase.table("invitations")
        .insert(
            {
                "coach_id": current_user.id,
                "invitee_email": body.athlete_email,
            }
        )
        .execute()
    )

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to create invitation")

    invitation = insert_result.data[0]

    # Send invite email via Supabase Auth built-in SMTP
    coach_name = coach_profile.get("full_name") or current_user.email or "Your coach"
    try:
        await supabase.auth.admin.invite_user_by_email(
            body.athlete_email,
            options={
                "data": {
                    "invite_token": str(invitation["token"]),
                    "coach_name": coach_name,
                },
                "redirect_to": f"https://app.leonida.com/register?invite={invitation['token']}",
            },
        )
    except Exception as exc:
        logger.warning("Failed to send invitation email: %s", exc)
        # Non-fatal: invitation row already created; coach can resend manually

    return {
        "invitation_id": invitation["id"],
        "expires_at": invitation["expires_at"],
    }


@router.get("/{token}")
async def get_invitation(token: str):
    """Public. Returns invitation details by token, or 404/410."""
    supabase = await get_service_client()

    result = (
        await supabase.table("invitations")
        .select("*, profiles!coach_id(full_name)")
        .eq("token", token)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation = result.data[0]

    # Auto-expire if past expires_at and still pending
    if invitation["status"] == "pending":
        expires_at = datetime.fromisoformat(invitation["expires_at"].replace("Z", "+00:00"))
        if expires_at < datetime.now(timezone.utc):
            await supabase.table("invitations").update({"status": "expired"}).eq("id", invitation["id"]).execute()
            invitation["status"] = "expired"

    if invitation["status"] in ("expired", "cancelled", "accepted"):
        raise HTTPException(status_code=410, detail=f"Invitation is {invitation['status']}")

    coach_name = None
    if invitation.get("profiles"):
        coach_name = invitation["profiles"].get("full_name")

    return {
        "coach_name": coach_name,
        "invitee_email": invitation["invitee_email"],
        "status": invitation["status"],
        "expires_at": invitation["expires_at"],
    }


@router.get("")
async def list_invitations(current_user: CoachDep):
    """Coach only. Returns all invitations created by this coach."""
    supabase = await get_service_client()

    result = (
        await supabase.table("invitations")
        .select("*")
        .eq("coach_id", current_user.id)
        .order("created_at", desc=True)
        .execute()
    )

    return result.data


@router.delete("/{invitation_id}")
async def cancel_invitation(invitation_id: str, current_user: CoachDep):
    """Coach only. Cancels a pending invitation by setting status='cancelled'."""
    supabase = await get_service_client()

    result = (
        await supabase.table("invitations")
        .select("id, coach_id, status")
        .eq("id", invitation_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation = result.data[0]

    if invitation["coach_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised to cancel this invitation")

    if invitation["status"] != "pending":
        raise HTTPException(status_code=409, detail=f"Cannot cancel invitation with status '{invitation['status']}'")

    await supabase.table("invitations").update({"status": "cancelled"}).eq("id", invitation_id).execute()

    return {"success": True}


@router.post("/accept")
async def accept_invitation(body: InvitationAcceptRequest, current_user: CurrentUserDep):
    """Authenticated existing user accepts a coaching invitation by token."""
    supabase = await get_service_client()

    result = (
        await supabase.table("invitations")
        .select("*")
        .eq("token", str(body.token))
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation = result.data[0]

    # Check expiry
    expires_at = datetime.fromisoformat(invitation["expires_at"].replace("Z", "+00:00"))
    if expires_at < datetime.now(timezone.utc):
        await supabase.table("invitations").update({"status": "expired"}).eq("id", invitation["id"]).execute()
        raise HTTPException(status_code=410, detail="Invitation has expired")

    if invitation["status"] != "pending":
        raise HTTPException(status_code=409, detail=f"Invitation is already {invitation['status']}")

    # Validate invitee email matches current user
    if current_user.email and invitation["invitee_email"].lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="This invitation was sent to a different email address")

    # Only athletes can be coached — query profiles for authoritative role (not JWT app_metadata)
    profile_result = await supabase.table("profiles").select("role").eq("id", current_user.id).limit(1).execute()
    profile_role = profile_result.data[0]["role"] if profile_result.data else "athlete"
    if profile_role != "athlete":
        raise HTTPException(status_code=403, detail="Only users with role 'athlete' can accept coaching invitations")

    await supabase.table("coach_athletes").insert(
        {
            "coach_id": invitation["coach_id"],
            "athlete_id": current_user.id,
            "status": "active",
        }
    ).execute()

    await supabase.table("invitations").update({"status": "accepted"}).eq("id", invitation["id"]).execute()

    return {"success": True}
