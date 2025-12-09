"""empty message

Revision ID: 2314f2d12fd6
Revises: 4e424a4f4e3a, 7b17313463e0
Create Date: 2025-12-05 13:57:56.801786

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2314f2d12fd6'
down_revision: Union[str, None] = ('4e424a4f4e3a', '7b17313463e0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
