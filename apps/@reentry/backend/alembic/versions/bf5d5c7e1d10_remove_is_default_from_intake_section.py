"""remove_is_default_from_intake_section

Revision ID: bf5d5c7e1d10
Revises: e00a16727f8b
Create Date: 2025-06-09 19:49:05.385188

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf5d5c7e1d10'
down_revision: Union[str, None] = 'e00a16727f8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove is_default column from intakesection table
    op.drop_column('intakesection', 'is_default')


def downgrade() -> None:
    # Add back is_default column with default value True
    op.add_column('intakesection', sa.Column('is_default', sa.Boolean(), nullable=False, server_default='true'))
