"""add_utcccap_v0

Revision ID: 9e9ab887be0a
Revises: d176b60ddb60
Create Date: 2026-02-06 10:14:21.282367

No-op: config versions are now managed via the config management UI.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '9e9ab887be0a'
down_revision: Union[str, None] = 'd176b60ddb60'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
