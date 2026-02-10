"""Add config management fields

Revision ID: e4f5a6b7c8d9
Revises: b8cbb19631ca
Create Date: 2026-01-28 10:00:00.000000

Config Lifecycle States:
- DRAFT: Work in progress, editable
- ACTIVE: Currently in use (only one per config code)
- INACTIVE: Previously active, now replaced or deactivated
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e4f5a6b7c8d9"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add config management columns to assessmentconfig table
    op.add_column(
        "assessmentconfig",
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="draft",
        ),
    )
    op.add_column(
        "assessmentconfig",
        sa.Column("created_by_email", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "assessmentconfig",
        sa.Column("activated_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "assessmentconfig",
        sa.Column("activated_by_email", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "assessmentconfig",
        sa.Column("imported_from_env", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "assessmentconfig",
        sa.Column("import_hash", sa.String(length=64), nullable=True),
    )
    op.create_index(
        "idx_assessment_config_status",
        "assessmentconfig",
        ["status"],
        unique=False,
    )

    # Add config management columns to outputconfig table
    op.add_column(
        "outputconfig",
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="draft",
        ),
    )
    op.add_column(
        "outputconfig",
        sa.Column("created_by_email", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "outputconfig",
        sa.Column("activated_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "outputconfig",
        sa.Column("activated_by_email", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "outputconfig",
        sa.Column("imported_from_env", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "outputconfig",
        sa.Column("import_hash", sa.String(length=64), nullable=True),
    )
    op.create_index(
        "idx_output_config_status",
        "outputconfig",
        ["status"],
        unique=False,
    )

    # Create config_audit_log table
    op.create_table(
        "config_audit_log",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("config_type", sa.String(length=20), nullable=False),
        sa.Column("config_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("performed_by_email", sa.String(length=255), nullable=False),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_config_audit_log_config",
        "config_audit_log",
        ["config_type", "config_id"],
        unique=False,
    )
    op.create_index(
        "idx_config_audit_log_action",
        "config_audit_log",
        ["action", "created_at"],
        unique=False,
    )

    # Set status and activated_at for existing configs based on is_active flag
    # Active configs get 'active' status, inactive get 'inactive' status
    op.execute(
        """
        UPDATE assessmentconfig
        SET status = 'active', activated_at = updated_at
        WHERE is_active = true
        """
    )
    op.execute(
        """
        UPDATE assessmentconfig
        SET status = 'inactive'
        WHERE is_active = false
        """
    )
    op.execute(
        """
        UPDATE outputconfig
        SET status = 'active', activated_at = updated_at
        WHERE is_active = true
        """
    )
    op.execute(
        """
        UPDATE outputconfig
        SET status = 'inactive'
        WHERE is_active = false
        """
    )


def downgrade() -> None:
    # Drop config_audit_log table
    op.drop_index("idx_config_audit_log_action", table_name="config_audit_log")
    op.drop_index("idx_config_audit_log_config", table_name="config_audit_log")
    op.drop_table("config_audit_log")

    # Drop config management columns from outputconfig
    op.drop_index("idx_output_config_status", table_name="outputconfig")
    op.drop_column("outputconfig", "import_hash")
    op.drop_column("outputconfig", "imported_from_env")
    op.drop_column("outputconfig", "activated_by_email")
    op.drop_column("outputconfig", "activated_at")
    op.drop_column("outputconfig", "created_by_email")
    op.drop_column("outputconfig", "status")

    # Drop config management columns from assessmentconfig
    op.drop_index("idx_assessment_config_status", table_name="assessmentconfig")
    op.drop_column("assessmentconfig", "import_hash")
    op.drop_column("assessmentconfig", "imported_from_env")
    op.drop_column("assessmentconfig", "activated_by_email")
    op.drop_column("assessmentconfig", "activated_at")
    op.drop_column("assessmentconfig", "created_by_email")
    op.drop_column("assessmentconfig", "status")
