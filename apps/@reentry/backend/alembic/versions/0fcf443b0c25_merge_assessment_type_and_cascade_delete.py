"""merge assessment_type and cascade delete

Revision ID: 0fcf443b0c25
Revises: 1b73be1e6e36, 90007479d58d
Create Date: 2025-06-02 11:21:43.469575

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0fcf443b0c25'
down_revision: Union[str, None] = ('1b73be1e6e36', '90007479d58d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
