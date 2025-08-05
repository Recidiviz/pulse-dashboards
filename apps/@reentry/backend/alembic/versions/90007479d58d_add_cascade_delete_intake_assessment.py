"""add_cascade_delete_intake_assessment

Revision ID: 90007479d58d
Revises: b920cd908db2
Create Date: 2025-05-27 18:34:46.310757

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90007479d58d'
down_revision: Union[str, None] = 'b920cd908db2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the existing foreign key constraint
    op.drop_constraint('assessment_intake_id_fkey', 'assessment', type_='foreignkey')

    # Recreate it with CASCADE DELETE
    op.create_foreign_key(
        'assessment_intake_id_fkey',
        'assessment',
        'intake',
        ['intake_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop the CASCADE constraint
    op.drop_constraint('assessment_intake_id_fkey', 'assessment', type_='foreignkey')

    # Recreate the original constraint without CASCADE
    op.create_foreign_key(
        'assessment_intake_id_fkey',
        'assessment',
        'intake',
        ['intake_id'],
        ['id']
    )
