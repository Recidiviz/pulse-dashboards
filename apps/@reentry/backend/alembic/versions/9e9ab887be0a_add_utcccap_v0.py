"""add_utcccap_v0

Revision ID: 9e9ab887be0a
Revises: d176b60ddb60
Create Date: 2026-02-06 10:14:21.282367

"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e9ab887be0a'
down_revision: Union[str, None] = 'd176b60ddb60'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Read YAML file from codebase
    yaml_path = Path(__file__).parent / "../../app/core/data_config/output_configs/output-utcccap-v0.yaml"

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
            'action_plan',
            'utcccap',
            0,
            'Action Plan',
            NULL,
            '{yaml_content_escaped}',
            false
        )
    """)

    # Deactivate all other versions of this output config
    op.execute("""
        UPDATE outputconfig
        SET is_active = false
        WHERE code = 'utcccap' AND version != 0
    """)

    # Activate the new version
    op.execute("""
        UPDATE outputconfig
        SET is_active = true
        WHERE code = 'utcccap' AND version = 0
    """)


def downgrade() -> None:
    # Delete the new version
    op.execute("""
        DELETE FROM outputconfig
        WHERE code = 'utcccap' AND version = 0
    """)

    # Reactivate the most recent previous version (if any exists)
    op.execute("""
        UPDATE outputconfig
        SET is_active = true
        WHERE code = 'utcccap'
        AND version = (
            SELECT MAX(version)
            FROM outputconfig
            WHERE code = 'utcccap' AND version < 0
        )
    """)
