import importlib
from contextlib import asynccontextmanager

import firebase_admin
import redis.asyncio as redis
import structlog
import taskiq_fastapi
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_pagination import add_pagination
from fastapi_pagination.utils import disable_installed_extensions_check
from prometheus_fastapi_instrumentator import Instrumentator
from starlette.middleware.base import BaseHTTPMiddleware

import app.models.ai_persona  # noqa
import app.models.assessment  # noqa
import app.models.assessment_tree  # noqa
import app.models.decision_tree  # noqa
import app.models.execution  # noqa
import app.models.intake  # noqa
import app.models.models  # noqa
import app.models.plan_decision_tree  # noqa
import app.models.recording  # noqa
from app.auth.auth_core import get_auth0_config, setup_auth
from app.auth.intake.auth_client_user import setup_client_auth
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.sentry_config import setup_sentry
from app.routes import (
    ai_persona_router,
    assessment_config_router,
    autocomplete_router,
    client_router,
    config_management_router,
    decision_tree_router,
    execution_router,
    impersonation_router,
    intake_admin_router,
    intake_auth_router,
    intake_client_router,
    intake_config_public_router,
    intake_services_router,
    plan_decision_tree_router,
    plan_router,
    recording_session_router,
    resources_router,
    transcription_router,
    webhook_router,
)
from app.tasks.base import broker
from app.utils.intake.socket_manager import intake_setup_background_tasks, socket_app
from app.utils.PrometheusBackgroundThreadManager import (
    PrometheusBackgroundThreadManager,
)

logger = structlog.get_logger(__name__)

# Setup metrics
metrics_manager = None


async def init_redis():
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        await redis_client.ping()
        return redis_client
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Broker startup
        if not broker.is_worker_process:
            await broker.startup()

        # No longer needed - OMS replaced with BigQuery

        # Metrics setup
        global metrics_manager
        redis_client = await init_redis()
        if redis_client is not None:
            app.state.redis_client = redis_client

            metrics_manager = PrometheusBackgroundThreadManager(redis_client)
            success = await metrics_manager.start()
            if not success:
                logger.error(
                    "Failed to start the background task for Prometheus metrics."
                )
        else:
            logger.warning(
                "Redis is not available. The metrics task will not be started."
            )

        if redis_client is not None:
            # Intake background task
            try:
                await intake_setup_background_tasks(redis_client)
            except Exception as e:
                logger.error(f"Failed to setup intake background tasks: {e}")

        yield
        if not broker.is_worker_process:
            logger.info("Shutting down broker")
            await broker.shutdown()

    except Exception as e:
        logger.error(f"Error during application startup: {e}")
        raise
    finally:
        if metrics_manager:
            await metrics_manager.stop()


setup_logging()
if settings.ENV_NAME != "pytest":
    setup_sentry()

app = FastAPI(root_path="/api", lifespan=lifespan)


# Auth0 setup
exclude_paths = [
    "/docs",
    "/redoc",
    "/api/openapi.json",
    "/openapi.json",
    "/api/docs",
    "/health",
    "/login",
    "/metrics",
    "/external/",
    "/public/",
    "/autocomplete-city",
    "/autocomplete-address",
    "/webhooks/deepgram/transcription",
    "/intake/services",
    "/socket.io",
]

auth0_config = get_auth0_config()
setup_auth(
    app,
    auth0_config,
    exclude_paths=exclude_paths,
    use_middleware=settings.ENABLE_AUTH_MIDDLEWARE,
)


# ErrorHandlingMiddleware catches unhandled exceptions and returns a 500 JSON
# response.
#
# Note: @app.exception_handler(Exception) does not work here because Starlette
# routes Exception (and HTTP 500) handlers to ServerErrorMiddleware, which sits
# above all user middleware.
#
# Note: BaseHTTPMiddleware does not support streaming responses (it buffers the full body).
class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            logger.exception(f"Unhandled exception: {exc}")

            error_text = "Internal server error."
            if settings.ENV_NAME != "prod":
                error_text += f" Error: {str(exc)}"
            content = {"detail": error_text}

            return JSONResponse(status_code=500, content=content)


app.add_middleware(ErrorHandlingMiddleware)


setup_client_auth(
    app,
    include_paths=["/external", "/intake/services"],
)

# CORSMiddleware must be the last added middleware,
# so all responses get CORS headers.
ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS.split(",")
logger.info(f"Processed ALLOWED_ORIGINS: {ALLOWED_ORIGINS}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Mount Socket.IO application
app.mount("/socket.io", socket_app)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# taskiq_fastapi
taskiq_fastapi.init(broker, "main:app")

# Firebase Admin SDK
# Initialize it at the top-level, so that it's only initialized once
firebase_app = firebase_admin.initialize_app(
    options={"projectId": settings.FIREBASE_ADMIN_PROJECT_ID}
)

# Include routers
# Internal routers with prefixes - require authentication
app.include_router(ai_persona_router.router)
app.include_router(decision_tree_router.router, prefix="/decision-trees")
app.include_router(assessment_config_router.router, prefix="/assessment-configs")
app.include_router(config_management_router.router, prefix="/config-management")
app.include_router(execution_router.router, prefix="/executions")
app.include_router(intake_services_router.router, prefix="/intake/services")
app.include_router(client_router.router, prefix="/clients")
app.include_router(intake_admin_router.router, prefix="/intake/admin")
app.include_router(recording_session_router.router, prefix="/recordings")
app.include_router(transcription_router.router, prefix="/transcription")
app.include_router(impersonation_router.router, prefix="/impersonate")

# External routers -- no auth required
app.include_router(intake_auth_router.router, prefix="/external/client/verify")
app.include_router(autocomplete_router.router, prefix="/autocomplete")
app.include_router(webhook_router.router, prefix="/webhooks")

# Public routers -- no auth required
app.include_router(intake_config_public_router.router, prefix="/public/intake-config")

# Authenticated client endpoints
app.include_router(intake_client_router.router, prefix="/external/client")


# Internal routers fallthoughs - require authentication
app.include_router(plan_router.router)
app.include_router(plan_decision_tree_router.router)
app.include_router(resources_router.router)


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Add pagination
disable_installed_extensions_check()
add_pagination(app)

# Import tasks
tasks = [
    "app.tasks.plan_decision_tree",
    "app.tasks.plan_create",
    "app.tasks.action_plan",
    "app.tasks.ai_intake",
]
for task in tasks:
    importlib.import_module(task)
