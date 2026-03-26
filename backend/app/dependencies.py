"""Authentication and authorization dependencies."""

import logging
from typing import Annotated
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
import httpx

from .config import settings

logger = logging.getLogger(__name__)

# Cache JWKS keys with TTL
_jwks_cache: dict | None = None
_jwks_cache_time: float = 0


@dataclass
class CurrentUser:
    """Authenticated user from JWT token."""

    id: str  # Supabase auth.users UUID
    role: str  # 'athlete' | 'self_coached' | 'coach'
    email: str | None = None


async def _get_jwks_keys() -> dict:
    """Fetch and cache Supabase JWKS public keys."""
    global _jwks_cache, _jwks_cache_time
    import time

    # Cache for 1 hour
    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < 3600:
        return _jwks_cache

    try:
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, timeout=10)
            response.raise_for_status()
            _jwks_cache = response.json()
            _jwks_cache_time = now
            return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch JWKS: {e}")
        raise HTTPException(status_code=500, detail="Auth service unavailable")


def _get_signing_key(kid: str) -> str | None:
    """Extract signing key from JWKS by key ID."""
    if not _jwks_cache:
        return None
    for key in _jwks_cache.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


async def get_current_user(
    authorization: str = Header(None),
) -> CurrentUser:
    """
    Verify Supabase JWT and return current user.

    Expects: Authorization: Bearer <jwt_token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ")

    try:
        # Decode header to get kid (key ID)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Fetch JWKS
        jwks = await _get_jwks_keys()

        # Find the key and build jwks_client
        from jose.backends.rsa_backend import RSAKey

        rsa_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = RSAKey.construct(key)
                break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token signature")

        # Verify and decode JWT
        claims = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience="authenticated",
        )

    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

    # Extract user info
    user_id = claims.get("sub")
    email = claims.get("email")
    role = claims.get("app_metadata", {}).get("role", "athlete")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: no user ID")

    return CurrentUser(id=user_id, role=role, email=email)


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


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
CoachDep = Annotated[CurrentUser, Depends(require_role("coach"))]
SelfCoachedDep = Annotated[CurrentUser, Depends(require_role("coach", "self_coached"))]
