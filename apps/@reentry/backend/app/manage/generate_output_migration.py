"""
Generate Alembic data migrations for output configurations.

This command creates a migration file that inserts a new output config
into the database from a YAML file.
"""

import pathlib
from pathlib import Path

from app.core.data_config.output_configs.loader import OutputFileLoader
from app.utils.string_utils import escape_sql_string, normalize_code

from .base import cli
from .migration_utils import MigrationGenerator


@cli.command()
def generate_output_migration(file_name: str):
    """
    Generate an Alembic migration for a new output config.

    Args:
        file_name: Name of the YAML file in output_configs/ directory
                  (e.g., "summary-default-v0.yaml")

    Example:
        uv run python -m app.manage generate-output-migration summary-default-v0.yaml
    """
    # Read and validate the output config
    print(f"Loading output config from {file_name}...")
    try:
        yaml_content = OutputFileLoader.read_file_content(file_name)
        config = OutputFileLoader.validate_yaml_content(yaml_content)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return
    except Exception as e:
        print(f"Error: Failed to load or validate config: {e}")
        return

    # Extract metadata
    output_type = config.metadata.output_type
    code = config.metadata.code
    version = config.metadata.version
    display_name = config.metadata.display_name
    description = config.metadata.description

    # Normalize the code for database storage and filename
    normalized_code = normalize_code(code)

    print(f"Config loaded: {code} v{version} ({output_type})")
    print(f"Display name: {display_name}")

    # Setup migration generator
    backend_dir = Path(__file__).parent.parent.parent
    generator = MigrationGenerator(backend_dir)

    # Validate Alembic setup
    error = generator.validate_alembic_setup()
    if error:
        print(error)
        return

    # Get current head revision
    current_head, error = generator.get_current_head()
    if error:
        print(error)
        return

    # Create migration name
    migration_name = f"add_{normalized_code}_v{version}"

    # Check if migration already exists
    existing_migrations = generator.check_duplicate_migration(migration_name)
    if existing_migrations:
        print("Error: Migration already exists for this config version:")
        for existing in existing_migrations:
            print(f"  {existing.name}")
        return

    # Generate new revision ID
    revision_id = generator.generate_revision_id()

    # Relative path from migration file to YAML file
    # Migration is in: alembic/versions/xxx.py
    # YAML is in: app/core/data_config/output_configs/xxx.yaml
    yaml_relative_path = f"../../app/core/data_config/output_configs/{file_name}"

    # Escape data for SQL
    display_name_escaped = escape_sql_string(display_name)
    description_escaped = escape_sql_string(description) if description else None
    description_value = (
        "NULL" if description_escaped is None else f"'{description_escaped}'"
    )

    # Prepare template variables
    template_vars = {
        "yaml_relative_path": yaml_relative_path,
        "output_type": output_type,
        "normalized_code": normalized_code,
        "version": str(version),
        "display_name_escaped": display_name_escaped,
        "description_value": description_value,
    }

    # Read the migration template (use pathlib.Path directly to avoid test mocking issues)
    template_path = (
        pathlib.Path(__file__).parent / "templates" / "output_migration.py.tmpl"
    )

    # Create migration file
    migration_path = generator.create_migration_file(
        revision_id=revision_id,
        migration_name=migration_name,
        current_head=current_head,
        template_path=template_path,
        template_vars=template_vars,
    )

    print("\nMigration created successfully!")
    print(f"  File: {migration_path.relative_to(backend_dir)}")
    print(f"  Revision: {revision_id}")
    print("\nNext steps:")
    print("  1. Review the migration file")
    print("  2. Apply the migration: uv run alembic upgrade head")
    print("  3. Verify in database that the config was inserted correctly")
