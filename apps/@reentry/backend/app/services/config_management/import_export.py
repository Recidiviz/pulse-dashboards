"""Import/Export service for config management.

This module provides functionality for importing configs from YAML files
and exporting configs to YAML format.
"""

import hashlib
import re
from typing import Literal, Optional

import structlog

from app.core.db import AsyncSession
from app.crud.config_management import (
    create_assessment_config,
    create_output_config,
    get_assessment_config_by_version,
    get_latest_assessment_config_version,
    get_latest_output_config_version,
    get_output_config_by_version,
)
from app.models.assessment_config import AssessmentConfig, ConfigStatus
from app.models.output_config import OutputConfig, OutputType
from app.schemas.config_management import ImportResult, ImportValidationResult
from app.services.config_management.validation import ValidationService
from app.utils.string_utils import normalize_state_code_format

logger = structlog.get_logger(__name__)


class ImportExportService:
    """Service for importing and exporting config files."""

    @staticmethod
    def compute_yaml_hash(yaml_content: str) -> str:
        """
        Compute SHA256 hash of YAML content.

        Args:
            yaml_content: YAML content string

        Returns:
            SHA256 hash string (64 characters)
        """
        return hashlib.sha256(yaml_content.encode("utf-8")).hexdigest()

    @staticmethod
    async def validate_assessment_import(
        session: AsyncSession,
        yaml_content: str,
    ) -> ImportValidationResult:
        """
        Validate an assessment config import without saving.

        Args:
            session: Database session
            yaml_content: YAML content to import

        Returns:
            ImportValidationResult with validation details
        """
        errors = []
        warnings = []

        # Step 1: Validate YAML structure
        validation_result = ValidationService.validate_assessment_yaml(yaml_content)
        if not validation_result.valid:
            return ImportValidationResult(
                valid=False,
                errors=validation_result.errors,
                warnings=validation_result.warnings,
            )

        # Step 2: Parse the config
        config = ValidationService.parse_assessment_yaml(yaml_content)
        if not config:
            return ImportValidationResult(
                valid=False,
                errors=["Failed to parse YAML content"],
            )

        state_code = normalize_state_code_format(config.metadata.state_code)
        code = config.metadata.code
        version = config.metadata.version

        # Step 3: Get existing version info first
        latest_version = await get_latest_assessment_config_version(
            session, state_code, code
        )
        existing_version = latest_version if latest_version >= 0 else None

        # Step 4: Check if version already exists
        existing = await get_assessment_config_by_version(
            session, state_code, code, version
        )
        if existing:
            return ImportValidationResult(
                valid=False,
                parsed_config={
                    "state_code": state_code,
                    "code": code,
                    "version": version,
                    "display_name": config.metadata.display_name,
                },
                existing_version=existing_version,
                errors=[
                    f"Version {version} already exists for {state_code}/{code}. "
                    "Please increment the version in your YAML file."
                ],
            )

        # Step 5: Check that version is higher than the current highest
        if existing_version is not None and version <= existing_version:
            return ImportValidationResult(
                valid=False,
                parsed_config={
                    "state_code": state_code,
                    "code": code,
                    "version": version,
                    "display_name": config.metadata.display_name,
                },
                existing_version=existing_version,
                errors=[
                    f"Version {version} is not higher than the current highest version "
                    f"(v{existing_version}) for {state_code}/{code}. "
                    f"Please use a version number greater than {existing_version}."
                ],
            )

        # Step 6: Check output config references
        if hasattr(config, "outputs") and config.outputs.codes:
            found, missing = await ValidationService.validate_output_references(
                session, config.outputs.codes
            )
            if missing:
                errors.append(
                    f"Missing output configs in database: {', '.join(missing)}"
                )

        if errors:
            return ImportValidationResult(
                valid=False,
                parsed_config={
                    "state_code": state_code,
                    "code": code,
                    "version": version,
                    "display_name": config.metadata.display_name,
                },
                existing_version=existing_version,
                errors=errors,
                warnings=warnings,
            )

        return ImportValidationResult(
            valid=True,
            parsed_config={
                "state_code": state_code,
                "code": code,
                "version": version,
                "display_name": config.metadata.display_name,
                "description": config.metadata.description,
            },
            existing_version=existing_version,
            warnings=warnings,
        )

    @staticmethod
    async def import_assessment_config(
        session: AsyncSession,
        yaml_content: str,
        performed_by_email: str,
        source_env: Optional[str] = None,
        auto_activate: bool = False,
    ) -> ImportResult:
        """
        Import an assessment config from YAML content.

        Args:
            session: Database session
            yaml_content: YAML content to import
            performed_by_email: Email of the user performing the import
            source_env: Optional source environment name
            auto_activate: Whether to automatically activate the imported config

        Returns:
            ImportResult with the created config details

        Raises:
            ValueError: If validation fails
        """
        # Validate first
        validation = await ImportExportService.validate_assessment_import(
            session, yaml_content
        )
        if not validation.valid:
            raise ValueError("; ".join(validation.errors))

        # Parse the config
        config = ValidationService.parse_assessment_yaml(yaml_content)
        if not config:
            raise ValueError("Failed to parse YAML content")

        state_code = normalize_state_code_format(config.metadata.state_code)
        code = config.metadata.code

        # Create the database record
        import_hash = ImportExportService.compute_yaml_hash(yaml_content)

        assessment_config = AssessmentConfig(
            state_code=state_code,
            code=code,
            version=config.metadata.version,
            display_name=config.metadata.display_name,
            description=config.metadata.description,
            config_yaml=yaml_content,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
            created_by_email=performed_by_email,
            imported_from_env=source_env,
            import_hash=import_hash,
        )

        created_config = await create_assessment_config(session, assessment_config)

        message = "Imported as draft. Review and activate when ready."
        previous_active_version = None

        # Auto-activate if requested
        if auto_activate:
            from app.services.config_management.lifecycle import LifecycleService

            # Activate directly (no publish step needed)
            await LifecycleService.activate_assessment_config(
                session, created_config.id, performed_by_email
            )
            previous_active_version = (
                validation.existing_version if validation.existing_version else None
            )
            message = "Config imported and activated."
            if previous_active_version:
                message += f" Previous active version (v{previous_active_version}) has been deactivated."

            # Refresh to get updated status
            await session.refresh(created_config)

        logger.info(
            "Assessment config imported",
            config_id=str(created_config.id),
            state_code=state_code,
            code=code,
            version=config.metadata.version,
            auto_activated=auto_activate,
        )

        return ImportResult(
            id=created_config.id,
            state_code=state_code,
            code=code,
            version=created_config.version,
            status=created_config.status,
            is_active=created_config.is_active,
            previous_active_version=previous_active_version,
            message=message,
        )

    @staticmethod
    async def validate_output_import(
        session: AsyncSession,
        yaml_content: str,
    ) -> ImportValidationResult:
        """
        Validate an output config import without saving.

        Args:
            session: Database session
            yaml_content: YAML content to import

        Returns:
            ImportValidationResult with validation details
        """
        # Step 1: Validate YAML structure
        validation_result = ValidationService.validate_output_yaml(yaml_content)
        if not validation_result.valid:
            return ImportValidationResult(
                valid=False,
                errors=validation_result.errors,
                warnings=validation_result.warnings,
            )

        # Step 2: Parse the config
        config = ValidationService.parse_output_yaml(yaml_content)
        if not config:
            return ImportValidationResult(
                valid=False,
                errors=["Failed to parse YAML content"],
            )

        code = config.metadata.code
        version = config.metadata.version

        # Step 3: Get existing version info first
        latest_version = await get_latest_output_config_version(session, code)
        existing_version = latest_version if latest_version >= 0 else None

        # Step 4: Check if version already exists
        existing = await get_output_config_by_version(session, code, version)
        if existing:
            return ImportValidationResult(
                valid=False,
                parsed_config={
                    "code": code,
                    "version": version,
                    "output_type": config.metadata.output_type,
                    "display_name": config.metadata.display_name,
                },
                existing_version=existing_version,
                errors=[
                    f"Version {version} already exists for {code}. "
                    "Please increment the version in your YAML file."
                ],
            )

        # Step 5: Check that version is higher than the current highest
        if existing_version is not None and version <= existing_version:
            return ImportValidationResult(
                valid=False,
                parsed_config={
                    "code": code,
                    "version": version,
                    "output_type": config.metadata.output_type,
                    "display_name": config.metadata.display_name,
                },
                existing_version=existing_version,
                errors=[
                    f"Version {version} is not higher than the current highest version "
                    f"(v{existing_version}) for {code}. "
                    f"Please use a version number greater than {existing_version}."
                ],
            )

        return ImportValidationResult(
            valid=True,
            parsed_config={
                "code": code,
                "version": version,
                "output_type": config.metadata.output_type,
                "display_name": config.metadata.display_name,
                "description": config.metadata.description,
            },
            existing_version=existing_version,
            warnings=validation_result.warnings,
        )

    @staticmethod
    async def import_output_config(
        session: AsyncSession,
        yaml_content: str,
        performed_by_email: str,
        source_env: Optional[str] = None,
        auto_activate: bool = False,
    ) -> ImportResult:
        """
        Import an output config from YAML content.

        Args:
            session: Database session
            yaml_content: YAML content to import
            performed_by_email: Email of the user performing the import
            source_env: Optional source environment name
            auto_activate: Whether to automatically activate the imported config

        Returns:
            ImportResult with the created config details

        Raises:
            ValueError: If validation fails
        """
        # Validate first
        validation = await ImportExportService.validate_output_import(
            session, yaml_content
        )
        if not validation.valid:
            raise ValueError("; ".join(validation.errors))

        # Parse the config
        config = ValidationService.parse_output_yaml(yaml_content)
        if not config:
            raise ValueError("Failed to parse YAML content")

        code = config.metadata.code

        # Create the database record
        import_hash = ImportExportService.compute_yaml_hash(yaml_content)

        output_config = OutputConfig(
            output_type=OutputType(config.metadata.output_type),
            code=code,
            version=config.metadata.version,
            display_name=config.metadata.display_name,
            description=config.metadata.description,
            config_yaml=yaml_content,
            status=ConfigStatus.DRAFT.value,
            is_active=False,
            created_by_email=performed_by_email,
            imported_from_env=source_env,
            import_hash=import_hash,
        )

        created_config = await create_output_config(session, output_config)

        message = "Imported as draft. Review and activate when ready."
        previous_active_version = None

        # Auto-activate if requested
        if auto_activate:
            from app.services.config_management.lifecycle import LifecycleService

            # Activate directly (no publish step needed)
            await LifecycleService.activate_output_config(
                session, created_config.id, performed_by_email
            )
            previous_active_version = (
                validation.existing_version if validation.existing_version else None
            )
            message = "Config imported and activated."
            if previous_active_version:
                message += f" Previous active version (v{previous_active_version}) has been deactivated."

            # Refresh to get updated status
            await session.refresh(created_config)

        logger.info(
            "Output config imported",
            config_id=str(created_config.id),
            code=code,
            version=config.metadata.version,
            auto_activated=auto_activate,
        )

        return ImportResult(
            id=created_config.id,
            code=code,
            version=created_config.version,
            status=created_config.status,
            is_active=created_config.is_active,
            previous_active_version=previous_active_version,
            message=message,
        )

    @staticmethod
    def export_to_yaml(config_yaml: str) -> str:
        """
        Export config as clean YAML.

        The config_yaml stored in database is already clean YAML,
        so we just return it directly.

        Args:
            config_yaml: YAML content from database

        Returns:
            Clean YAML string for export
        """
        return config_yaml

    @staticmethod
    def generate_export_filename(
        config_type: Literal["assessment", "output"],
        state_code: Optional[str],
        code: str,
        version: int,
    ) -> str:
        """
        Generate a filename for exporting a config.

        Args:
            config_type: Type of config
            state_code: State code (for assessment configs)
            code: Config code
            version: Config version

        Returns:
            Filename string (e.g., "assessment-UT-CCCI-v2.yaml" or "output-cccap-v0.yaml")
        """
        if config_type == "assessment" and state_code:
            # Remove US_ prefix if present for cleaner filename
            state = state_code.replace("US_", "")
            return f"assessment-{state}-{code}-v{version}.yaml"
        else:
            return f"output-{code}-v{version}.yaml"

    @staticmethod
    def update_yaml_version(yaml_content: str, new_version: int) -> str:
        """
        Update the version field in the metadata section of YAML content.

        This preserves the original YAML formatting while only changing
        the version number.

        Args:
            yaml_content: Original YAML content
            new_version: New version number to set

        Returns:
            YAML content with updated version
        """
        # Match 'version:' followed by optional whitespace and a number
        # within the metadata section (near the top of the file)
        # This pattern handles both 'version: 0' and 'version:0' formats
        pattern = r"(^\s*version\s*:\s*)(\d+)"
        replacement = rf"\g<1>{new_version}"

        # Only replace the first occurrence (which should be in metadata)
        updated_yaml = re.sub(
            pattern, replacement, yaml_content, count=1, flags=re.MULTILINE
        )

        return updated_yaml
