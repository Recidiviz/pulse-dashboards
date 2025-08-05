"""update_assessment_intake_fk_constraint

Revision ID: e2c9f2b0230d
Revises: 131a22c139df
Create Date: 2025-04-10 17:08:48.991343

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e2c9f2b0230d'
down_revision: Union[str, None] = '131a22c139df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the existing foreign key constraint
    op.drop_constraint('assessment_intake_id_fkey', 'assessment', type_='foreignkey')

    # Re-create the foreign key constraint with ON DELETE SET NULL
    op.create_foreign_key(
        'assessment_intake_id_fkey',
        'assessment', 'intake',
        ['intake_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Drop the modified foreign key constraint
    op.drop_constraint('assessment_intake_id_fkey', 'assessment', type_='foreignkey')

    # Re-create the original foreign key constraint without ON DELETE SET NULL
    op.create_foreign_key(
        'assessment_intake_id_fkey',
        'assessment', 'intake',
        ['intake_id'], ['id']
    )
