"""add_output_config_eval_result

Revision ID: d1e2f3a4b5c6
Revises: 20f66307c5f8
Create Date: 2026-04-20 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, None] = "20f66307c5f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "output_config_eval_result",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("output_config_id", sa.Uuid(), nullable=False),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("execution_id", sa.Uuid(), nullable=True),
        sa.Column("created_by_email", sa.String(), nullable=True),
        sa.Column("ran_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["execution_id"], ["execution.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_output_config_eval_result_output_config_id",
        "output_config_eval_result",
        ["output_config_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_output_config_eval_result_output_config_id",
        table_name="output_config_eval_result",
    )
    op.drop_table("output_config_eval_result")
