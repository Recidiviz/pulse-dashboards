"""
File loader for converting output YAML configuration files into database records.

Flow: YAML File → OutputConfigFile (validation) → OutputConfig (database)
"""

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Union

import yaml

from app.core.data_config.output_configs.output_config import (
    ActionPlanConfigFile,
    IntakeSummaryConfigFile,
    OutputType,
)
from app.utils.string_utils import normalize_code

logger = logging.getLogger(__name__)


@dataclass
class OutputValidationResult:
    """Result of validating output config references."""

    found: list[str]
    missing: list[str]

    @property
    def all_exist(self) -> bool:
        """Check if all output configs exist."""
        return len(self.missing) == 0


class OutputFileLoader:
    """Loads output YAML configuration files and converts them to database models."""

    @staticmethod
    def read_file_content(file_name: str) -> str:
        """
        Read the raw content of an output config YAML file.

        Args:
            file_name: Name of the YAML file (e.g., "summary-default-v0.yaml")
                      File will be loaded from the output_configs directory

        Returns:
            Raw YAML content as string

        Raises:
            FileNotFoundError: If file doesn't exist
        """
        # Construct path to file in output_configs directory
        config_dir = Path(__file__).parent
        file_path = config_dir / file_name

        if not file_path.exists():
            raise FileNotFoundError(f"Config file not found: {file_path}")

        with open(file_path, "r") as f:
            yaml_content = f.read()

        logger.debug(f"Read config file: {file_path.name}")
        return yaml_content

    @staticmethod
    def validate_yaml_content(
        yaml_content: str,
    ) -> Union[IntakeSummaryConfigFile, ActionPlanConfigFile]:
        """
        Validate YAML content against the appropriate OutputConfig schema.

        Args:
            yaml_content: Raw YAML content as string

        Returns:
            Validated OutputConfigFile model (IntakeSummaryConfigFile or ActionPlanConfigFile)

        Raises:
            yaml.YAMLError: If YAML is malformed
            pydantic.ValidationError: If validation fails
            ValueError: If unknown output type
        """
        data = yaml.safe_load(yaml_content)

        # Determine type and validate
        output_type_str = data.get("metadata", {}).get("output_type")

        if output_type_str == OutputType.intake_summary.value:
            file_model = IntakeSummaryConfigFile(**data)
        elif output_type_str == OutputType.action_plan.value:
            file_model = ActionPlanConfigFile(**data)
        else:
            raise ValueError(f"Unknown output type: {output_type_str}")

        logger.info(
            f"Validated output config: "
            f"{file_model.metadata.code} "
            f"v{file_model.metadata.version} ({output_type_str})"
        )

        return file_model

    @staticmethod
    def load_all_from_directory() -> (
        list[Union[IntakeSummaryConfigFile, ActionPlanConfigFile]]
    ):
        """
        Load all output config files from the output_configs directory.

        Returns:
            List of OutputConfig database models (not yet saved to session)
        """
        config_dir = Path(__file__).parent

        configs = []
        for yaml_file in config_dir.glob("*.yaml"):
            try:
                yaml_content = OutputFileLoader.read_file_content(yaml_file.name)
                config = OutputFileLoader.validate_yaml_content(yaml_content)
                configs.append(config)
            except Exception as e:
                logger.error(f"Failed to load {yaml_file.name}: {e}")
                # Continue loading other files

        logger.info(f"Loaded {len(configs)} output configs from {config_dir}")
        return configs

    @staticmethod
    def validate_output_references(output_codes: list[str]) -> OutputValidationResult:
        """
        Validate that output config files exist for all referenced output codes.

        This checks the output_configs directory for YAML files with matching codes
        (using normalized code comparison).

        Args:
            output_codes: List of output codes to validate

        Returns:
            OutputValidationResult with found and missing codes
        """
        config_dir = Path(__file__).parent

        # Get all YAML files and extract their codes
        existing_codes = set()
        for yaml_file in config_dir.glob("*.yaml"):
            try:
                with open(yaml_file, "r") as f:
                    data = yaml.safe_load(f)
                    code = data.get("metadata", {}).get("code")
                    if code:
                        # Normalize the code for comparison
                        normalized = normalize_code(code)
                        existing_codes.add(normalized)
            except Exception:
                # Skip files that can't be parsed
                continue

        # Check which output codes are missing
        found = []
        missing = []

        for output_code in output_codes:
            normalized_output = normalize_code(output_code)
            if normalized_output in existing_codes:
                found.append(output_code)
            else:
                missing.append(output_code)

        return OutputValidationResult(found=found, missing=missing)
