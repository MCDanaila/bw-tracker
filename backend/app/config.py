"""Configuration management using Pydantic settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = ""  # Optional, for fallback

    # External APIs
    gemini_api_key: str

    # Frontend
    frontend_url: str = "http://localhost:3000"

    # Rate limiting
    rate_limit_max: int = 10
    rate_limit_window_seconds: int = 3600

    # Environment
    environment: str = "development"
    debug: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()
