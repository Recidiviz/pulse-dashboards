import io
import json

import google.auth.exceptions
import structlog
from google.auth import default
from google.oauth2 import service_account

from app.core.config import settings

logger = structlog.get_logger(__name__)


def get_credentials():
    credentials = None

    try:
        # Prefer the service account JSON provided via environment variable
        if settings.GCP_SERVICE_ACCOUNT_CREDENTIALS:
            logger.info("Loading service account credentials from environment variable")
            credentials = service_account.Credentials.from_service_account_info(
                json.loads(settings.GCP_SERVICE_ACCOUNT_CREDENTIALS)
            )

        else:
            # Fall back to Application Default Credentials
            logger.info(
                "GCP_SERVICE_ACCOUNT_CREDENTIALS not set; "
                "falling back to Application Default Credentials (ADC)"
            )
            credentials, _ = default()

    except ValueError as e:
        logger.error(f"Invalid service account credentials format: {e}")
        raise
    except google.auth.exceptions.DefaultCredentialsError as e:
        logger.error(f"No credentials found. Please set up authentication: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error loading credentials: {e}")
        raise

    # Log the resolved credential info
    if hasattr(credentials, "service_account_email"):
        logger.info(f"Resolved to service account: {credentials.service_account_email}")
    else:
        logger.info(f"Resolved to credentials type: {type(credentials).__name__}")

    return credentials


def get_gcs_token_service_file():
    """Value for ``gcloud.aio.auth.Token(service_file=...)``.

    Returns an in-memory JSON stream when ``GCP_SERVICE_ACCOUNT_CREDENTIALS`` is
    set, otherwise ``None`` so the Token falls back to Application Default
    Credentials.
    """
    raw = settings.GCP_SERVICE_ACCOUNT_CREDENTIALS
    return io.StringIO(raw) if raw else None
