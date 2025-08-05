"""add_content_hash_to_revisions

Revision ID: 44f4ed232e35
Revises: 284ac3721439
Create Date: 2025-06-10 13:46:51.634134

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44f4ed232e35'
down_revision: Union[str, None] = '284ac3721439'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add content_hash column to assessmenttreerevision table
    op.add_column('assessmenttreerevision', sa.Column('content_hash', sa.String(), nullable=True))

    # Add content_hash column to decisiontreerevision table
    op.add_column('decisiontreerevision', sa.Column('content_hash', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove content_hash column from decisiontreerevision table
    op.drop_column('decisiontreerevision', 'content_hash')

    # Remove content_hash column from assessmenttreerevision table
    op.drop_column('assessmenttreerevision', 'content_hash')
