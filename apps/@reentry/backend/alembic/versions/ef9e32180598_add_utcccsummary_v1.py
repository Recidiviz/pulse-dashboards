"""add_utcccsummary_v1

Revision ID: ef9e32180598
Revises: 9e9ab887be0a
Create Date: 2026-02-06 10:14:40.417055

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ef9e32180598'
down_revision: Union[str, None] = '9e9ab887be0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Read YAML file from codebase
    yaml_path = Path(__file__).parent / "../../app/core/data_config/output_configs/output-utcccsummary-v1.yaml"

    with open(yaml_path, "r") as f:
        yaml_content = f.read()

    # Escape single quotes for SQL
    yaml_content_escaped = yaml_content.replace("'", "''")

    # Insert new output config
    op.execute(f"""
        INSERT INTO outputconfig (
            id, created_at, updated_at, output_type, code, version,
            display_name, description, config_yaml, is_active
        ) VALUES (
            gen_random_uuid(),
            NOW(),
            NOW(),
            'intake_summary',
            'utcccsummary',
            1,
            'Intake Summary',
            NULL,
            '{yaml_content_escaped}',
            false
        )
    """)

    # Deactivate all other versions of this output config
    op.execute("""
        UPDATE outputconfig
        SET is_active = false
        WHERE code = 'utcccsummary' AND version != 1
    """)

    # Activate the new version
    op.execute("""
        UPDATE outputconfig
        SET is_active = true
        WHERE code = 'utcccsummary' AND version = 1
    """)


def downgrade() -> None:
    # Delete the new version
    op.execute("""
        DELETE FROM outputconfig
        WHERE code = 'utcccsummary' AND version = 1
    """)

    # Reactivate the most recent previous version (if any exists)
    op.execute("""
        UPDATE outputconfig
        SET is_active = true
        WHERE code = 'utcccsummary'
        AND version = (
            SELECT MAX(version)
            FROM outputconfig
            WHERE code = 'utcccsummary' AND version < 1
        )
    """)
