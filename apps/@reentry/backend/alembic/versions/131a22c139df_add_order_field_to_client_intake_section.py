"""add_order_field_to_client_intake_section

Revision ID: 131a22c139df
Revises: c2110adc880e
Create Date: 2025-04-04 12:21:17.824841

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '131a22c139df'
down_revision: Union[str, None] = 'c2110adc880e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add order column with default value 0
    op.add_column('clientintakesection', sa.Column('order', sa.Integer(), nullable=False, server_default='0'))

    # Update existing records to set the order based on id
    op.execute("""
    UPDATE clientintakesection
    SET "order" = subquery.row_num - 1
    FROM (
        SELECT id, intake_id, ROW_NUMBER() OVER (PARTITION BY intake_id ORDER BY id) as row_num
        FROM clientintakesection
    ) as subquery
    WHERE clientintakesection.id = subquery.id
    """)


def downgrade() -> None:
    # Remove the order column
    op.drop_column('clientintakesection', 'order')
