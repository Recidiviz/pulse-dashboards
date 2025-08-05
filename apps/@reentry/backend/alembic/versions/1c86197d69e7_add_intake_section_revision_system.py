"""add_intake_section_revision_system

Revision ID: 1c86197d69e7
Revises: 44f4ed232e35
Create Date: 2025-06-10 14:25:18.067682

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c86197d69e7'
down_revision: Union[str, None] = '44f4ed232e35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create intake_section_revision table without foreign key constraints first
    op.create_table('intake_section_revision',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('intake_section_id', sa.Uuid(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('required_information', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('content_hash', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Add current_revision_id and enabled columns to intakesection table
    op.add_column('intakesection', sa.Column('current_revision_id', sa.Uuid(), nullable=True))
    op.add_column('intakesection', sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'))

    # Now add foreign key constraints after both tables exist
    op.create_foreign_key(
        'fk_intake_section_revision_section_id',
        'intake_section_revision', 'intakesection',
        ['intake_section_id'], ['id']
    )

    op.create_foreign_key(
        'fk_intake_section_current_revision',
        'intakesection', 'intake_section_revision',
        ['current_revision_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Remove foreign key constraints first
    op.drop_constraint('fk_intake_section_current_revision', 'intakesection', type_='foreignkey')
    op.drop_constraint('fk_intake_section_revision_section_id', 'intake_section_revision', type_='foreignkey')

    # Remove columns from intakesection table
    op.drop_column('intakesection', 'enabled')
    op.drop_column('intakesection', 'current_revision_id')

    # Drop intake_section_revision table
    op.drop_table('intake_section_revision')
