import logging
from enum import Enum

import sentry_sdk
import structlog
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from app.core.config import settings

logger = structlog.get_logger(__name__)


class SentryEnvironment(str, Enum):
    DEMO = "demo"
    DEV = "dev"
    DEVELOPMENT = "development"
    LOCAL_DEVELOPMENT = "local-development"
    PILOT = "pilot"
    PROD = "prod"
    STAGING = "staging"


class SampleRateType(str, Enum):
    TRACES = "traces"
    PROFILES = "profiles"


# The profiles_sample_rate setting is relative to the traces_sample_rate setting.
# https://docs.sentry.io/platforms/python/profiling/
SAMPLE_RATES: dict[SentryEnvironment, dict[SampleRateType, float]] = {
    SentryEnvironment.DEV: {
        SampleRateType.TRACES: 1.0,
        SampleRateType.PROFILES: 1.0,
    },
    SentryEnvironment.DEMO: {
        SampleRateType.TRACES: 1.0,
        SampleRateType.PROFILES: 1.0,
    },
    SentryEnvironment.DEVELOPMENT: {
        SampleRateType.TRACES: 1.0,
        SampleRateType.PROFILES: 1.0,
    },
    SentryEnvironment.LOCAL_DEVELOPMENT: {
        SampleRateType.TRACES: 1.0,
        SampleRateType.PROFILES: 1.0,
    },
    SentryEnvironment.PILOT: {
        SampleRateType.TRACES: 1.0,
        SampleRateType.PROFILES: 1.0,
    },
    SentryEnvironment.STAGING: {
        SampleRateType.TRACES: 1.0,
        SampleRateType.PROFILES: 0.5,
    },
    SentryEnvironment.PROD: {
        SampleRateType.TRACES: 0.5,
        SampleRateType.PROFILES: 0.2,
    },
}


def get_sample_rates() -> dict[SampleRateType, float]:
    try:
        env = SentryEnvironment(settings.ENV_NAME.lower())
    except (ValueError, KeyError) as exception:
        logger.error(
            "Unknown environment name for Sentry configuration, falling back to DEV sample rates",
            exception=exception,
            env_name=settings.ENV_NAME,
            available_environments=[e.value for e in SentryEnvironment],
        )
        env = SentryEnvironment.DEV

    return SAMPLE_RATES[env]


def setup_sentry() -> None:
    if settings.SENTRY_DSN:
        env_rates = get_sample_rates()

        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENV_NAME,
            traces_sample_rate=env_rates[SampleRateType.TRACES],
            profiles_sample_rate=env_rates[SampleRateType.PROFILES],
            enable_logs=True,
            integrations=[
                # FastAPI/Starlette - Monitor HTTP requests and responses
                StarletteIntegration(
                    transaction_style="endpoint",
                ),
                FastApiIntegration(
                    transaction_style="endpoint",
                ),
                # Database query monitoring
                SqlalchemyIntegration(),
                # Redis command monitoring
                RedisIntegration(),
                # Logging - breadcrumbs only (structlog-sentry handles events)
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=None,  # Don't send events via LoggingIntegration (structlog-sentry handles this)
                ),
            ],
        )
