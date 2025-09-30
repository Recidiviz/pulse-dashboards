import subprocess
from pathlib import Path

import sqlalchemy
from sqlmodel import SQLModel, select

from app.core.db import engine, get_session_async_manager

from ..models.assessment import AssessmentType
from .base import cli
from .import_assessment_tree import (
    import_assessment_trees,
    import_assessment_trees_selective,
)
from .import_decision_tree import import_decision_trees, import_decision_trees_selective


async def db_is_empty():
    async with engine.connect() as conn:
        for table in SQLModel.metadata.tables.values():
            query = select(table)
            result = await conn.execute(query)
            if result.first() is not None:
                print(f"! Table {table} is not empty")
                return False
    return True


async def db_drop_and_recreate():
    # First drop any views (which are not tracked by SQLModel metadata)
    async with engine.begin() as conn:
        # Drop the client_view and any other views that might depend on tables
        await conn.execute(sqlalchemy.text("DROP VIEW IF EXISTS client_view CASCADE;"))
        # Then drop all tables
        await conn.run_sync(SQLModel.metadata.drop_all)
        # And recreate them
        await conn.run_sync(SQLModel.metadata.create_all)

        # Recreate the client_view
        await conn.execute(
            sqlalchemy.text("""
                CREATE OR REPLACE VIEW client_view AS
                -- INTAKE CLIENTS (earliest in process): Order values 10-30
                SELECT
                    i.client_pseudo_id,
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
                        WHERE a.client_pseudo_id = i.client_pseudo_id AND e.status = 'completed'
                    )
                UNION
                -- ASSESSMENT CLIENTS (middle of process): Order values 40-60
                SELECT
                    a.client_pseudo_id,
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
                        WHERE i.client_pseudo_id = a.client_pseudo_id AND i.status = 'completed'
                    )
                    -- For assessment clients, only include those without plans or with incomplete plans
                    AND NOT EXISTS (
                        SELECT 1 FROM plan p
                        LEFT JOIN execution e ON p.create_execution_id = e.id
                        WHERE p.client_pseudo_id = a.client_pseudo_id AND e.status = 'completed'
                    )
                UNION
                -- PLAN CLIENTS (latest in process): Order values 70-90
                SELECT
                    p.client_pseudo_id,
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
                        WHERE i.client_pseudo_id = p.client_pseudo_id AND i.status = 'completed'
                    )
                    -- Include completed assessment clients with plans
                    AND EXISTS (
                        SELECT 1 FROM assessment a
                        LEFT JOIN execution e ON a.execution_id = e.id
                        WHERE a.client_pseudo_id = p.client_pseudo_id AND e.status = 'completed'
                    )
                """)
        )

    # because we did it manually, we need to stamp alembic to indicate
    # that the database is up to date
    # execute via command line: alembic stamp head
    subprocess.run(["alembic", "stamp", "head"], check=True)


async def seed_db_selective():
    """
    Selective seeding that preserves user data while updating system components.
    Only updates trees and sections when content has actually changed.
    """
    print("Starting selective database seeding...")
    print("This will preserve existing intakes, assessments, and plans.")

    # Seed intake sections (selective mode)
    async with get_session_async_manager() as session:
        from app.manage.intake import seed_sections_selective

        await seed_sections_selective(session)

    # Seed decision trees (selective mode)
    print("Seeding decision trees (selective mode)")
    app_directory = Path(__file__).parent.parent
    dt_directory = app_directory / "core" / "data_config" / "decisiontrees"
    await import_decision_trees_selective(list(dt_directory.glob("*.mermaid")))

    # Seed assessment trees (selective mode)
    print("Seeding assessment trees (selective mode)")

    # LSIR TREES ASSESSMENT
    at_directory = app_directory / "core" / "data_config" / "assessmenttrees" / "LSIR"
    await import_assessment_trees_selective(
        filepaths=list(at_directory.glob("*.mermaid")),
        assessment_type=AssessmentType.LSIR,
    )

    # ORAS TREES ASSESSMENT
    at_directory = (
        app_directory / "core" / "data_config" / "assessmenttrees" / "ORAS_PIT"
    )
    await import_assessment_trees_selective(
        filepaths=list(at_directory.glob("*.mermaid")),
        assessment_type=AssessmentType.ORAS_PIT,
    )

    at_directory = (
        app_directory / "core" / "data_config" / "assessmenttrees" / "ORAS_RT"
    )
    await import_assessment_trees_selective(
        filepaths=list(at_directory.glob("*.mermaid")),
        assessment_type=AssessmentType.ORAS_RT,
    )

    print("Selective seeding completed successfully!")
    print("All user data (intakes, assessments, plans) has been preserved.")


@cli.command()
async def seed_db(force: bool = False):
    """
    Seed the database with system components.

    Args:
        force: If True, drops and recreates the entire database.
               If False, uses selective seeding to preserve user data.
    """
    print("Check if the database is not empty")
    is_empty = await db_is_empty()

    if not is_empty and not force:
        print("Database is not empty. Using selective seeding mode.")
        print("This will preserve existing intakes, assessments, and plans.")
        print("Use --force to drop and recreate the database instead.")
        await seed_db_selective()
        return

    if force and not is_empty:
        print("Database is not empty, but force is enabled")
        print("Dropping and recreating the database")
        await db_drop_and_recreate()
    elif is_empty:
        print("Database is empty, proceeding with fresh seeding")

    async with get_session_async_manager() as session:
        from app.manage.intake import seed_sections_selective

        await seed_sections_selective(session)

    print("Seeding database with example decision trees")
    app_directory = Path(__file__).parent.parent
    dt_directory = app_directory / "core" / "data_config" / "decisiontrees"
    await import_decision_trees(list(dt_directory.glob("*.mermaid")))

    # LSIR TREES ASSESSMENT
    at_directory = app_directory / "core" / "data_config" / "assessmenttrees" / "LSIR"
    await import_assessment_trees(
        filepaths=list(at_directory.glob("*.mermaid")),
        assessment_type=AssessmentType.LSIR,
    )

    # ORAS TREES ASSESSMENT
    at_directory = (
        app_directory / "core" / "data_config" / "assessmenttrees" / "ORAS_PIT"
    )
    await import_assessment_trees(
        filepaths=list(at_directory.glob("*.mermaid")),
        assessment_type=AssessmentType.ORAS_PIT,
    )

    at_directory = (
        app_directory / "core" / "data_config" / "assessmenttrees" / "ORAS_RT"
    )
    await import_assessment_trees(
        filepaths=list(at_directory.glob("*.mermaid")),
        assessment_type=AssessmentType.ORAS_RT,
    )

    print("Seeding completed.")


@cli.command()
async def bulk_assessment_trees():
    app_directory = Path(__file__).parent.parent
    at_directory = app_directory / ".." / "data" / "examples" / "assessmenttrees"
    await import_assessment_trees(list(at_directory.glob("*.mermaid")), True)
