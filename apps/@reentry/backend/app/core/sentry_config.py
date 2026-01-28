import logging

import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration

from app.core.config import settings


def setup_sentry() -> None:
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENV_NAME,
            traces_sample_rate=1.0,
            # profile 25% of transactions
            profiles_sample_rate=0.25,
            enable_logs=True,
            integrations=[
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=None,  # Don't send events via LoggingIntegration (structlog-sentry handles this)
                ),
            ],
        )
