"""Supabase async client initialization."""

from supabase import AsyncClient, acreate_client
from ..config import settings

_client: AsyncClient | None = None


async def get_supabase_client() -> AsyncClient:
    """Get or create the Supabase async client with SERVICE_ROLE_KEY."""
    global _client

    if _client is None:
        _client = await acreate_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    return _client


async def close_supabase_client() -> None:
    """Close the Supabase client connection."""
    global _client

    if _client is not None:
        await _client.aclose()
        _client = None
