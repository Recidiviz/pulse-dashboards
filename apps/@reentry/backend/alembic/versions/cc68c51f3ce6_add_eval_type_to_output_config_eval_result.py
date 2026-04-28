"""add_eval_type_to_output_config_eval_result

Revision ID: cc68c51f3ce6
Revises: 35d2d0b55695
Create Date: 2026-04-27 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "cc68c51f3ce6"
down_revision: Union[str, None] = "35d2d0b55695"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ADD COLUMN with a server_default backfills all existing rows in PostgreSQL.
    # Existing rows are all summary evals, so 'intake_summary' is correct for them.
    # We drop the server_default afterward so the application always supplies the value.
    op.add_column(
        "output_config_eval_result",
        sa.Column(
            "eval_type",
            sa.String(),
            nullable=False,
            server_default="intake_summary",
        ),
    )
    op.alter_column("output_config_eval_result", "eval_type", server_default=None)


def downgrade() -> None:
    op.drop_column("output_config_eval_result", "eval_type")
