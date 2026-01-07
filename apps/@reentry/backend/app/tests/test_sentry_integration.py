import logging
from datetime import datetime

import pytest
import sentry_sdk
import structlog

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.sentry_config import setup_sentry


def _raise_test_exception(msg: str) -> str:
    timestamp = datetime.now().isoformat()
    raise ValueError(
        f"Test exception for Sentry integration: Msg: {msg}, Time: {timestamp}"
    )


@pytest.mark.integration
def test_send_sentry_event():
    if not settings.SENTRY_DSN or settings.SENTRY_DSN == "":
        pytest.skip("SENTRY_DSN not configured")

    sentry_sdk.init(dsn=settings.SENTRY_DSN, environment=settings.ENV_NAME)

    client = sentry_sdk.get_client()
    assert client is not None, "Sentry client not initialized"
    assert client.dsn is not None, "Sentry client has no DSN"

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    event_id = sentry_sdk.capture_message(
        f"Test message from pytest, timestamp: {timestamp}"
    )
    assert event_id is not None, "Failed to capture message (no event_id returned)"

    sentry_sdk.flush(timeout=5)

    print("\nSent test message to Sentry")
    print(f"DSN: {settings.SENTRY_DSN}")
    print(f"Environment: {settings.ENV_NAME}")
    print(f"Event ID: {event_id}")


@pytest.mark.integration
def test_logger_exception_sends_error_to_sentry_with_stacktrace():
    if not settings.SENTRY_DSN or settings.SENTRY_DSN == "":
        pytest.skip("SENTRY_DSN not configured")

    setup_sentry()

    client = sentry_sdk.get_client()
    assert client is not None, "Sentry client not initialized"

    logger = logging.getLogger(__name__)

    try:
        _raise_test_exception("Logger from logging")
    except Exception as e:
        logger.exception(f"Error: {e}")

    sentry_sdk.flush(timeout=1)

    print("\nSent error event to Sentry via logger.exception()")
    print(f"DSN: {settings.SENTRY_DSN}")
    print(f"Environment: {settings.ENV_NAME}")
    print(
        "Check Sentry dashboard for this error message at: https://recidiviz-inc.sentry.io"
    )


@pytest.mark.integration
def test_structlog_sends_error_to_sentry_with_stacktrace():
    if not settings.SENTRY_DSN or settings.SENTRY_DSN == "":
        pytest.skip("SENTRY_DSN not configured")

    setup_logging()
    setup_sentry()

    client = sentry_sdk.get_client()
    assert client is not None, "Sentry client not initialized"

    logger = structlog.get_logger(__name__)

    try:
        _raise_test_exception("Logger from structlog")
    except Exception as e:
        logger.exception(
            "Test error with structured data",
            error=e,
            user_id="test-id-1234",
            request_id="test-req-123",
            environment=settings.ENV_NAME,
        )

    sentry_sdk.flush(timeout=1)

    print("Sent error event to Sentry via structlog with structured data")
    print(f"DSN: {settings.SENTRY_DSN}")
    print(f"Environment: {settings.ENV_NAME}")
    print(
        "Check Sentry dashboard for this error message at: https://recidiviz-inc.sentry.io"
    )
