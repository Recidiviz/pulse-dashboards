"""empty message

Revision ID: d2d038f77af4
Revises: 5866d6491010, 5eb9b0f3b6d9
Create Date: 2025-09-03 15:53:58.039107

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2d038f77af4'
down_revision: Union[str, None] = ('5866d6491010', '5eb9b0f3b6d9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
