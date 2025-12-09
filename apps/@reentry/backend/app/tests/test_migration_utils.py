"""Tests for MigrationGenerator utility"""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.manage.migration_utils import MigrationGenerator


@pytest.fixture
def backend_dir():
    """Use the real backend directory for testing Alembic integration"""
    # Navigate from test file to actual backend directory
    return Path(__file__).parent.parent.parent


@pytest.fixture
def test_migration_dir(tmp_path):
    """Create a temporary directory for migration output"""
    versions = tmp_path / "alembic" / "versions"
    versions.mkdir(parents=True)
    return tmp_path


class TestMigrationGenerator:
    """Tests for MigrationGenerator class"""

    def test_init(self, backend_dir):
        """Test MigrationGenerator initialization"""
        generator = MigrationGenerator(backend_dir)

        assert generator.backend_dir == backend_dir
        assert generator.alembic_ini == backend_dir / "alembic.ini"
        assert generator.versions_dir == backend_dir / "alembic" / "versions"

    def test_validate_alembic_setup_success(self, backend_dir):
        """Test successful Alembic setup validation with real alembic.ini"""
        generator = MigrationGenerator(backend_dir)
        error = generator.validate_alembic_setup()

        assert error is None

    def test_validate_alembic_setup_missing_ini(self, tmp_path):
        """Test validation fails when alembic.ini is missing"""
        backend = tmp_path / "backend"
        backend.mkdir()

        generator = MigrationGenerator(backend)
        error = generator.validate_alembic_setup()

        assert error is not None
        assert "alembic.ini not found" in error

    def test_get_current_head_success(self, backend_dir):
        """Test successful current head retrieval with real Alembic"""
        generator = MigrationGenerator(backend_dir)
        head, error = generator.get_current_head()

        # Should successfully get a head from the real alembic setup
        assert error is None
        assert head is not None
        assert isinstance(head, str)

    def test_get_current_head_no_alembic_ini(self, tmp_path):
        """Test get_current_head with missing alembic.ini"""
        backend = tmp_path / "backend"
        backend.mkdir()

        generator = MigrationGenerator(backend)

        # Should raise an error because alembic.ini doesn't exist
        with pytest.raises(Exception):
            generator.get_current_head()

    @patch("app.manage.migration_utils.alembic_config.Config")
    @patch("app.manage.migration_utils.ScriptDirectory")
    def test_get_current_head_no_heads(
        self, mock_script_dir_class, mock_config_class, backend_dir
    ):
        """Test error when no migration heads exist"""
        mock_script_dir = MagicMock()
        mock_script_dir.get_heads.return_value = []
        mock_script_dir_class.from_config.return_value = mock_script_dir

        generator = MigrationGenerator(backend_dir)
        head, error = generator.get_current_head()

        assert head is None
        assert error is not None
        assert "No migration head found" in error
        assert "Database may not be initialized" in error

    @patch("app.manage.migration_utils.alembic_config.Config")
    @patch("app.manage.migration_utils.ScriptDirectory")
    def test_get_current_head_multiple_heads(
        self, mock_script_dir_class, mock_config_class, backend_dir
    ):
        """Test error when multiple migration heads exist"""
        mock_script_dir = MagicMock()
        mock_script_dir.get_heads.return_value = ["abc123", "def456"]
        mock_script_dir_class.from_config.return_value = mock_script_dir

        generator = MigrationGenerator(backend_dir)
        head, error = generator.get_current_head()

        assert head is None
        assert error is not None
        assert "Multiple migration heads found" in error
        assert "['abc123', 'def456']" in error
        assert "Please merge branches" in error

    def test_generate_revision_id(self, backend_dir):
        """Test revision ID generation"""
        generator = MigrationGenerator(backend_dir)
        revision_id = generator.generate_revision_id()

        assert isinstance(revision_id, str)
        assert len(revision_id) == 12  # token_hex(6) produces 12 hex chars

        # Generate another to ensure uniqueness
        revision_id2 = generator.generate_revision_id()
        assert revision_id != revision_id2

    def test_check_duplicate_migration_none_exists(self, test_migration_dir):
        """Test duplicate check when no migration exists"""
        generator = MigrationGenerator(test_migration_dir)
        existing = generator.check_duplicate_migration("add_test_v1")

        assert existing is None

    def test_check_duplicate_migration_exists(self, test_migration_dir):
        """Test duplicate check when migration exists"""
        versions_dir = test_migration_dir / "alembic" / "versions"
        existing_file = versions_dir / "abc123_add_test_v1.py"
        existing_file.touch()

        generator = MigrationGenerator(test_migration_dir)
        existing = generator.check_duplicate_migration("add_test_v1")

        assert existing is not None
        assert len(existing) == 1
        assert existing[0] == existing_file

    def test_check_duplicate_migration_multiple(self, test_migration_dir):
        """Test duplicate check finds multiple matching migrations"""
        versions_dir = test_migration_dir / "alembic" / "versions"
        file1 = versions_dir / "abc123_add_test_v1.py"
        file2 = versions_dir / "def456_add_test_v1.py"
        file1.touch()
        file2.touch()

        generator = MigrationGenerator(test_migration_dir)
        existing = generator.check_duplicate_migration("add_test_v1")

        assert existing is not None
        assert len(existing) == 2

    def test_create_migration_file(self, test_migration_dir):
        """Test migration file creation"""
        # Create a test template
        templates_dir = test_migration_dir / "templates"
        templates_dir.mkdir()
        template_path = templates_dir / "test.tmpl"
        template_path.write_text("""Test migration {migration_name}
revision: {revision_id}
down_revision: {current_head}
create_date: {create_date}
""")

        generator = MigrationGenerator(test_migration_dir)
        migration_path = generator.create_migration_file(
            revision_id="abc123",
            migration_name="add_test_v1",
            current_head="def456",
            template_path=template_path,
            template_vars={},
        )

        # Verify file was created
        assert migration_path.exists()
        assert migration_path.name == "abc123_add_test_v1.py"
        assert migration_path.parent == test_migration_dir / "alembic" / "versions"

        # Verify content
        content = migration_path.read_text()
        assert "Test migration add_test_v1" in content
        assert "revision: abc123" in content
        assert "down_revision: def456" in content
        assert "create_date:" in content

    def test_create_migration_file_with_template_vars(self, test_migration_dir):
        """Test migration file creation with template variables"""
        # Create a template with additional variables
        templates_dir = test_migration_dir / "templates"
        templates_dir.mkdir()
        template_path = templates_dir / "test_vars.tmpl"
        template_path.write_text("""Migration: {migration_name}
Revision: {revision_id}
State: {state_code}
Code: {normalized_code}
Version: {version}
""")

        generator = MigrationGenerator(test_migration_dir)
        migration_path = generator.create_migration_file(
            revision_id="abc123",
            migration_name="add_ut_ccci_v0",
            current_head="def456",
            template_path=template_path,
            template_vars={
                "state_code": "US_UT",
                "normalized_code": "ccci",
                "version": "0",
            },
        )

        content = migration_path.read_text()
        assert "State: US_UT" in content
        assert "Code: ccci" in content
        assert "Version: 0" in content
