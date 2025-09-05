"""
Script to seed assessments in different states for demo purposes.
"""

from sqlmodel import select

from app.core.db import AsyncSession, get_session_async_manager
from app.models.assessment import Assessment
from app.models.execution import Execution, ExecutionStatus
from app.models.intake import Intake

from .base import cli


@cli.command("seed-demo-assessments")
async def seed_demo_assessments():
    """
    Seeds assessments in different states for demo clients
    """
    async with get_session_async_manager() as session:
        # Create assessments in different states
        await create_completed_assessment(session, "108734")  # Allistor Jones (SAM)
        await create_inprogress_assessment(session, "108141")  # Sharon Wood (AJ)
        await create_pending_assessment(session, "210806")  # Ashley Mitchell (Taylor)
        await create_failed_assessment(session, "170183")  # Thomas Miller

        print("All demo assessments created successfully")


async def create_completed_assessment(session: AsyncSession, client_pseudo_id: str):
    """Create a completed assessment with example data."""
    print(f"Creating completed assessment for client {client_pseudo_id}")

    # Get the client's intake
    intake = await session.exec(
        select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
    )
    intake_obj = intake.first()

    if not intake_obj:
        print(f"No intake found for client {client_pseudo_id}")
        return

    # Check if assessment already exists
    existing = await session.exec(
        select(Assessment).where(Assessment.client_pseudo_id == client_pseudo_id)
    )
    assessment = existing.first()

    if not assessment:
        print(f"Creating new assessment for client {client_pseudo_id}")
        # Create assessment
        assessment = Assessment(
            client_pseudo_id=client_pseudo_id,
            intake_id=intake_obj.id,
        )
        session.add(assessment)
        await session.flush()

        # Create execution with completed status
        execution = Execution(
            status=ExecutionStatus.COMPLETED,
            progress=100,
            message="Assessment completed successfully",
            table_name="assessment",
            table_entity_id=assessment.id,
        )
        session.add(execution)
        await session.flush()

        # Link execution to assessment
        assessment.execution_id = execution.id
        assessment.execution = execution

        # Add sample assessment results
        assessment.scores = {
            "Education / Employment": 7,
            "Criminal History": 5,
            "Financial": 6,
            "Family / Marital": 4,
            "Housing": 8,
            "Leisure / Recreation": 6,
            "Alcohol / Drug": 4,
            "Social": 7,
            "Emotional / Personal": 5,
        }

        assessment.misses_counts = {
            "Education / Employment": 1,
            "Criminal History": 0,
            "Financial": 0,
            "Family / Marital": 2,
            "Housing": 0,
            "Leisure / Recreation": 1,
            "Alcohol / Drug": 0,
            "Social": 0,
            "Emotional / Personal": 1,
        }

        # Add sample run steps (simplified)
        assessment.runs_steps = {
            "Education / Employment": [
                {
                    "node_key": "A1",
                    "node_value": "Education",
                    "result": "Yes",
                    "annotations": None,
                },
                {
                    "node_key": "B2",
                    "node_value": "Employment",
                    "result": "Partial",
                    "annotations": None,
                },
            ],
            "Criminal History": [
                {
                    "node_key": "A1",
                    "node_value": "Prior convictions",
                    "result": "Yes",
                    "annotations": None,
                }
            ],
            "Financial": [
                {
                    "node_key": "A1",
                    "node_value": "Financial stability",
                    "result": "Partial",
                    "annotations": None,
                }
            ],
        }

        session.add(assessment)
        await session.commit()
        print(
            f"Successfully created completed assessment for client {client_pseudo_id}"
        )
    else:
        print(f"Assessment already exists for client {client_pseudo_id}")


