"""update_client_intake_section_to_reference_revision

Revision ID: 9e92dbabd95c
Revises: 1c86197d69e7
Create Date: 2025-06-11 18:55:17.891497

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e92dbabd95c'
down_revision: Union[str, None] = '1c86197d69e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new column for intake section revision reference
    op.add_column('clientintakesection', sa.Column('intake_section_revision_id', sa.Uuid(), nullable=True))

    # Add foreign key constraint for the new column
    op.create_foreign_key(
        'fk_client_intake_section_revision_id',
        'clientintakesection', 'intake_section_revision',
        ['intake_section_revision_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Remove foreign key constraint
    op.drop_constraint('fk_client_intake_section_revision_id', 'clientintakesection', type_='foreignkey')

    # Remove the revision reference column
    op.drop_column('clientintakesection', 'intake_section_revision_id')
