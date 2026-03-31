"""Add labeling_user_allowlist table

Revision ID: 003
Revises: 002
Create Date: 2026-03-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'labeling_user_allowlist',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_queue', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('state_codes', postgresql.ARRAY(sa.String()), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='uq_labeling_user_allowlist_email'),
    )
    op.create_index('ix_labeling_user_allowlist_email', 'labeling_user_allowlist', ['email'])


def downgrade() -> None:
    op.drop_index('ix_labeling_user_allowlist_email', table_name='labeling_user_allowlist')
    op.drop_table('labeling_user_allowlist')
