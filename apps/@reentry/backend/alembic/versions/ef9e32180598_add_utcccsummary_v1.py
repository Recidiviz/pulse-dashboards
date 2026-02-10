"""add_utcccsummary_v1

Revision ID: ef9e32180598
Revises: 9e9ab887be0a
Create Date: 2026-02-06 10:14:40.417055

No-op: config versions are now managed via the config management UI.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'ef9e32180598'
down_revision: Union[str, None] = '9e9ab887be0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
