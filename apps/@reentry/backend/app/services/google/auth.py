import structlog
from pathlib import Path

import google.auth.exceptions
from google.auth import default
from google.oauth2 import service_account

logger = structlog.get_logger(__name__)

# Default service account file path (relative to this file)
DEFAULT_CREDENTIALS_RELATIVE_PATH = "../../../.secrets/gcp-service-account.json"
DEFAULT_CREDENTIALS_PATH = str(
    (Path(__file__).parent / DEFAULT_CREDENTIALS_RELATIVE_PATH).resolve()
)


def get_credentials(
    credentials_path: str = DEFAULT_CREDENTIALS_PATH,
):
    key_path = Path(credentials_path).resolve()
    credentials = None

    try:
        # Try to use service account file if it exists
        if key_path.exists():
            logger.info(f"Service account key file found at: {key_path}")
            credentials = service_account.Credentials.from_service_account_file(
                str(key_path)
            )

        else:
            # Fall back to Application Default Credentials
            logger.info(f"Service account key file not found at: {key_path}")
            logger.info("Falling back to Application Default Credentials (ADC)")
            credentials, _ = default()

    except ValueError as e:
        logger.error(f"Invalid service account file format: {e}")
        raise
    except OSError as e:
        logger.error(f"Error reading service account file: {e}")
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
