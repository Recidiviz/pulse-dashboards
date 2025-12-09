"""empty message

Revision ID: 7b17313463e0
Revises: 8fe8527ba3ca, b535bf840354
Create Date: 2025-11-20 15:21:23.841521

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b17313463e0'
down_revision: Union[str, None] = ('8fe8527ba3ca', 'b535bf840354')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
