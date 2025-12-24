from datetime import datetime

import pytest
import sentry_sdk

from app.core.config import settings


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
