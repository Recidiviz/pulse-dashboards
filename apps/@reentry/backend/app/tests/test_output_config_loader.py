"""Tests for OutputFileLoader"""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.core.data_config.output_configs.loader import (
    OutputFileLoader,
)
from app.core.data_config.output_configs.output_config import (
    ActionPlanConfigFile,
    IntakeSummaryConfigFile,
    OutputType,
)

# Path to the actual fixture folder
FIXTURE_DIR = Path(__file__).parent / "test_fixtures" / "output_configs"
VALID_INTAKE_SUMMARY_FILE = "intake_summary_ccci-v0.yaml"
VALID_ACTION_PLAN_FILE = "action_plan_ccci-v0.yaml"

# Invalid YAML for negative testing
INVALID_OUTPUT_YAML = """
metadata:
  # Missing type and other required fields
  code: test
  version: 1
"""

UNKNOWN_TYPE_YAML = """
metadata:
  type: unknown_type
  code: test
  version: 1
  display_name: Test
"""


class TestOutputFileLoader:
    """Tests for OutputFileLoader class"""

    def test_read_file_content_success(self):
        """Test successfully reading a valid config file"""
        with patch("app.core.data_config.output_configs.loader.Path") as mock_path:
            mock_path.return_value.parent = FIXTURE_DIR
            mock_path.return_value.__truediv__ = lambda self, other: FIXTURE_DIR / other

            yaml_content = OutputFileLoader.read_file_content(VALID_INTAKE_SUMMARY_FILE)

            assert isinstance(yaml_content, str)
            assert "metadata:" in yaml_content
            assert len(yaml_content) > 0

    def test_read_file_content_not_found(self):
        """Test reading a file that doesn't exist"""
        with patch("app.core.data_config.output_configs.loader.Path") as mock_path:
            mock_file_path = MagicMock()
            mock_file_path.exists.return_value = False
            mock_path.return_value.parent = Path("/fake")
            mock_path.return_value.__truediv__ = lambda self, other: mock_file_path

            with pytest.raises(FileNotFoundError, match="Config file not found"):
                OutputFileLoader.read_file_content("nonexistent.yaml")

    def test_validate_yaml_content_intake_summary_success(self):
        """Test successfully validating an intake summary YAML"""
        yaml_content = (FIXTURE_DIR / VALID_INTAKE_SUMMARY_FILE).read_text()

        file_model = OutputFileLoader.validate_yaml_content(yaml_content)

        assert isinstance(file_model, IntakeSummaryConfigFile)
        assert file_model.metadata.code == "intake_summary_ccci"
        assert file_model.metadata.version == 0
        assert file_model.metadata.output_type == OutputType.intake_summary
        assert file_model.metadata.display_name == "CCCI Intake Summary"
        assert hasattr(file_model, "prompts")

    def test_validate_yaml_content_action_plan_success(self):
        """Test successfully validating an action plan YAML"""
        yaml_content = (FIXTURE_DIR / VALID_ACTION_PLAN_FILE).read_text()

        file_model = OutputFileLoader.validate_yaml_content(yaml_content)

        assert isinstance(file_model, ActionPlanConfigFile)
        assert file_model.metadata.code == "action_plan_ccci"
        assert file_model.metadata.version == 0
        assert file_model.metadata.output_type == OutputType.action_plan
        assert file_model.metadata.display_name == "CCCI Action Plan"
        assert hasattr(file_model, "structure")

    def test_validate_yaml_content_invalid_yaml(self):
        """Test validating invalid YAML structure"""
        with pytest.raises(Exception):  # Pydantic ValidationError
            OutputFileLoader.validate_yaml_content(INVALID_OUTPUT_YAML)

    def test_validate_yaml_content_unknown_type(self):
        """Test validating YAML with unknown output type"""
        with pytest.raises(ValueError, match="Unknown output type"):
            OutputFileLoader.validate_yaml_content(UNKNOWN_TYPE_YAML)

    def test_load_all_from_directory_success(self):
        """Test loading all files from a directory"""
        with patch("app.core.data_config.output_configs.loader.Path") as mock_path:
            mock_path.return_value.parent = FIXTURE_DIR
            mock_path.return_value.__truediv__ = lambda self, other: FIXTURE_DIR / other

            configs = OutputFileLoader.load_all_from_directory()

            # Should load multiple configs from fixture directory (5 YAML files)
            assert len(configs) == 5
            assert all(
                isinstance(c, (IntakeSummaryConfigFile, ActionPlanConfigFile))
                for c in configs
            )

            # Verify both types are present
            types = {c.metadata.output_type for c in configs}
            assert OutputType.intake_summary in types
            assert OutputType.action_plan in types

    def test_load_all_from_directory_with_errors(self, tmp_path, caplog):
        """Test that loading continues even when some files fail"""
        # Read valid YAML from fixture
        valid_yaml_content = (FIXTURE_DIR / VALID_INTAKE_SUMMARY_FILE).read_text()

        (tmp_path / "valid.yaml").write_text(valid_yaml_content)
        (tmp_path / "invalid.yaml").write_text(INVALID_OUTPUT_YAML)

        with patch("app.core.data_config.output_configs.loader.Path") as mock_path:
            mock_path.return_value.parent = tmp_path
            mock_path.return_value.__truediv__ = lambda self, other: tmp_path / other

            configs = OutputFileLoader.load_all_from_directory()

            # Should load 1 config (invalid one skipped)
            assert len(configs) == 1
            assert configs[0].metadata.code == "intake_summary_ccci"

            # Should log error for invalid file
            assert "Failed to load invalid.yaml" in caplog.text

    def test_load_all_from_directory_empty(self, tmp_path):
        """Test loading from an empty directory"""
        with patch("app.core.data_config.output_configs.loader.Path") as mock_path:
            mock_path.return_value.parent = tmp_path
            mock_path.return_value.__truediv__ = lambda self, other: tmp_path / other

            configs = OutputFileLoader.load_all_from_directory()

            assert len(configs) == 0

    def test_validate_output_references_all_exist(self):
        """Test validation when all output configs exist"""
        with patch("app.core.data_config.output_configs.loader.Path") as mock_path:
            mock_path.return_value.parent = FIXTURE_DIR

            # Reference codes that exist in the fixture directory
            result = OutputFileLoader.validate_output_references(
                ["intake_summary_ccci", "action_plan_ccci"]
            )

            assert result.all_exist is True
            assert len(result.found) == 2
            assert "intake_summary_ccci" in result.found
            assert "action_plan_ccci" in result.found
            assert len(result.missing) == 0

    def test_validate_output_references_some_missing(self):
        """Test validation when some output configs are missing"""
        with patch("app.core.data_config.output_configs.loader.Path") as mock_path:
            mock_path.return_value.parent = FIXTURE_DIR

            # Reference some existing and some non-existent codes
            result = OutputFileLoader.validate_output_references(
                ["intake_summary_ccci", "plan_nonexistent", "summary_missing"]
            )

            assert result.all_exist is False
            assert len(result.found) == 1
            assert "intake_summary_ccci" in result.found
            assert len(result.missing) == 2
            assert "plan_nonexistent" in result.missing
            assert "summary_missing" in result.missing

    def test_all_real_config_files_are_valid(self):
        """Integration test: Load and validate all real output config files"""
        # Find all YAML files in the real output configs directory
        yaml_files = list(FIXTURE_DIR.glob("*.yaml"))

        # Ensure we have some files to test
        assert len(yaml_files) > 0, "No YAML files found in output configs directory"

        valid_configs = []
        errors = []

        for yaml_file in yaml_files:
            try:
                # Read the file content directly (not using the loader to avoid mocking)
                yaml_content = yaml_file.read_text()

                # Validate the content
                file_model = OutputFileLoader.validate_yaml_content(yaml_content)

                # Verify basic structure
                assert isinstance(
                    file_model, (IntakeSummaryConfigFile, ActionPlanConfigFile)
                )
                assert file_model.metadata.code is not None
                assert file_model.metadata.version is not None
                assert file_model.metadata.output_type is not None
                assert file_model.metadata.display_name is not None
                assert file_model.prompts is not None

                # Type-specific validation
                if isinstance(file_model, ActionPlanConfigFile):
                    assert file_model.structure is not None

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

        print(f"\nSuccessfully validated {len(valid_configs)} output config files:")
        for config_name in sorted(valid_configs):
            print(f"  ✓ {config_name}")
