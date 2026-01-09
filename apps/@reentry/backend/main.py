import importlib
import logging
from contextlib import asynccontextmanager

import redis.asyncio as redis
import structlog
import taskiq_fastapi
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_pagination import add_pagination
from fastapi_pagination.utils import disable_installed_extensions_check
from prometheus_fastapi_instrumentator import Instrumentator

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
    assessment_config_router,
    assessment_router,
    assessment_tree_router,
    autocomplete_router,
    client_router,
    decision_tree_router,
    execution_router,
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
        print(f"Failed to connect to Redis: {str(e)}")
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
setup_sentry()

app = FastAPI(root_path="/api", lifespan=lifespan)
ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS.split(",")
print(f"Processed ALLOWED_ORIGINS: {ALLOWED_ORIGINS}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
]

auth0_config = get_auth0_config()
setup_auth(
    app,
    auth0_config,
    exclude_paths=exclude_paths,
    use_middleware=settings.ENABLE_AUTH_MIDDLEWARE,
)


# Setup client authentication middleware
setup_client_auth(
    app,
    include_paths=["/external", "/intake/services"],
)

# Mount Socket.IO application
app.mount("/socket.io", socket_app)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# taskiq_fastapi
taskiq_fastapi.init(broker, "main:app")

# Include routers
# Internal routers with prefixes - require authentication
app.include_router(decision_tree_router.router, prefix="/decision-trees")
app.include_router(assessment_tree_router.router, prefix="/assessment-trees")
app.include_router(assessment_config_router.router, prefix="/assessment-configs")
app.include_router(assessment_router.router, prefix="/assessments")
app.include_router(execution_router.router, prefix="/executions")
app.include_router(intake_services_router.router, prefix="/intake/services")
app.include_router(client_router.router, prefix="/clients")
app.include_router(intake_admin_router.router, prefix="/intake/admin")
app.include_router(recording_session_router.router, prefix="/recordings")
app.include_router(transcription_router.router, prefix="/transcription")

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
    "app.tasks.assessment",
]
for task in tasks:
    importlib.import_module(task)
