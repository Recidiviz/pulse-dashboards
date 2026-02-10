"""add_ut_ccci_v6

Revision ID: d176b60ddb60
Revises: 17301befb5e9
Create Date: 2026-02-06 10:12:36.703776

No-op: config versions are now managed via the config management UI.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'd176b60ddb60'
down_revision: Union[str, None] = '17301befb5e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
