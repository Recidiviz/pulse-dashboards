# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================
"""add_resource_type_to_plan_generation_resource_association

Revision ID: 69a7439e23d5
Revises: 2e6e648aced5
Create Date: 2026-05-01 11:59:17.249284

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69a7439e23d5'
down_revision: Union[str, None] = '2e6e648aced5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the enum type explicitly first — SQLAlchemy does not auto-create it
    # when a server_default is present on the column.
    op.execute("CREATE TYPE resource_association_type_enum AS ENUM ('COMMUNITY', 'DIGITAL')")
    # ADD COLUMN with a server_default backfills all existing rows in PostgreSQL.
    # Existing rows are all community resources, so 'COMMUNITY' is correct for them.
    # We drop the server_default afterward so the application always supplies the value.
    op.add_column('plangenerationresourceassociation', sa.Column('resource_type', sa.Enum('COMMUNITY', 'DIGITAL', name='resource_association_type_enum', create_type=False), nullable=False, server_default='COMMUNITY'))
    op.alter_column('plangenerationresourceassociation', 'resource_type', server_default=None)


def downgrade() -> None:
    op.drop_column('plangenerationresourceassociation', 'resource_type')
    op.execute("DROP TYPE resource_association_type_enum")
