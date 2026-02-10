"""Validation service for config management.

This module provides YAML validation using existing file loaders.
"""

from typing import Union

import structlog
import yaml
from pydantic import ValidationError

from app.core.data_config.assessment_configs.assessment_config import (
    AssessmentConfigFile,
)
from app.core.data_config.assessment_configs.loader import AssessmentFileLoader
from app.core.data_config.output_configs.loader import OutputFileLoader
from app.core.data_config.output_configs.output_config import (
    ActionPlanConfigFile,
    IntakeSummaryConfigFile,
)
from app.core.db import AsyncSession
from app.crud.config_management import get_active_output_config
from app.schemas.config_management import ValidationResult

logger = structlog.get_logger(__name__)


class ValidationService:
    """Service for validating config YAML content."""

    @staticmethod
    def validate_assessment_yaml(yaml_content: str) -> ValidationResult:
        """
        Validate assessment config YAML content.

        Args:
            yaml_content: Raw YAML content string

        Returns:
            ValidationResult with valid flag and any errors/warnings
        """
        errors = []
        warnings = []

        # Step 1: Parse YAML
        try:
            yaml.safe_load(yaml_content)
        except yaml.YAMLError as e:
            return ValidationResult(
                valid=False,
                errors=[f"Invalid YAML syntax: {str(e)}"],
                warnings=[],
            )

        # Step 2: Validate against schema
        try:
            config = AssessmentFileLoader.validate_yaml_content(yaml_content)
        except ValidationError as e:
            error_messages = []
            for error in e.errors():
                loc = " -> ".join(str(x) for x in error["loc"])
                error_messages.append(f"{loc}: {error['msg']}")
            return ValidationResult(
                valid=False,
                errors=error_messages,
                warnings=[],
            )
        except Exception as e:
            return ValidationResult(
                valid=False,
                errors=[f"Validation error: {str(e)}"],
                warnings=[],
            )

        # Step 3: Check for common issues (warnings)
        if not config.metadata.description:
            warnings.append("Config has no description")

        logger.info(
            "Assessment YAML validation passed",
            state_code=config.metadata.state_code,
            code=config.metadata.code,
            version=config.metadata.version,
        )

        return ValidationResult(
            valid=True,
            errors=errors,
            warnings=warnings,
        )

    @staticmethod
    def validate_output_yaml(yaml_content: str) -> ValidationResult:
        """
        Validate output config YAML content.

        Args:
            yaml_content: Raw YAML content string

        Returns:
            ValidationResult with valid flag and any errors/warnings
        """
        errors = []
        warnings = []

        # Step 1: Parse YAML
        try:
            yaml.safe_load(yaml_content)
        except yaml.YAMLError as e:
            return ValidationResult(
                valid=False,
                errors=[f"Invalid YAML syntax: {str(e)}"],
                warnings=[],
            )

        # Step 2: Validate against schema
        try:
            config = OutputFileLoader.validate_yaml_content(yaml_content)
        except ValidationError as e:
            error_messages = []
            for error in e.errors():
                loc = " -> ".join(str(x) for x in error["loc"])
                error_messages.append(f"{loc}: {error['msg']}")
            return ValidationResult(
                valid=False,
                errors=error_messages,
                warnings=[],
            )
        except ValueError as e:
            return ValidationResult(
                valid=False,
                errors=[str(e)],
                warnings=[],
            )
        except Exception as e:
            return ValidationResult(
                valid=False,
                errors=[f"Validation error: {str(e)}"],
                warnings=[],
            )

        # Step 3: Check for common issues (warnings)
        if not config.metadata.description:
            warnings.append("Config has no description")

        logger.info(
            "Output YAML validation passed",
            code=config.metadata.code,
            version=config.metadata.version,
            output_type=config.metadata.output_type,
        )

        return ValidationResult(
            valid=True,
            errors=errors,
            warnings=warnings,
        )

    @staticmethod
    async def validate_output_references(
        session: AsyncSession,
        output_codes: list[str],
    ) -> tuple[list[str], list[str]]:
        """
        Validate that output configs exist in the database for the given codes.

        Args:
            session: Database session
            output_codes: List of output config codes to validate

        Returns:
            Tuple of (found_codes, missing_codes)
        """
        found = []
        missing = []

        for code in output_codes:
            config = await get_active_output_config(session, code)
            if config:
                found.append(code)
            else:
                missing.append(code)

        return found, missing

    @staticmethod
    def parse_assessment_yaml(yaml_content: str) -> AssessmentConfigFile | None:
        """
        Parse and return the validated assessment config model.

        Args:
            yaml_content: Raw YAML content string

        Returns:
            AssessmentConfigFile if valid, None otherwise
        """
        try:
            return AssessmentFileLoader.validate_yaml_content(yaml_content)
        except Exception:
            return None

    @staticmethod
    def parse_output_yaml(
        yaml_content: str,
    ) -> Union[IntakeSummaryConfigFile, ActionPlanConfigFile] | None:
        """
        Parse and return the validated output config model.

        Args:
            yaml_content: Raw YAML content string

        Returns:
            OutputConfigFile if valid, None otherwise
        """
        try:
            return OutputFileLoader.validate_yaml_content(yaml_content)
        except Exception:
            return None
