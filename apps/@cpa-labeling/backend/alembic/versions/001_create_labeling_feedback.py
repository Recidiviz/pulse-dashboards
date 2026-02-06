"""Create labeling_feedback table

Revision ID: 001
Revises:
Create Date: 2026-01-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'labeling_feedback',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),

        # References to reentry database (no foreign key constraints)
        sa.Column('intake_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('plan_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('evaluator', sa.String(length=255), nullable=False),

        # Overall feedback - Transcript
        sa.Column('transcript_factual_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('transcript_factual_notes', sa.String(length=5000), nullable=True),
        sa.Column('transcript_tone_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('transcript_tone_notes', sa.String(length=5000), nullable=True),
        sa.Column('transcript_other_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('transcript_other_notes', sa.String(length=5000), nullable=True),

        # Overall feedback - Summary
        sa.Column('summary_factual_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('summary_factual_notes', sa.String(length=5000), nullable=True),
        sa.Column('summary_tone_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('summary_tone_notes', sa.String(length=5000), nullable=True),
        sa.Column('summary_other_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('summary_other_notes', sa.String(length=5000), nullable=True),

        # Overall feedback - Plan
        sa.Column('plan_factual_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('plan_factual_notes', sa.String(length=5000), nullable=True),
        sa.Column('plan_tone_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('plan_tone_notes', sa.String(length=5000), nullable=True),
        sa.Column('plan_other_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('plan_other_notes', sa.String(length=5000), nullable=True),

        # Detailed feedback as JSON
        sa.Column('transcript_detail_feedback', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('summary_detail_feedback', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('plan_detail_feedback', postgresql.JSONB(astext_type=sa.Text()), nullable=True),

        # Legacy fields
        sa.Column('transcript_needs_review', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('transcript_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('transcript_notes', sa.String(length=5000), nullable=True),
        sa.Column('summary_needs_review', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('summary_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('summary_notes', sa.String(length=5000), nullable=True),
        sa.Column('plan_needs_review', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('plan_severity', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('plan_notes', sa.String(length=5000), nullable=True),
        sa.Column('overall_notes', sa.String(length=5000), nullable=True),

        sa.PrimaryKeyConstraint('id'),
    )

    # Create indexes
    op.create_index('ix_labeling_feedback_intake_id', 'labeling_feedback', ['intake_id'])
    op.create_index('ix_labeling_feedback_plan_id', 'labeling_feedback', ['plan_id'])
    op.create_index('ix_labeling_feedback_evaluator', 'labeling_feedback', ['evaluator'])

    # Create unique constraint
    op.create_unique_constraint(
        'uq_labeling_feedback_intake_evaluator',
        'labeling_feedback',
        ['intake_id', 'evaluator']
    )


def downgrade() -> None:
    op.drop_constraint('uq_labeling_feedback_intake_evaluator', 'labeling_feedback', type_='unique')
    op.drop_index('ix_labeling_feedback_evaluator', 'labeling_feedback')
    op.drop_index('ix_labeling_feedback_plan_id', 'labeling_feedback')
    op.drop_index('ix_labeling_feedback_intake_id', 'labeling_feedback')
    op.drop_table('labeling_feedback')
