"""add_updated_at_to_intake_section_revision

Revision ID: 1d5a4a5adae8
Revises: 9e92dbabd95c
Create Date: 2025-06-11 19:31:52.206320

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1d5a4a5adae8'
down_revision: Union[str, None] = '9e92dbabd95c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
