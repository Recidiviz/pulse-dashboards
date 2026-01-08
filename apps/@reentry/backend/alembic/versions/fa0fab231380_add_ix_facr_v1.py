"""add_ix_facr_v1

Revision ID: fa0fab231380
Revises: 60ba1d77289e
Create Date: 2026-01-06 14:56:40.159503

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa0fab231380'
down_revision: Union[str, None] = '60ba1d77289e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Read YAML file from codebase
    yaml_path = Path(__file__).parent / "../../app/core/data_config/assessment_configs/ID-FACR-v1.yaml"

    with open(yaml_path, "r") as f:
        yaml_content = f.read()

    # Escape single quotes for SQL
    yaml_content_escaped = yaml_content.replace("'", "''")

    # Insert new assessment config
    op.execute(f"""
        INSERT INTO assessmentconfig (
            id, created_at, updated_at, state_code, code, version,
            display_name, description, config_yaml, is_active
        ) VALUES (
            gen_random_uuid(),
            NOW(),
            NOW(),
            'US_IX',
            'facr',
            1,
            'Facility Reentry assessment',
            'Assessment for clients in Idaho',
            '{yaml_content_escaped}',
            false
        )
    """)

    # Deactivate all other versions of this assessment config
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = false
        WHERE code = 'facr' AND version != 1
    """)

    # Activate the new version
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE code = 'facr' AND version = 1
    """)


def downgrade() -> None:
    # Delete the new version
    op.execute("""
        DELETE FROM assessmentconfig
        WHERE code = 'facr' AND version = 1
    """)

    # Reactivate the most recent previous version (if any exists)
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE code = 'facr'
        AND version = (
            SELECT MAX(version)
            FROM assessmentconfig
            WHERE code = 'facr' AND version < 1
        )
    """)
