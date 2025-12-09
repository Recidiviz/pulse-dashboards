"""
File loader for assessment YAML configuration files.

Flow: YAML File → read_file_content → validate_yaml_content → AssessmentConfigFile
"""

import logging
from pathlib import Path

import yaml

from app.core.data_config.assessment_configs.assessment_config import (
    AssessmentConfigFile,
)

logger = logging.getLogger(__name__)


class AssessmentFileLoader:
    """Loads and validates assessment YAML configuration files."""

    @staticmethod
    def read_file_content(file_name: str) -> str:
        """
        Read the raw content of an assessment config YAML file.

        Args:
            file_name: Name of the YAML file (e.g., "UT-CCCI-v1.yaml")
                      File will be loaded from the assessment_configs directory

        Returns:
            Raw YAML content as string

        Raises:
            FileNotFoundError: If file doesn't exist
        """
        # Construct path to file in assessment_configs directory
        config_dir = Path(__file__).parent
        file_path = config_dir / file_name

        if not file_path.exists():
            raise FileNotFoundError(f"Config file not found: {file_path}")

        with open(file_path, "r") as f:
            yaml_content = f.read()

        logger.debug(f"Read config file: {file_path.name}")
        return yaml_content

    @staticmethod
    def validate_yaml_content(yaml_content: str) -> AssessmentConfigFile:
        """
        Validate YAML content against the AssessmentConfigFile schema.

        Args:
            yaml_content: Raw YAML content as string

        Returns:
            Validated AssessmentConfigFile model

        Raises:
            yaml.YAMLError: If YAML is malformed
            pydantic.ValidationError: If validation fails
        """
        data = yaml.safe_load(yaml_content)
        file_model = AssessmentConfigFile(**data)

        logger.info(
            f"Validated assessment config: "
            f"{file_model.metadata.state_code}/{file_model.metadata.code} "
            f"v{file_model.metadata.version}"
        )

        return file_model
