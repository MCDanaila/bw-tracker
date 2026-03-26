"""WSGI entry point for Vercel deployment."""

from app.main import app

# Vercel uses this as the entrypoint for the serverless function
__all__ = ["app"]
