"""FastAPI application factory and setup."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .lib.supabase_client import close_supabase_client
from .routers import health, ai, diet, goals, knowledge, auth, invitations
from .workout.router import router as workout_router
from app.services.graph_rag import build_graph

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events (startup/shutdown)."""
    logger.info("bw-tracker backend starting up...")
    app.state.graph_rag = build_graph()
    logger.info("Graph RAG workflow initialized")
    yield
    logger.info("bw-tracker backend shutting down...")
    await close_supabase_client()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title="bw-tracker API",
        description="Backend for bw-tracker fitness app",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS configuration
    if settings.debug:
        # In development, allow all origins
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=False,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=["*"],
        )
    else:
        # In production, be restrictive
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                settings.frontend_url,
            ],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=["*"],
        )

    # Include routers
    app.include_router(health.router)
    app.include_router(ai.router)
    app.include_router(diet.router)
    app.include_router(goals.router)
    app.include_router(knowledge.router)
    app.include_router(auth.router)
    app.include_router(invitations.router)
    app.include_router(workout_router)

    # Global exception handler for HTTPException
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Log and format all unhandled exceptions."""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "status_code": 500,
            },
        )

    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "service": "bw-tracker backend",
            "version": "0.1.0",
            "health": "/health",
        }

    return app


# Create the app instance for ASGI servers (Uvicorn, Vercel, etc.)
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
