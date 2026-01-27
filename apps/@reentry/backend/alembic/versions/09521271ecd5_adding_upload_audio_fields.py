"""Adding upload audio fields

Revision ID: 09521271ecd5
Revises: 3ffae4d2946d
Create Date: 2026-01-26 18:20:48.933346

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09521271ecd5'
down_revision: Union[str, None] = '3ffae4d2946d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'recording_session',
        sa.Column('needs_audio_merge', sa.Boolean(), nullable=False, server_default=sa.text('true'))
    )


def downgrade() -> None:
    op.drop_column('recording_session', 'needs_audio_merge')
