"""
Consolidated utility functions for intake assessment system.
"""

import structlog
import traceback
from pathlib import Path

from app.utils.intake.schemas import (
    ErrorInfo,
)

logger = structlog.get_logger(__name__)

# Constants
MAX_UNCLEAR_RESPONSES = 2


PROJECT_ROOT = Path(__file__).parent.parent.parent.parent


def log_error(error_info: ErrorInfo, exc_info=None) -> None:
    """
    Helper method to log errors consistently with traceback.

    Args:
        error_info (ErrorInfo): Dictionary with error details
        exc_info: Exception information if available
    """
    if exc_info:
        logger.error("Traceback:")
        traceback.print_exception(type(exc_info), exc_info, exc_info.__traceback__)
    else:
        logger.error(
            "Traceback information not available (error occurred in another process)"
        )
