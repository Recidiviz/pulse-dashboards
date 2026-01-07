import logging

import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration

from app.core.config import settings


def setup_sentry() -> None:
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENV_NAME,
            profiles_sample_rate=0,
            enable_logs=True,
            integrations=[
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.ERROR,  # Send ERROR+ as events (causes duplicates with structlog)
                    # TODO: Migrate all logging.getLogger() to structlog.get_logger() and set event_level=None
                    # See PR: https://github.com/Recidiviz/pulse-dashboards/pull/11198
                ),
            ],
        )
