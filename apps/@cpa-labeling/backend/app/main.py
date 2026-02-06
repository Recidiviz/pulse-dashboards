"""Standalone labeling backend FastAPI application."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.routes.labeling import router as labeling_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    await init_db()
    yield
    # Shutdown (nothing to clean up)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Labeling API",
        description="Standalone API for labeling @reentry outputs",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    # Include labeling routes
    app.include_router(labeling_router, prefix="/api/labeling", tags=["labeling"])

    # Serve static frontend files (if they exist)
    static_dir = Path(__file__).parent.parent / "static"
    if static_dir.exists():
        # Mount static assets (JS, CSS, images, etc.)
        app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

        # Catch-all route to serve index.html for client-side routing
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            """Serve the SPA for all non-API routes."""
            # If it's an API route, let FastAPI handle 404
            if full_path.startswith("api/"):
                return {"detail": "Not Found"}

            # For all other routes, serve index.html (SPA routing)
            index_file = static_dir / "index.html"
            if index_file.exists():
                return FileResponse(index_file)
            return {"detail": "Frontend not built"}

    return app


app = create_app()
