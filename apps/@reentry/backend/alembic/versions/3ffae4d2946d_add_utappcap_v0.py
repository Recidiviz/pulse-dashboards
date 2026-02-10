"""add_utappcap_v0

Revision ID: 3ffae4d2946d
Revises: 98d62706bea9
Create Date: 2026-01-26 16:11:45.846900

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3ffae4d2946d'
down_revision: Union[str, None] = '98d62706bea9'
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
