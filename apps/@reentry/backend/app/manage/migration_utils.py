"""
Shared utilities for generating Alembic data migrations.
"""

import secrets
from datetime import datetime
from pathlib import Path
from typing import Optional

from alembic import config as alembic_config
from alembic.script import ScriptDirectory


class MigrationGenerator:
    """Handles common Alembic migration generation logic."""

    def __init__(self, backend_dir: Path):
        """
        Initialize the migration generator.

        Args:
            backend_dir: Path to the backend directory containing alembic.ini
        """
        self.backend_dir = backend_dir
        self.alembic_ini = backend_dir / "alembic.ini"
        self.versions_dir = backend_dir / "alembic" / "versions"

    def validate_alembic_setup(self) -> Optional[str]:
        """
        Validate that Alembic is properly set up.

        Returns:
            Error message if validation fails, None if successful
        """
        if not self.alembic_ini.exists():
            return f"Error: alembic.ini not found at {self.alembic_ini}"
        return None

    def get_current_head(self) -> tuple[Optional[str], Optional[str]]:
        """
        Get the current migration head revision.

        Returns:
            Tuple of (head_revision, error_message). If successful, error_message is None.
        """
        cfg = alembic_config.Config(str(self.alembic_ini))
        script_dir = ScriptDirectory.from_config(cfg)

        heads = script_dir.get_heads()
        if len(heads) == 0:
            return (
                None,
                "Error: No migration head found. Database may not be initialized.",
            )
        elif len(heads) > 1:
            return (
                None,
                f"Error: Multiple migration heads found: {heads}\nPlease merge branches before creating new migrations.",
            )

        return heads[0], None

    def generate_revision_id(self) -> str:
        """Generate a new revision ID."""
        return secrets.token_hex(6)

    def check_duplicate_migration(self, migration_name: str) -> Optional[list[Path]]:
        """
        Check if a migration with this name already exists.

        Args:
            migration_name: The migration name (e.g., "add_ut_ccci_v0")

        Returns:
            List of existing migration files if found, None otherwise
        """
        existing = list(self.versions_dir.glob(f"*_{migration_name}.py"))
        return existing if existing else None

    def create_migration_file(
        self,
        revision_id: str,
        migration_name: str,
        current_head: str,
        template_path: Path,
        template_vars: dict[str, str],
    ) -> Path:
        """
        Create a migration file from a template.

        Args:
            revision_id: The new revision ID
            migration_name: The migration name
            current_head: The current head revision
            template_path: Path to the migration template
            template_vars: Variables to substitute in the template

        Returns:
            Path to the created migration file
        """
        # Generate timestamp
        create_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

        # Create migration filename
        migration_filename = f"{revision_id}_{migration_name}.py"
        migration_path = self.versions_dir / migration_filename

        # Read template
        with open(template_path, "r") as f:
            template_content = f.read()

        # Build migration content from template
        migration_content = template_content.format(
            migration_name=migration_name,
            revision_id=revision_id,
            current_head=current_head,
            create_date=create_date,
            **template_vars,
        )

        # Write migration file
        with open(migration_path, "w") as f:
            f.write(migration_content)

        return migration_path
