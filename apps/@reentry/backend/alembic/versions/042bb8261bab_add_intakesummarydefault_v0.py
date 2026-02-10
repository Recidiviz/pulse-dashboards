"""add_intakesummarydefault_v0

Revision ID: 042bb8261bab
Revises: 8bd25ebbc716
Create Date: 2025-10-29 16:55:06.685356

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '042bb8261bab'
down_revision: Union[str, None] = '8bd25ebbc716'
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
