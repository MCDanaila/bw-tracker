"""Authentication and authorization dependencies."""

import logging
from typing import Annotated
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Header
from supabase import AsyncClient

# Import clients from lib
from app.lib.supabase_client import create_user_client

logger = logging.getLogger(__name__)


@dataclass
class CurrentUser:
    """Authenticated user from Supabase."""
    id: str  # Supabase auth.users UUID
    role: str  # 'athlete' | 'self_coached' | 'coach'
    email: str | None = None


async def get_user_supabase(
    authorization: str = Header(None),
) -> AsyncClient:
    """
    Get a Supabase client configured for the current user's session.
    Expects: Authorization: Bearer <jwt_token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ")

    try:
        client = await create_user_client(token)
        return client
    except Exception as e:
        logger.error(f"Failed to initialize user client: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_current_user(
    supabase: AsyncClient = Depends(get_user_supabase),
) -> CurrentUser:
    """
    Verify Supabase JWT through the Auth API and return current user.
    """
    try:
        # Calling get_user without arguments uses the session token
        user_response = await supabase.auth.get_user()
        user = user_response.user
    except Exception as e:
        logger.warning(f"JWT verification failed via Supabase: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    role = user.app_metadata.get("role", "athlete") if user.app_metadata else "athlete"

    return CurrentUser(
        id=str(user.id),
        role=role,
        email=user.email,
    )


def require_role(*allowed_roles: str):
    """
    Dependency factory that checks if user has one of the allowed roles.

    Usage:
        @router.post("/coach-only")
        async def coach_only(user: CurrentUser = Depends(require_role("coach"))):
            ...
    """

    async def _check_role(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required: {', '.join(allowed_roles)}",
            )
        return user

    return _check_role


# Dependency Annotations for cleaner Router signatures
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
CoachDep = Annotated[CurrentUser, Depends(require_role("coach"))]
SelfCoachedDep = Annotated[CurrentUser, Depends(require_role("coach", "self_coached"))]
UserSupabaseDep = Annotated[AsyncClient, Depends(get_user_supabase)]
