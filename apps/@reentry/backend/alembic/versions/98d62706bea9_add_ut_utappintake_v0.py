"""add_ut_utappintake_v0

Revision ID: 98d62706bea9
Revises: 0de3cec45123
Create Date: 2026-01-26 16:09:34.933317

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '98d62706bea9'
down_revision: Union[str, None] = '0de3cec45123'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Read YAML file from codebase
    yaml_path = Path(__file__).parent / "../../app/core/data_config/assessment_configs/UT-APP-v0.yaml"

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
            'utappintake',
            0,
            'AP&P Intake',
            'Intake assessment for clients at Utah probation and parole offices',
            '{yaml_content_escaped}',
            false
        )
    """)

    # Deactivate all other versions of this assessment config
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = false
        WHERE state_code = 'US_UT' AND code = 'utappintake' AND version != 0
    """)

    # Activate the new version
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_UT' AND code = 'utappintake' AND version = 0
    """)


def downgrade() -> None:
    # Delete the new version
    op.execute("""
        DELETE FROM assessmentconfig
        WHERE state_code = 'US_UT' AND code = 'utappintake' AND version = 0
    """)

    # Reactivate the most recent previous version (if any exists)
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE state_code = 'US_UT' AND code = 'utappintake'
        AND version = (
            SELECT MAX(version)
            FROM assessmentconfig
            WHERE state_code = 'US_UT' AND code = 'utappintake' AND version < 0
        )
    """)
