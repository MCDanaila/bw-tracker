"""Supabase async client initialization."""

from supabase import AsyncClient, acreate_client
from ..config import settings

_service_client: AsyncClient | None = None


async def get_service_client() -> AsyncClient:
    """Get or create the Supabase async client with SERVICE_ROLE_KEY.
    Use this strictly for admin operations that must bypass RLS.
    """
    global _service_client

    if _service_client is None:
        _service_client = await acreate_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    return _service_client


async def close_supabase_client() -> None:
    """Close the Supabase shared client connection."""
    global _service_client

    if _service_client is not None:
        await _service_client.aclose()
        _service_client = None


async def create_user_client(access_token: str) -> AsyncClient:
    """
    Create an ephemeral Supabase client authenticated for a specific user.
    This ensures Row Level Security (RLS) is applied to all queries.
    """
    client = await acreate_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
    # By setting the session, the Authorization header will use the user's JWT,
    # ensuring that PostgREST enforces the standard RLS policies for that user.
    await client.auth.set_session(access_token, refresh_token="")
    return client
