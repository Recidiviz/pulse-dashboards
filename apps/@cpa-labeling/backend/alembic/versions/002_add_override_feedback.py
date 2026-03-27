"""Add override_feedback column

Revision ID: 002
Revises: 001
Create Date: 2026-02-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'labeling_feedback',
        sa.Column('override_feedback', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('labeling_feedback', 'override_feedback')
