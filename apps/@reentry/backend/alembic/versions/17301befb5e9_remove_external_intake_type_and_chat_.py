"""remove_external_intake_type_and_chat_messages

Revision ID: 17301befb5e9
Revises: b8cbb19631ca
Create Date: 2026-01-28 17:25:42.758607

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '17301befb5e9'
down_revision: Union[str, None] = 'b8cbb19631ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Delete all intakes with type 'external' before modifying the enum
    op.execute("DELETE FROM intake WHERE intake_type = 'external'")

    # Drop the external_chat_messages column
    op.drop_column('intake', 'external_chat_messages')

    # Remove 'external' from intake_type_enum
    # PostgreSQL doesn't allow removing enum values directly, so we need to:
    # 1. Create a new enum without 'external'
    # 2. Alter the column to use the new enum
    # 3. Drop the old enum
    # 4. Rename the new enum to the old name

    op.execute("CREATE TYPE intake_type_enum_new AS ENUM ('transcription', 'conversation')")
    op.execute("ALTER TABLE intake ALTER COLUMN intake_type TYPE intake_type_enum_new USING intake_type::text::intake_type_enum_new")
    op.execute("DROP TYPE intake_type_enum")
    op.execute("ALTER TYPE intake_type_enum_new RENAME TO intake_type_enum")
    # ### end Alembic commands ###


def downgrade() -> None:
    # Recreate the enum with 'external' value
    op.execute("CREATE TYPE intake_type_enum_new AS ENUM ('transcription', 'conversation', 'external')")
    op.execute("ALTER TABLE intake ALTER COLUMN intake_type TYPE intake_type_enum_new USING intake_type::text::intake_type_enum_new")
    op.execute("DROP TYPE intake_type_enum")
    op.execute("ALTER TYPE intake_type_enum_new RENAME TO intake_type_enum")

    # Recreate the external_chat_messages column
    op.add_column('intake', sa.Column('external_chat_messages', postgresql.JSON(astext_type=sa.Text()), autoincrement=False, nullable=True))
    # ### end Alembic commands ###
