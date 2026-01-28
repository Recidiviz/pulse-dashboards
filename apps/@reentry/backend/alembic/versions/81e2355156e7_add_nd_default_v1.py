"""add_nd_default_v1

Revision ID: 81e2355156e7
Revises: 3bd66a29411c
Create Date: 2026-01-27 18:16:47.440850

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81e2355156e7'
down_revision: Union[str, None] = '3bd66a29411c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Read YAML file from codebase
    yaml_path = Path(__file__).parent / "../../app/core/data_config/assessment_configs/default-v1-US_ND.yaml"

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
            1,
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
        WHERE state_code = 'US_ND' AND code = 'default' AND version != 1
    """)

    # Activate the new version
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_ND' AND code = 'default' AND version = 1
    """)


def downgrade() -> None:
    # Delete the new version
    op.execute("""
        DELETE FROM assessmentconfig
        WHERE state_code = 'US_ND' AND code = 'default' AND version = 1
    """)

    # Reactivate the most recent previous version (if any exists)
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_ND' AND code = 'default'
        AND version = (
            SELECT MAX(version)
            FROM assessmentconfig
            WHERE state_code = 'US_ND' AND code = 'default' AND version < 1
        )
    """)
