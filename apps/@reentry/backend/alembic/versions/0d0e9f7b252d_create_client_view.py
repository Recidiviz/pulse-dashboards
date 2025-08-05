"""fix_client_view_ordering

Revision ID: 0d0e9f7b252d
Revises: 4d9775c687df
Create Date: 2025-03-31 16:41:33.013440

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d0e9f7b252d'
down_revision: Union[str, None] = '4d9775c687df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the existing view
    op.execute("""DROP VIEW IF EXISTS client_view;""")

    # Create the updated view with improved process stage ordering
    op.execute("""
    CREATE OR REPLACE VIEW client_view AS
    -- INTAKE CLIENTS (earliest in process): Order values 10-30
    SELECT
        i.client_id,
        i.id AS intake_id,
        i.status::text AS intake_status,
        CASE i.status::text
            WHEN 'created' THEN 1
            WHEN 'in_progress' THEN 2
            WHEN 'paused' THEN 3
            WHEN 'error' THEN 4
            WHEN 'system_error' THEN 5
            WHEN 'needs_human' THEN 6
            WHEN 'review' THEN 7
            WHEN 'completed' THEN 8
            WHEN 'transferred' THEN 9
            ELSE 10
        END AS intake_order,
        CASE
            WHEN i.status::text = 'created' THEN 10   -- Lowest priority - show at top
            WHEN i.status::text = 'in_progress' THEN 15
            WHEN i.status::text = 'paused' THEN 20
            WHEN i.status::text IN ('error', 'system_error', 'needs_human', 'review') THEN 25
            WHEN i.status::text = 'completed' THEN 30
            ELSE 100
        END AS process_stage_order
    FROM
        intake i
    WHERE
        -- For intake clients, only include those without assessments or with incomplete assessments
        NOT EXISTS (
            SELECT 1 FROM assessment a
            LEFT JOIN execution e ON a.execution_id = e.id
            WHERE a.client_id = i.client_id AND e.status = 'completed'
        )

    UNION

    -- ASSESSMENT CLIENTS (middle of process): Order values 40-60
    SELECT
        a.client_id,
        NULL AS intake_id,
        NULL AS intake_status,
        999 AS intake_order,
        CASE
            WHEN a.execution_id IS NULL THEN 40           -- Assessment created
            WHEN e.status = 'pending' THEN 45             -- Assessment pending
            WHEN e.status = 'in_progress' THEN 50         -- Assessment in progress
            WHEN e.status = 'completed' THEN 60           -- Assessment completed
            ELSE 55                                        -- Other status (failed, etc.)
        END AS process_stage_order
    FROM
        assessment a
    LEFT JOIN
        execution e ON a.execution_id = e.id
    WHERE
        -- Include completed intake clients with assessments
        EXISTS (
            SELECT 1 FROM intake i
            WHERE i.client_id = a.client_id AND i.status = 'completed'
        )
        -- For assessment clients, only include those without plans or with incomplete plans
        AND NOT EXISTS (
            SELECT 1 FROM plan p
            LEFT JOIN execution e ON p.create_execution_id = e.id
            WHERE p.client_id = a.client_id AND e.status = 'completed'
        )

    UNION

    -- PLAN CLIENTS (latest in process): Order values 70-90
    SELECT
        p.client_id,
        NULL AS intake_id,
        NULL AS intake_status,
        999 AS intake_order,
        CASE
            WHEN p.create_execution_id IS NULL THEN 70     -- Plan created
            WHEN e.status = 'pending' THEN 75              -- Plan pending
            WHEN e.status = 'in_progress' THEN 80          -- Plan in progress
            WHEN e.status = 'completed' THEN 90            -- Plan completed
            ELSE 85                                         -- Other status (failed, etc.)
        END AS process_stage_order
    FROM
        plan p
    LEFT JOIN
        execution e ON p.create_execution_id = e.id
    WHERE
        -- Include completed intake clients with plans
        EXISTS (
            SELECT 1 FROM intake i
            WHERE i.client_id = p.client_id AND i.status = 'completed'
        )
        -- Include completed assessment clients with plans
        AND EXISTS (
            SELECT 1 FROM assessment a
            LEFT JOIN execution e ON a.execution_id = e.id
            WHERE a.client_id = p.client_id AND e.status = 'completed'
        )
    """)


def downgrade() -> None:
    # Drop the updated view
    op.execute("""DROP VIEW IF EXISTS client_view;""")
