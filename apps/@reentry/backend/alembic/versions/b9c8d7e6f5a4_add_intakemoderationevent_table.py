"""add_intakemoderationevent_table

Revision ID: b9c8d7e6f5a4
Revises: 69a7439e23d5
Create Date: 2026-05-27 00:00:00.000000

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


revision: str = "b9c8d7e6f5a4"
down_revision: Union[str, None] = "69a7439e23d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "intakemoderationevent",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("message_id", sa.Uuid(), nullable=False),
        sa.Column("action", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("staff_email", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.ForeignKeyConstraint(["message_id"], ["intakemessage.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_intakemoderationevent_message_id"),
        "intakemoderationevent",
        ["message_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_intakemoderationevent_message_id"),
        table_name="intakemoderationevent",
    )
    op.drop_table("intakemoderationevent")
