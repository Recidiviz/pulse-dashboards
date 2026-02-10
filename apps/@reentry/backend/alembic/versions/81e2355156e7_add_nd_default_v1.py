"""add_nd_default_v1

Revision ID: 81e2355156e7
Revises: 3bd66a29411c
Create Date: 2026-01-27 18:16:47.440850

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81e2355156e7'
down_revision: Union[str, None] = '3bd66a29411c'
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
