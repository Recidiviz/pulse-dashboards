"""add_nd_default_v0

Revision ID: 0de3cec45123
Revises: d3e5ba0cd6c9
Create Date: 2026-01-23 14:20:34.620594

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0de3cec45123'
down_revision: Union[str, None] = 'd3e5ba0cd6c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Read YAML file from codebase
    yaml_path = Path(__file__).parent / "../../app/core/data_config/assessment_configs/ND-default-v0.yaml"

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
            'US_ND',
            'default',
            0,
            'Parole & Probation Intake',
            'Intake assessment for P&P clients in North Dakota',
            '{yaml_content_escaped}',
            false
        )
    """)

    # Deactivate all other versions of this assessment config
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = false
        WHERE state_code = 'US_ND' AND code = 'default' AND version != 0
    """)

    # Activate the new version
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_ND' AND code = 'default' AND version = 0
    """)


def downgrade() -> None:
    # Delete the new version
    op.execute("""
        DELETE FROM assessmentconfig
        WHERE state_code = 'US_ND' AND code = 'default' AND version = 0
    """)

    # Reactivate the most recent previous version (if any exists)
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_ND' AND code = 'default'
        AND version = (
            SELECT MAX(version)
            FROM assessmentconfig
            WHERE state_code = 'US_ND' AND code = 'default' AND version < 0
        )
    """)
