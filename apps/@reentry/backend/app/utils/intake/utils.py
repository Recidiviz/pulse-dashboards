"""
Consolidated utility functions for intake assessment system.
"""

import json
import logging
import traceback
from pathlib import Path

from app.core.data_config.intakesections.constants import (
    DEFAULT_INTAKE_TYPE,
    SUPPORTED_INTAKE_NAMES,
)
from app.utils.intake.schemas import (
    ErrorInfo,
)

logger = logging.getLogger(__name__)

# Constants
MAX_UNCLEAR_RESPONSES = 2


PROJECT_ROOT = Path(__file__).parent.parent.parent.parent


# Configure logging
logger = logging.getLogger(__name__)


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


def get_intake_name_by_state(state_code: str):
    try:
        with open(
            f"{PROJECT_ROOT}/app/core/data_config/config_by_state.json",
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)
        logger.info(f"Looking for intake name for : {state_code}")
        state_info = data.get(state_code)

        if state_info and isinstance(state_info, dict):
            intake_name = state_info.get("intake_name", DEFAULT_INTAKE_TYPE)

            if intake_name in SUPPORTED_INTAKE_NAMES:
                return intake_name
            else:
                logger.info(f"No assessment_type found for state {state_code}")
                logger.info(f"Returning default inatke type: {DEFAULT_INTAKE_TYPE}")
                return DEFAULT_INTAKE_TYPE
        else:
            logger.info(f"State {state_code} not found in configuration file")
            logger.info(f"Returning default assessment types: {DEFAULT_INTAKE_TYPE}")
            return DEFAULT_INTAKE_TYPE

    except FileNotFoundError:
        logger.info("Configuration file 'config_by_state.json' not found")
        logger.info(f"Returning default assessment types: {DEFAULT_INTAKE_TYPE}")
        return DEFAULT_INTAKE_TYPE
    except json.JSONDecodeError as e:
        logger.info(f"Error parsing JSON file: {e}")
        logger.info(f"Returning default assessment types: {DEFAULT_INTAKE_TYPE}")
        return DEFAULT_INTAKE_TYPE
    except Exception as e:
        logger.info(f"Unexpected error: {e}")
        logger.info(f"Returning default assessment types: {DEFAULT_INTAKE_TYPE}")
        return DEFAULT_INTAKE_TYPE
