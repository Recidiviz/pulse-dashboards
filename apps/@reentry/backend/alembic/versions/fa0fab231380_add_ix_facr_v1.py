"""add_ix_facr_v1

Revision ID: fa0fab231380
Revises: 60ba1d77289e
Create Date: 2026-01-06 14:56:40.159503

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa0fab231380'
down_revision: Union[str, None] = '60ba1d77289e'
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
