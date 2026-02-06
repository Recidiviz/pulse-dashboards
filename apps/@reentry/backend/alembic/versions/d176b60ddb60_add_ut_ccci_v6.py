"""add_ut_ccci_v6

Revision ID: d176b60ddb60
Revises: 17301befb5e9
Create Date: 2026-02-06 10:12:36.703776

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd176b60ddb60'
down_revision: Union[str, None] = '17301befb5e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Read YAML file from codebase
    yaml_path = Path(__file__).parent / "../../app/core/data_config/assessment_configs/assessment-UT-ccci-v6.yaml"

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
            6,
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
        WHERE state_code = 'US_UT' AND code = 'ccci' AND version != 6
    """)

    # Activate the new version
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_UT' AND code = 'ccci' AND version = 6
    """)


def downgrade() -> None:
    # Delete the new version
    op.execute("""
        DELETE FROM assessmentconfig
        WHERE state_code = 'US_UT' AND code = 'ccci' AND version = 6
    """)

    # Reactivate the most recent previous version (if any exists)
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_UT' AND code = 'ccci'
        AND version = (
            SELECT MAX(version)
            FROM assessmentconfig
            WHERE state_code = 'US_UT' AND code = 'ccci' AND version < 6
        )
    """)
