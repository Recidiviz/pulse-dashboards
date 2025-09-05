"""
Script to seed plan data in different states for demo purposes.
"""

from sqlmodel import select

from app.core.db import AsyncSession, get_session_async_manager
from app.models.models import (
    Execution,
    ExecutionStatus,
    GenerationType,
    Plan,
    PlanGeneration,
    PlanType,
)

from .base import cli


@cli.command("seed-demo-plans")
async def seed_demo_plans():
    """
    Seeds plans in different states for demo clients
    """
    async with get_session_async_manager() as session:
        # Create plans for clients with completed assessments
        await create_completed_plan(session, "108734")  # Allistor Jones (SAM)
        await create_inprogress_plan(session, "108141")  # Sharon Wood (AJ)

        print("All demo plans created successfully")


async def create_completed_plan(session: AsyncSession, client_pseudo_id: str):
    """Create a completed plan with a generation."""
    print(f"Creating completed plan for client {client_pseudo_id}")

    # Check if plan already exists
    existing = await session.exec(
        select(Plan).where(Plan.client_pseudo_id == client_pseudo_id)
    )
    plan = existing.first()

    if not plan:
        print(f"Creating new plan for client {client_pseudo_id}")
        # Create plan
        plan = Plan(
            client_pseudo_id=client_pseudo_id,
            type=PlanType.LIVE,
        )
        session.add(plan)
        await session.flush()

        # Create execution with completed status for the plan
        plan_execution = Execution(
            status=ExecutionStatus.COMPLETED,
            progress=100,
            message="Plan created successfully",
            table_name="plan",
            table_entity_id=plan.id,
        )
        session.add(plan_execution)
        await session.flush()

        # Link execution to plan
        plan.create_execution_id = plan_execution.id
        plan.create_execution = plan_execution

        # Create a plan generation
        generation = PlanGeneration(
            plan_id=plan.id,
            gen_type=GenerationType.AUTOMATED,
            prompt="Generate an action plan focused on employment and housing",
            markdown_result="""
# Action Plan for Allistor Jones

## Employment Goals
1. Apply for at least 3 jobs per week related to logistics or office work
2. Attend the VA job fair on May 15, 2025
3. Complete the office skills training course at the community college

## Housing Goals
1. Contact Veterans Housing Assistance Program by April 5, 2025
2. Complete housing application forms by April 10, 2025
3. Schedule appointment with housing counselor

## Resources
- VA Employment Specialist: John Smith (555-123-4567)
- Veterans Housing Program: www.veteranshousing.org
- Community College Office Skills Program: Register by April 20
""",
        )
        session.add(generation)
        await session.flush()

        # Create execution for the generation
        gen_execution = Execution(
            status=ExecutionStatus.COMPLETED,
            progress=100,
            message="Plan generation completed successfully",
            table_name="plan:generate",
            table_entity_id=generation.id,
        )
        session.add(gen_execution)
        await session.flush()

        # Link execution to generation
        generation.execution_id = gen_execution.id
        generation.execution = gen_execution

        # We need to store the position in generations list,
        # not the actual UUID of the generation
        plan.result_gen_id = 1  # Assuming this is the first generation (index 1)

        # Add client info
        plan.client_extracted_info = {
            "employment_status": "unemployed",
            "housing_status": "temporary",
            "needs": ["employment", "housing", "mental_health_support"],
            "skills": ["logistics", "mechanics", "organization"],
            "barriers": ["physical_limitations", "criminal_record", "transportation"],
        }

        session.add(plan)
        session.add(generation)
        await session.commit()
        print(f"Successfully created completed plan for client {client_pseudo_id}")
    else:
        print(f"Plan already exists for client {client_pseudo_id}")


async def create_inprogress_plan(session: AsyncSession, client_pseudo_id: str):
    """Create an in-progress plan."""
    print(f"Creating in-progress plan for client {client_pseudo_id}")

    # Check if plan already exists
    existing = await session.exec(
        select(Plan).where(Plan.client_pseudo_id == client_pseudo_id)
    )
    plan = existing.first()

    if not plan:
        print(f"Creating new in-progress plan for client {client_pseudo_id}")
        # Create plan
        plan = Plan(
            client_pseudo_id=client_pseudo_id,
            type=PlanType.LIVE,
        )
        session.add(plan)
        await session.flush()

        # Create execution with in-progress status
        execution = Execution(
            status=ExecutionStatus.IN_PROGRESS,
            progress=60,
            message="Processing client data and preparing plan",
            table_name="plan",
            table_entity_id=plan.id,
        )
        session.add(execution)
        await session.flush()

        # Link execution to plan
        plan.create_execution_id = execution.id
        plan.create_execution = execution

        # Add client info (partial)
        plan.client_extracted_info = {
            "employment_status": "recently_unemployed",
            "housing_status": "stable",
            "needs": ["employment", "education"],
            "skills": ["customer_service", "basic_computer"],
        }

        session.add(plan)
        await session.commit()
        print(f"Successfully created in-progress plan for client {client_pseudo_id}")
    else:
        print(f"Plan already exists for client {client_pseudo_id}")
