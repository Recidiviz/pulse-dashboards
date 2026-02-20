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
    ActionPlanPromptsConfig,
    IntakeSummaryConfigFile,
    IntakeSummaryPromptsConfig,
)
from app.core.db import AsyncSession
from app.crud.config_management import get_active_output_config
from app.schemas.config_management import (
    TemplateFieldSchema,
    TemplateVariableSchemaResponse,
    ValidationResult,
)
from app.utils.template_formatter import extract_template_variables

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

        # Step 4: Check template variables against schema
        schema_warnings = ValidationService._check_template_variables_against_schema(
            config
        )
        warnings.extend(schema_warnings)

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

    @staticmethod
    def _check_template_variables_against_schema(
        config: Union[IntakeSummaryConfigFile, ActionPlanConfigFile],
    ) -> list[str]:
        """
        Check if config templates use only variables declared in schema.

        This validates that:
        1. Templates only use variables declared as available in the schema
        2. Templates include all variables declared as required

        Args:
            config: Validated config file object

        Returns:
            List of warning messages for schema violations
        """
        warnings = []

        # Get the prompts config
        prompts = config.prompts

        # Iterate through all prompt fields
        for field_name, field_info in prompts.model_fields.items():
            # Skip if no json_schema_extra defined
            if not field_info.json_schema_extra:
                continue

            # Get declared variables from schema
            available_vars = set(
                field_info.json_schema_extra.get("available_variables", [])
            )
            required_vars = set(
                field_info.json_schema_extra.get("required_variables", [])
            )

            # Get actual template string
            template = getattr(prompts, field_name)

            # Extract variables used in template
            used_vars = extract_template_variables(template)

            # Check for undeclared variables (possible typos or missing schema updates)
            undeclared = used_vars - available_vars
            if undeclared:
                undeclared_str = ", ".join(sorted(undeclared))
                available_str = ", ".join(sorted(available_vars))
                warnings.append(
                    f"Field 'prompts.{field_name}' uses undeclared variables: {undeclared_str}. "
                    f"Available variables: {available_str}. "
                    "This might be a typo or the schema may need updating."
                )

            # Check for missing required variables
            missing_required = required_vars - used_vars
            if missing_required:
                missing_str = ", ".join(sorted(missing_required))
                warnings.append(
                    f"Field 'prompts.{field_name}' is missing required variables: {missing_str}. "
                    "The template may not work correctly at runtime."
                )

            # Check for unused optional variables (helps users discover available variables)
            optional_vars = available_vars - required_vars
            unused_optional = optional_vars - used_vars
            if unused_optional:
                unused_str = ", ".join(sorted(unused_optional))
                warnings.append(
                    f"Info: Field 'prompts.{field_name}' has optional variables available but not used: {unused_str}. "
                    "Consider using them to enhance your template, or ignore this if not needed."
                )

        return warnings

    @staticmethod
    def get_template_variable_schema(
        output_type: str,
    ) -> TemplateVariableSchemaResponse:
        """
        Get the complete template variable schema for an output type.

        This extracts all template fields with their available and required variables
        from the Pydantic schema, providing documentation for users creating configs.

        Args:
            output_type: Output type ("action_plan" or "intake_summary")

        Returns:
            TemplateVariableSchemaResponse with all fields and their variables

        Raises:
            ValueError: If output_type is not recognized
        """
        # Get the appropriate prompts config class
        if output_type == "action_plan":
            prompts_class = ActionPlanPromptsConfig
        elif output_type == "intake_summary":
            prompts_class = IntakeSummaryPromptsConfig
        else:
            raise ValueError(
                f"Unknown output_type: {output_type}. "
                "Must be 'action_plan' or 'intake_summary'"
            )

        # Extract schema information from all fields
        fields = []
        for field_name, field_info in prompts_class.model_fields.items():
            # Get json_schema_extra
            schema_extra = field_info.json_schema_extra or {}

            # Extract variables
            available_vars = schema_extra.get("available_variables", [])
            required_vars = schema_extra.get("required_variables", [])

            # Get description
            description = field_info.description or f"Template field: {field_name}"

            fields.append(
                TemplateFieldSchema(
                    field_name=field_name,
                    description=description,
                    available_variables=available_vars,
                    required_variables=required_vars,
                )
            )

        return TemplateVariableSchemaResponse(output_type=output_type, fields=fields)
