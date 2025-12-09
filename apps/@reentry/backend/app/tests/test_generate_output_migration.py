"""Tests for generate_output_migration command"""

from contextlib import contextmanager
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.manage.generate_output_migration import generate_output_migration

# Path to the test fixtures folder
FIXTURE_DIR = Path(__file__).parent / "test_fixtures" / "output_configs"
VALID_OUTPUT_FILE = "intake_summary_ccci-v0.yaml"

INVALID_OUTPUT_YAML = """
metadata:
  # Missing required fields
  code: test_output
  version: 1
"""


@contextmanager
def mock_loader_paths(output_dir=FIXTURE_DIR):
    """Context manager to mock Path objects for loaders to use fixture directories"""
    output_patch = patch("app.core.data_config.output_configs.loader.Path")

    output_mock = output_patch.start()

    output_mock.return_value.parent = output_dir
    output_mock.return_value.__truediv__ = lambda self, other: output_dir / other

    try:
        yield
    finally:
        output_patch.stop()


@contextmanager
def mock_backend_path(backend_dir):
    """Context manager to mock Path in generate_output_migration to use test backend directory"""
    with patch("app.manage.generate_output_migration.Path") as mock_path_class:
        mock_path_instance = MagicMock()
        mock_path_instance.parent.parent.parent = backend_dir
        mock_path_class.return_value = mock_path_instance
        yield


@pytest.fixture
def backend_dir(tmp_path):
    """Create a test backend directory structure"""
    backend = tmp_path / "backend"
    backend.mkdir()
    versions = backend / "alembic" / "versions"
    versions.mkdir(parents=True)
    return backend


@pytest.fixture
def mock_migration_generator(backend_dir):
    """Partial mock of MigrationGenerator - mocks validation/checks but uses real create_migration_file"""
    from app.manage.migration_utils import MigrationGenerator

    with patch(
        "app.manage.generate_output_migration.MigrationGenerator"
    ) as mock_gen_class:
        # Create real instance
        real_generator = MigrationGenerator(backend_dir)

        # Create mock instance
        mock_gen = MagicMock()
        mock_gen_class.return_value = mock_gen

        # Mock the validation/check methods
        mock_gen.validate_alembic_setup.return_value = None
        mock_gen.get_current_head.return_value = ("current_head_revision", None)
        mock_gen.generate_revision_id.return_value = "abc123def456"
        mock_gen.check_duplicate_migration.return_value = None

        # Use real implementation for create_migration_file
        mock_gen.create_migration_file.side_effect = (
            real_generator.create_migration_file
        )

        yield mock_gen


