"""add_ut_ccci_v1

Revision ID: ec8bcb2f320a
Revises: fa0fab231380
Create Date: 2026-01-06 14:56:53.596235

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec8bcb2f320a'
down_revision: Union[str, None] = 'fa0fab231380'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Read YAML file from codebase
    yaml_path = Path(__file__).parent / "../../app/core/data_config/assessment_configs/UT-CCCI-v1.yaml"

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
            'US_UT',
            'ccci',
            1,
            'Community Correctional Center Intake',
            'Intake assessment for clients at Utah community correctional centers',
            '{yaml_content_escaped}',
            false
        )
    """)

    # Deactivate all other versions of this assessment config
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = false
        WHERE code = 'ccci' AND version != 1
    """)

    # Activate the new version
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE code = 'ccci' AND version = 1
    """)


def downgrade() -> None:
    # Delete the new version
    op.execute("""
        DELETE FROM assessmentconfig
        WHERE code = 'ccci' AND version = 1
    """)

    # Reactivate the most recent previous version (if any exists)
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE code = 'ccci'
        AND version = (
            SELECT MAX(version)
            FROM assessmentconfig
            WHERE code = 'ccci' AND version < 1
        )
    """)