async def create_inprogress_assessment(session: AsyncSession, client_pseudo_id: str):
    """Create an in-progress assessment."""
    print(f"Creating in-progress assessment for client {client_pseudo_id}")

    # Get the client's intake
    intake = await session.exec(
        select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
    )
    intake_obj = intake.first()

    if not intake_obj:
        print(f"No intake found for client {client_pseudo_id}")
        return

    # Check if assessment already exists
    existing = await session.exec(
        select(Assessment).where(Assessment.client_pseudo_id == client_pseudo_id)
    )
    assessment = existing.first()

    if not assessment:
        print(f"Creating new in-progress assessment for client {client_pseudo_id}")
        # Create assessment
        assessment = Assessment(
            client_pseudo_id=client_pseudo_id,
            intake_id=intake_obj.id,
        )
        session.add(assessment)
        await session.flush()

        # Create execution with in-progress status
        execution = Execution(
            status=ExecutionStatus.IN_PROGRESS,
            progress=65,
            message="Processing assessment trees",
            table_name="assessment",
            table_entity_id=assessment.id,
        )
        session.add(execution)
        await session.flush()

        # Link execution to assessment
        assessment.execution_id = execution.id
        assessment.execution = execution

        # Partial assessment results
        assessment.scores = {
            "Education / Employment": 6,
            "Criminal History": 3,
            "Financial": 5,
        }

        assessment.misses_counts = {
            "Education / Employment": 2,
            "Criminal History": 1,
            "Financial": 0,
        }

        # Add sample run steps (simplified)
        assessment.runs_steps = {
            "Education / Employment": [
                {
                    "node_key": "A1",
                    "node_value": "Education",
                    "result": "Partial",
                    "annotations": None,
                }
            ],
            "Criminal History": [
                {
                    "node_key": "A1",
                    "node_value": "Prior convictions",
                    "result": "Yes",
                    "annotations": None,
                }
            ],
        }

        session.add(assessment)
        await session.commit()
        print(
            f"Successfully created in-progress assessment for client {client_pseudo_id}"
        )
    else:
        print(f"Assessment already exists for client {client_pseudo_id}")


async def create_pending_assessment(session: AsyncSession, client_pseudo_id: str):
    """Create a pending assessment (scheduled but not started)."""
    print(f"Creating pending assessment for client {client_pseudo_id}")

    # Get the client's intake
    intake = await session.exec(
        select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
    )
    intake_obj = intake.first()

    if not intake_obj:
        print(f"No intake found for client {client_pseudo_id}")
        return

    # Check if assessment already exists
    existing = await session.exec(
        select(Assessment).where(Assessment.client_pseudo_id == client_pseudo_id)
    )
    assessment = existing.first()

    if not assessment:
        print(f"Creating new pending assessment for client {client_pseudo_id}")
        # Create assessment
        assessment = Assessment(
            client_pseudo_id=client_pseudo_id,
            intake_id=intake_obj.id,
        )
        session.add(assessment)
        await session.flush()

        # Create execution with pending status
        execution = Execution(
            status=ExecutionStatus.PENDING,
            progress=0,
            message="Assessment scheduled for processing",
            table_name="assessment",
            table_entity_id=assessment.id,
        )
        session.add(execution)
        await session.flush()

        # Link execution to assessment
        assessment.execution_id = execution.id
        assessment.execution = execution

        session.add(assessment)
        await session.commit()
        print(f"Successfully created pending assessment for client {client_pseudo_id}")
    else:
        print(f"Assessment already exists for client {client_pseudo_id}")


async def create_failed_assessment(session: AsyncSession, client_pseudo_id: str):
    """Create a failed assessment."""
    print(f"Creating failed assessment for client {client_pseudo_id}")

    # Get the client's intake if one exists
    intake = await session.exec(
        select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
    )
    intake_obj = intake.first()

    # Check if assessment already exists
    existing = await session.exec(
        select(Assessment).where(Assessment.client_pseudo_id == client_pseudo_id)
    )
    assessment = existing.first()

    if not assessment:
        print(f"Creating new failed assessment for client {client_pseudo_id}")
        # Create assessment
        assessment = Assessment(
            client_pseudo_id=client_pseudo_id,
            intake_id=intake_obj.id if intake_obj else None,
        )
        session.add(assessment)
        await session.flush()

        # Create execution with failed status
        execution = Execution(
            status=ExecutionStatus.FAILED,
            progress=45,
            message="Assessment failed: Unable to process assessment tree data",
            table_name="assessment",
            table_entity_id=assessment.id,
        )
        session.add(execution)
        await session.flush()

        # Link execution to assessment
        assessment.execution_id = execution.id
        assessment.execution = execution

        # Partial results before failure
        assessment.scores = {"Education / Employment": 3, "Criminal History": 2}

        session.add(assessment)
        await session.commit()
        print(f"Successfully created failed assessment for client {client_pseudo_id}")
    else:
        print(f"Assessment already exists for client {client_pseudo_id}")