class TestGenerateOutputMigration:
    """Tests for generate_output_migration command"""

    def test_successful_migration_generation(
        self, backend_dir, mock_migration_generator
    ):
        """Test successful migration generation with valid config"""
        versions_dir = backend_dir / "alembic" / "versions"

        # Use real fixture directories for loaders
        with mock_loader_paths():
            with patch("builtins.print") as mock_print:
                with mock_backend_path(backend_dir):
                    generate_output_migration(VALID_OUTPUT_FILE)

        # Verify MigrationGenerator methods were called correctly
        mock_migration_generator.validate_alembic_setup.assert_called_once()
        mock_migration_generator.get_current_head.assert_called_once()
        mock_migration_generator.check_duplicate_migration.assert_called_once_with(
            "add_intakesummaryccci_v0"
        )
        mock_migration_generator.generate_revision_id.assert_called_once()

        # Verify create_migration_file was called with correct params
        call_args = mock_migration_generator.create_migration_file.call_args
        assert call_args[1]["revision_id"] == "abc123def456"
        assert call_args[1]["migration_name"] == "add_intakesummaryccci_v0"
        assert call_args[1]["current_head"] == "current_head_revision"
        assert "output_type" in call_args[1]["template_vars"]
        assert call_args[1]["template_vars"]["output_type"] == "intake_summary"
        assert call_args[1]["template_vars"]["normalized_code"] == "intakesummaryccci"

        # Verify success message was printed
        assert any(
            "Migration created successfully" in str(call)
            for call in mock_print.call_args_list
        )

        # Verify the migration file was actually created with correct template content
        migration_files = list(versions_dir.glob("*.py"))
        assert (
            len(migration_files) == 1
        ), f"Expected 1 migration file, found {len(migration_files)}"

        migration_content = migration_files[0].read_text()
        assert "revision: str = 'abc123def456'" in migration_content
        assert (
            "down_revision: Union[str, None] = 'current_head_revision'"
            in migration_content
        )
        assert "INSERT INTO outputconfig" in migration_content
        assert "intake_summary" in migration_content  # output_type
        assert "intakesummaryccci" in migration_content  # normalized code
        assert "NOW()" in migration_content  # timestamps
        assert "gen_random_uuid()" in migration_content

        # Verify the migration file was created with correct content
        versions_dir = backend_dir / "alembic" / "versions"
        migration_files = list(versions_dir.glob("*.py"))
        assert len(migration_files) == 1

        migration_content = migration_files[0].read_text()
        assert "revision: str = 'abc123def456'" in migration_content
        assert "INSERT INTO outputconfig" in migration_content
        assert "intake_summary" in migration_content

    def test_file_not_found(self, backend_dir):
        """Test error when YAML file doesn't exist"""
        with mock_loader_paths():
            with patch("builtins.print") as mock_print:
                with mock_backend_path(backend_dir):
                    generate_output_migration("nonexistent.yaml")

        assert any("Error:" in str(call) for call in mock_print.call_args_list)

    def test_invalid_yaml_validation(self, tmp_path, backend_dir):
        """Test error when YAML validation fails"""
        # Create an invalid YAML file
        invalid_file = tmp_path / "invalid.yaml"
        invalid_file.write_text(INVALID_OUTPUT_YAML)

        with mock_loader_paths(output_dir=tmp_path):
            with patch("builtins.print") as mock_print:
                with mock_backend_path(backend_dir):
                    generate_output_migration("invalid.yaml")

        assert any(
            "Failed to load or validate config" in str(call)
            for call in mock_print.call_args_list
        )

    def test_migration_generator_error_handling(
        self, backend_dir, mock_migration_generator
    ):
        """Test that errors from MigrationGenerator are properly displayed"""
        mock_migration_generator.validate_alembic_setup.return_value = (
            "Error: alembic.ini not found"
        )

        with mock_loader_paths():
            with patch("builtins.print") as mock_print:
                with mock_backend_path(backend_dir):
                    generate_output_migration(VALID_OUTPUT_FILE)

        # Verify error message was printed to user
        assert any(
            "alembic.ini not found" in str(call) for call in mock_print.call_args_list
        )
        # Verify execution stopped after error
        mock_migration_generator.get_current_head.assert_not_called()

    def test_action_plan_config_generation(self, backend_dir, mock_migration_generator):
        """Test successful migration generation with action plan config"""
        with mock_loader_paths():
            with patch("builtins.print") as mock_print:
                with mock_backend_path(backend_dir):
                    generate_output_migration("action_plan_ccci-v0.yaml")

        # Verify MigrationGenerator was called correctly
        mock_migration_generator.check_duplicate_migration.assert_called_once_with(
            "add_actionplanccci_v0"
        )

        # Verify create_migration_file was called with correct params
        call_args = mock_migration_generator.create_migration_file.call_args
        assert call_args[1]["migration_name"] == "add_actionplanccci_v0"
        assert call_args[1]["template_vars"]["output_type"] == "action_plan"
        assert call_args[1]["template_vars"]["normalized_code"] == "actionplanccci"

        # Verify success message
        assert any(
            "Migration created successfully" in str(call)
            for call in mock_print.call_args_list
        )

        # Verify generated content
        versions_dir = backend_dir / "alembic" / "versions"
        migration_files = list(versions_dir.glob("*.py"))
        assert len(migration_files) == 1

        migration_content = migration_files[0].read_text()
        assert "INSERT INTO outputconfig" in migration_content
        assert "action_plan" in migration_content
