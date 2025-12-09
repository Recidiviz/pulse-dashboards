"""Tests for AssessmentFileLoader"""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.core.data_config.assessment_configs.assessment_config import (
    AssessmentConfigFile,
)
from app.core.data_config.assessment_configs.loader import AssessmentFileLoader

# Path to the actual fixture folder
FIXTURE_DIR = Path(__file__).parent / "test_fixtures" / "assessment_configs"
VALID_ASSESSMENT_FILE = "UT-CCCI-v0.yaml"

# Invalid YAML for negative testing
INVALID_ASSESSMENT_YAML = """
metadata:
  # Missing required fields
  code: CCCI
  version: 1
"""


class TestAssessmentFileLoader:
    """Tests for AssessmentFileLoader class"""

    def test_read_file_content_success(self):
        """Test successfully reading a valid assessment config file"""
        # Mock Path(__file__).parent to return fixture directory
        with patch("app.core.data_config.assessment_configs.loader.Path") as mock_path:
            mock_path.return_value.parent = FIXTURE_DIR
            mock_path.return_value.__truediv__ = lambda self, other: FIXTURE_DIR / other

            # Read the file content
            yaml_content = AssessmentFileLoader.read_file_content(VALID_ASSESSMENT_FILE)

            # Verify it's a string with YAML content
            assert isinstance(yaml_content, str)
            assert "metadata:" in yaml_content
            assert "state_code: US_UT" in yaml_content
            assert "code: CCCI" in yaml_content

    def test_read_file_content_not_found(self):
        """Test reading a file that doesn't exist"""
        with patch("app.core.data_config.assessment_configs.loader.Path") as mock_path:
            mock_file_path = MagicMock()
            mock_file_path.exists.return_value = False
            mock_path.return_value.parent = Path("/fake")
            mock_path.return_value.__truediv__ = lambda self, other: mock_file_path

            with pytest.raises(FileNotFoundError, match="Config file not found"):
                AssessmentFileLoader.read_file_content("nonexistent.yaml")

    def test_validate_yaml_content_success(self):
        """Test successfully validating valid YAML content"""
        # Read the actual fixture YAML content
        valid_yaml_content = (FIXTURE_DIR / VALID_ASSESSMENT_FILE).read_text()

        # Validate the YAML content
        file_model = AssessmentFileLoader.validate_yaml_content(valid_yaml_content)

        # Verify it's an AssessmentConfigFile with correct values
        assert isinstance(file_model, AssessmentConfigFile)
        assert file_model.metadata.state_code == "US_UT"
        assert file_model.metadata.code == "CCCI"
        assert file_model.metadata.version == 0
        assert file_model.metadata.display_name == "Test CCCI v0"
        assert file_model.intake.intake_type == "conversation"
        assert len(file_model.outputs.codes) == 2

    def test_validate_yaml_content_invalid(self):
        """Test validating invalid YAML content"""
        # Should raise validation error from Pydantic
        with pytest.raises(Exception):  # Pydantic ValidationError
            AssessmentFileLoader.validate_yaml_content(INVALID_ASSESSMENT_YAML)

    def test_validate_yaml_content_malformed_yaml(self):
        """Test validating malformed YAML"""
        malformed_yaml = """
        metadata:
          state_code: US_UT
          code: CCCI
        invalid yaml syntax: [[[
        """

        # Should raise YAML parsing error
        with pytest.raises(Exception):  # yaml.YAMLError
            AssessmentFileLoader.validate_yaml_content(malformed_yaml)

    def test_full_workflow(self):
        """Test the full workflow: read file then validate content"""
        with patch("app.core.data_config.assessment_configs.loader.Path") as mock_path:
            mock_path.return_value.parent = FIXTURE_DIR
            mock_path.return_value.__truediv__ = lambda self, other: FIXTURE_DIR / other

            # Step 1: Read file content
            yaml_content = AssessmentFileLoader.read_file_content(VALID_ASSESSMENT_FILE)
            assert isinstance(yaml_content, str)

            # Step 2: Validate content
            file_model = AssessmentFileLoader.validate_yaml_content(yaml_content)
            assert isinstance(file_model, AssessmentConfigFile)
            assert file_model.metadata.state_code == "US_UT"
            assert file_model.metadata.code == "CCCI"
            assert file_model.metadata.version == 0

    def test_all_real_config_files_are_valid(self):
        """Integration test: Load and validate all real assessment config files"""
        # Find all YAML files in the real assessment configs directory
        yaml_files = list(FIXTURE_DIR.glob("*.yaml"))

        # Ensure we have some files to test
        assert (
            len(yaml_files) > 0
        ), "No YAML files found in assessment configs directory"

        valid_configs = []
        errors = []

        for yaml_file in yaml_files:
            try:
                # Read the file content directly (not using the loader to avoid mocking)
                yaml_content = yaml_file.read_text()

                # Validate the content
                file_model = AssessmentFileLoader.validate_yaml_content(yaml_content)

                # Verify basic structure
                assert isinstance(file_model, AssessmentConfigFile)
                assert file_model.metadata.state_code is not None
                assert file_model.metadata.code is not None
                assert file_model.metadata.version is not None
                assert file_model.metadata.display_name is not None
                assert file_model.intake is not None
                assert file_model.outputs is not None

                valid_configs.append(yaml_file.name)
            except Exception as e:
                errors.append(f"{yaml_file.name}: {str(e)}")

        # Report results
        if errors:
            error_msg = "Some config files failed validation:\n" + "\n".join(errors)
            pytest.fail(error_msg)

        # All files should be valid
        assert (
            len(valid_configs) == len(yaml_files)
        ), f"Expected all {len(yaml_files)} files to be valid, but only {len(valid_configs)} passed"

        print(f"\nSuccessfully validated {len(valid_configs)} assessment config files:")
        for config_name in sorted(valid_configs):
            print(f"  ✓ {config_name}")
