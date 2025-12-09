"""add_az_default_v0

Create Date: 2025-10-28 16:06:51.595414

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a49628a6f57c'
down_revision: Union[str, None] = '25c5c0f1e527'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Read YAML file from codebase
    yaml_path = Path(__file__).parent / "../../app/core/data_config/assessment_configs/AZ-default-v0.yaml"

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
            'US_AZ',
            'default',
            0,
            'Arizona Intake',
            'Intake assessment for clients in Utah',
            '{yaml_content_escaped}',
            false
        )
    """)

    # Deactivate all other versions of this assessment config
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = false
        WHERE code = 'default' AND version != 0
    """)

    # Activate the new version
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE code = 'default' AND version = 0
    """)


def downgrade() -> None:
    # Delete the new version
    op.execute("""
        DELETE FROM assessmentconfig
        WHERE code = 'default' AND version = 0
    """)

    # Reactivate the most recent previous version (if any exists)
    op.execute("""
        UPDATE assessmentconfig
        SET is_active = true
        WHERE code = 'default'
        AND version = (
            SELECT MAX(version)
            FROM assessmentconfig
            WHERE code = 'default' AND version < 0
        )
    """)
