"""add_ut_utappintake_v0

Revision ID: 98d62706bea9
Revises: 0de3cec45123
Create Date: 2026-01-26 16:09:34.933317

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '98d62706bea9'
down_revision: Union[str, None] = '0de3cec45123'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # DEPRECATED: Config YAML files are now managed via the Config Management UI.
    # This migration previously loaded from a YAML file that has been removed.
    # Existing databases already have this data; new databases should import
    # configs via the UI at /config.
    pass


def downgrade() -> None:
    # DEPRECATED: See upgrade() comment.
    pass
