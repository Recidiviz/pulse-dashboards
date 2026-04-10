"""add_guardrailed_by_and_false_positive_to_intakemessage

Revision ID: c52c45b26f4f
Revises: a2950cdeccb6
Create Date: 2026-04-09 11:37:02.152909

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c52c45b26f4f'
down_revision: Union[str, None] = 'a2950cdeccb6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "intakemessage",
        sa.Column("guardrailed_by", sa.JSON(), nullable=True),
    )
    op.add_column(
        "intakemessage",
        sa.Column(
            "false_positive",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("intakemessage", "false_positive")
    op.drop_column("intakemessage", "guardrailed_by")
