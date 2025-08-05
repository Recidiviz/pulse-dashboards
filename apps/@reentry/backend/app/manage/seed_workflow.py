"""
Script to seed a complete workflow with proper dependencies:
1. Intakes in different stages
2. Assessments only for completed intakes
3. Plans only for completed assessments

This ensures the proper workflow dependency chain is maintained.
"""

import json
from pathlib import Path

from sqlmodel import delete, select

from app.core.db import AsyncSession, get_session_async_manager
from app.models.assessment import Assessment
from app.models.execution import Execution, ExecutionStatus
from app.models.intake import (
    ClientIntakeSection,
    Intake,
    IntakeMessage,
    IntakeStatus,
)
from app.models.models import GenerationType, Plan, PlanAsset, PlanGeneration, PlanType

from .base import cli
from .seed_intake_messages import create_client_intake_messages


def load_client_data_from_file(client_id: str, data_type: str) -> dict | None:
    """Load client data from JSON file in seed_workflow folder"""
    data_dir = Path(__file__).parent.parent.parent / "data" / "seed_workflow"
    file_path = data_dir / f"{client_id}_{data_type}.json"

    if not file_path.exists():
        print(f"Data file not found: {file_path}")
        return None

    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading data from {file_path}: {e}")
        return None


def get_available_client_data_files() -> list[str]:
    """Get list of client IDs that have data files in seed_workflow folder"""
    data_dir = Path(__file__).parent.parent.parent / "data" / "seed_workflow"
    if not data_dir.exists():
        return []

    client_ids = set()
    for file_path in data_dir.glob("*_assessment.json"):
        client_id = file_path.stem.replace("_assessment", "")
        client_ids.add(client_id)

    for file_path in data_dir.glob("*_plan.json"):
        client_id = file_path.stem.replace("_plan", "")
        client_ids.add(client_id)

    return list(client_ids)


@cli.command("seed-workflow")
async def seed_workflow(mode: str = "demo"):
    """
    Seeds a complete workflow with proper dependencies based on the specified mode.
    Always cleans existing data before creating new data to ensure consistency.

    Demo mode: Creates intakes in different stages (plans, in progress, new)
              with no completed intakes for easy demo purposes.
    Dev mode: Creates some completed intakes with plans for testing plan generation.

    Args:
        mode (str): Either 'demo' or 'dev'. Defaults to 'demo'.
    """
    if mode not in ["demo", "dev"]:
        print(f"Invalid mode '{mode}'. Must be 'demo' or 'dev'.")
        return

    async with get_session_async_manager() as session:
        print(f"Running seed workflow in {mode} mode...")

        if mode == "demo":
            await seed_demo_mode(session)
        else:  # dev mode
            await seed_dev_mode(session)

        print(
            f"\nAll {mode} workflow data created successfully with proper dependencies!"
        )


async def seed_demo_mode(session: AsyncSession):
    """
    Seeds demo data dynamically based on available plan files.
    - Clients with plan files: get completed intake, assessment, and plan
    - One client without plan file: gets in-progress intake
    - Other clients: remain empty
    """
    # Get all available client IDs that have plan data files
    available_clients = get_available_client_data_files()
    print(f"Found plan data files for clients: {available_clients}")

    # Define all potential demo clients
    all_demo_clients = [
        "CLIENT-001",
        "CLIENT-002",
        "CLIENT-003",
        "CLIENT-004",
        "CLIENT-005",
        "CLIENT-006",
        "CLIENT-007",
    ]

    # Separate clients into those with and without plan files
    clients_with_plans = [
        client for client in all_demo_clients if client in available_clients
    ]
    clients_without_plans = [
        client for client in all_demo_clients if client not in available_clients
    ]

    print(f"Clients with plan files: {clients_with_plans}")
    print(f"Clients without plan files: {clients_without_plans}")

    print("Cleaning existing data for demo clients...")
    await clean_client_data(session, all_demo_clients)

    print("Creating demo intakes based on available plan files...")

    # Create completed intakes/assessments/plans for clients with plan files
    client_names = [
        "Kathryn Ryan",
        "Stacey Miller",
        "Nathaniel Lam",
        "Ashley Martinez",
        "Michael Jenkins",
        "Scott Callahan",
        "Franklin Smith",
    ]

    for i, client_id in enumerate(clients_with_plans):
        name = client_names[i] if i < len(client_names) else f"Client {client_id}"
        print(f"Creating completed workflow for {name} ({client_id}) - has plan file")
        await create_completed_intake(session, client_id, name)
        await create_completed_assessment(session, client_id)
        await create_completed_plan(session, client_id)

    # Create one in-progress intake for the first client without a plan file
    if clients_without_plans:
        client_id = clients_without_plans[0]
        name = (
            client_names[len(clients_with_plans)]
            if len(clients_with_plans) < len(client_names)
            else f"Client {client_id}"
        )
        print(f"Creating in-progress intake for {name} ({client_id}) - no plan file")
        await create_in_progress_intake(session, client_id, name)

    # Remaining clients without plans are left empty (no intakes created)
    if len(clients_without_plans) > 1:
        remaining_clients = clients_without_plans[1:]
        print(f"Leaving clients empty (no intakes): {remaining_clients}")


async def seed_dev_mode(session: AsyncSession):
    """
    Seeds dev data with some completed intakes for testing plan generation.
    This is the original behavior for development testing.
    """
    # Dev clients - mix of completed and various stages
    client1 = "CLIENT-001"  # Completed - will get assessment and plan
    client2 = "CLIENT-002"  # Completed - will get assessment and plan
    client3 = "CLIENT-003"  # Completed - will get assessment and plan

    # In-progress or created intakes
    client4 = "CLIENT-005"  # In progress
    client5 = "CLIENT-007"  # Created

    all_clients = [client1, client2, client3, client4, client5]

    print("Cleaning existing data for dev clients...")
    await clean_client_data(session, all_clients)

    print("Creating dev intakes in different states...")
    await create_completed_intake(session, client1, "Kathryn Ryan")
    await create_completed_intake(session, client2, "Stacey Miller")
    await create_completed_intake(session, client3, "Nathaniel Lam")

    await create_in_progress_intake(session, client4, "Michael Jenkins")
    await create_created_intake(session, client5, "Franklin Smith")

    # Create assessments only for completed intakes
    print("\nCreating assessments only for completed intakes...")
    completed_intake_clients = [client1, client2, client3]

    for client_id in completed_intake_clients:
        assessment_data = load_client_data_from_file(client_id, "assessment")
        if assessment_data:
            print(f"Found assessment data file for {client_id}, creating assessment...")
            await create_completed_assessment(session, client_id)
        else:
            print(
                f"No assessment data file found for {client_id}, skipping assessment creation"
            )

    # Create plans only for clients that have plan data files and completed assessments
    print(
        "\nCreating plans for clients with plan data files and completed assessments..."
    )

    for client_id in completed_intake_clients:
        # Check if client has both completed assessment and plan data file
        assessment_result = await session.exec(
            select(Assessment).where(Assessment.client_id == client_id)
        )
        assessment_obj = assessment_result.first()

        if assessment_obj and assessment_obj.status == ExecutionStatus.COMPLETED.value:
            plan_data = load_client_data_from_file(client_id, "plan")
            if plan_data:
                print(f"Found plan data file for {client_id}, creating plan...")
                await create_completed_plan(session, client_id)
            else:
                print(
                    f"No plan data file found for {client_id}, skipping plan creation"
                )
        else:
            print(f"No completed assessment for {client_id}, skipping plan creation")


async def clean_client_data(session: AsyncSession, client_ids: list[str]):
    """
    Remove all workflow data for the specified clients.

    Args:
        session: The database session
        client_ids: List of client IDs to clean data for
    """
    for client_id in client_ids:
        print(f"Cleaning data for client {client_id}...")

        # Step 1: Delete plan and related entities
        plans = await session.exec(select(Plan).where(Plan.client_id == client_id))
        plan_obj = plans.first()

        if plan_obj:
            # First, get all plan generations
            plan_generations = await session.exec(
                select(PlanGeneration).where(PlanGeneration.plan_id == plan_obj.id)
            )
            gen_list = plan_generations.all()

            for gen in gen_list:
                # Remove execution reference from generation before deleting execution
                if gen.execution_id:
                    gen.execution_id = None
                    session.add(gen)
                    await session.flush()

            # Now it's safe to delete executions
            for gen in gen_list:
                # Delete the generation
                await session.delete(gen)

            # Remove plan execution reference before deleting
            if plan_obj.create_execution_id:
                execution_id = plan_obj.create_execution_id
                plan_obj.create_execution_id = None
                session.add(plan_obj)
                await session.flush()

                # Now delete the execution
                execution = await session.get(Execution, execution_id)
                if execution:
                    await session.delete(execution)

            # Delete the plan itself
            await session.delete(plan_obj)
            await session.flush()

        # Step 2: Delete assessments
        assessments = await session.exec(
            select(Assessment).where(Assessment.client_id == client_id)
        )
        assessment_obj = assessments.first()

        if assessment_obj:
            # Remove execution reference before deleting
            if assessment_obj.execution_id:
                execution_id = assessment_obj.execution_id
                assessment_obj.execution_id = None
                session.add(assessment_obj)
                await session.flush()

                # Now delete the execution
                execution = await session.get(Execution, execution_id)
                if execution:
                    await session.delete(execution)

            # Delete the assessment
            await session.delete(assessment_obj)
            await session.flush()

        # Step 3: Delete intake (this will cascade delete messages, sections, and address)
        intakes = await session.exec(
            select(Intake).where(Intake.client_id == client_id)
        )
        intake_obj = intakes.first()

        if intake_obj:
            # Delete intake messages
            await session.exec(
                delete(IntakeMessage).where(IntakeMessage.intake_id == intake_obj.id)
            )

            # Delete client intake sections
            await session.exec(
                delete(ClientIntakeSection).where(
                    ClientIntakeSection.intake_id == intake_obj.id
                )
            )

            # Delete the intake itself
            await session.delete(intake_obj)

        await session.commit()
        print(f"Successfully cleaned all data for client {client_id}")


# --- INTAKE FUNCTIONS ---


async def create_completed_intake(session: AsyncSession, client_id: str, name: str):
    """Create a completed intake with sample conversation data."""
    print(f"Creating completed intake for {name} (ID: {client_id})...")

    # Use the new create_client_intake_messages function
    await create_client_intake_messages(session, client_id, IntakeStatus.COMPLETED)

    # Find and return the intake for compatibility
    existing_intake = await session.exec(
        select(Intake).where(Intake.client_id == client_id)
    )
    return existing_intake.first()


async def create_in_progress_intake(session: AsyncSession, client_id: str, name: str):
    """Create an in-progress intake with almost all sections completed."""
    print(
        f"Creating almost complete in-progress intake for {name} (ID: {client_id})..."
    )

    # Use the new create_client_intake_messages function
    await create_client_intake_messages(
        session, client_id, IntakeStatus.IN_PROGRESS, "Alcohol and Drug Use"
    )

    # Find and return the intake for compatibility
    existing_intake = await session.exec(
        select(Intake).where(Intake.client_id == client_id)
    )
    return existing_intake.first()


async def create_created_intake(session: AsyncSession, client_id: str, name: str):
    """Create an intake in 'created' state (just registered, no sections started)."""
    print(f"Creating 'created' intake for {name} (ID: {client_id})...")

    # Use the new create_client_intake_messages function
    await create_client_intake_messages(session, client_id, IntakeStatus.CREATED)

    # Find and return the intake for compatibility
    existing_intake = await session.exec(
        select(Intake).where(Intake.client_id == client_id)
    )
    return existing_intake.first()


# --- ASSESSMENT FUNCTIONS ---


async def create_completed_assessment(session: AsyncSession, client_id: str):
    """Create a completed assessment with sample data."""
    print(f"Creating completed assessment for client {client_id}...")

    # Verify intake exists and is completed
    intake = await session.exec(select(Intake).where(Intake.client_id == client_id))
    intake_obj = intake.first()

    if not intake_obj:
        print(f"No intake found for client {client_id} - cannot create assessment")
        return None

    if intake_obj.status != IntakeStatus.COMPLETED.value:
        print(
            f"Cannot create assessment for client {client_id} - intake not completed (status: {intake_obj.status})"
        )
        return None

    # Check if assessment already exists
    existing = await session.exec(
        select(Assessment).where(Assessment.client_id == client_id)
    )
    assessment = existing.first()

    if not assessment:
        print(f"Creating new assessment for client {client_id}")
        # Create assessment
        assessment = Assessment(
            client_id=client_id,
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

        # Load assessment data from file if it exists
        assessment_data = load_client_data_from_file(client_id, "assessment")
        if assessment_data:
            assessment.scores = assessment_data.get("scores", {})
            assessment.misses_counts = assessment_data.get("misses_counts", {})
            assessment.runs_steps = assessment_data.get("runs_steps", {})

        session.add(assessment)
        await session.commit()
        print(f"Successfully created completed assessment for client {client_id}")
    else:
        print(f"Assessment for client {client_id} already exists - skipping")

    return assessment


async def create_inprogress_assessment(session: AsyncSession, client_id: str):
    """Create an in-progress assessment."""
    print(f"Creating in-progress assessment for client {client_id}...")

    # Verify intake exists and is completed
    intake = await session.exec(select(Intake).where(Intake.client_id == client_id))
    intake_obj = intake.first()

    if not intake_obj:
        print(f"No intake found for client {client_id} - cannot create assessment")
        return None

    if intake_obj.status != IntakeStatus.COMPLETED.value:
        print(
            f"Cannot create assessment for client {client_id} - intake not completed (status: {intake_obj.status})"
        )
        return None

    # Check if assessment already exists
    existing = await session.exec(
        select(Assessment).where(Assessment.client_id == client_id)
    )
    assessment = existing.first()

    if not assessment:
        print(f"Creating new in-progress assessment for client {client_id}")
        # Create assessment
        assessment = Assessment(
            client_id=client_id,
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
                    "node_type": "question",
                }
            ],
            "Criminal History": [
                {
                    "node_key": "A1",
                    "node_value": "Prior convictions",
                    "result": "Yes",
                    "annotations": None,
                    "node_type": "question",
                }
            ],
        }

        session.add(assessment)
        await session.commit()
        print(f"Successfully created in-progress assessment for client {client_id}")
    else:
        print(f"Assessment for client {client_id} already exists - skipping")

    return assessment


async def create_pending_assessment(session: AsyncSession, client_id: str):
    """Create a pending assessment (scheduled but not started)."""
    print(f"Creating pending assessment for client {client_id}...")

    # Verify intake exists and is completed
    intake = await session.exec(select(Intake).where(Intake.client_id == client_id))
    intake_obj = intake.first()

    if not intake_obj:
        print(f"No intake found for client {client_id} - cannot create assessment")
        return None

    if intake_obj.status != IntakeStatus.COMPLETED.value:
        print(
            f"Cannot create assessment for client {client_id} - intake not completed (status: {intake_obj.status})"
        )
        return None

    # Check if assessment already exists
    existing = await session.exec(
        select(Assessment).where(Assessment.client_id == client_id)
    )
    assessment = existing.first()

    if not assessment:
        print(f"Creating new pending assessment for client {client_id}")
        # Create assessment
        assessment = Assessment(
            client_id=client_id,
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
        print(f"Successfully created pending assessment for client {client_id}")
    else:
        print(f"Assessment for client {client_id} already exists - skipping")

    return assessment


# --- PLAN FUNCTIONS ---


async def create_completed_plan(session: AsyncSession, client_id: str):
    """Create a completed plan with a generation."""
    print(f"Creating completed plan for client {client_id}...")

    # Check if plan data file exists
    plan_data = load_client_data_from_file(client_id, "plan")
    if not plan_data:
        print(f"No plan data file found for client {client_id} - cannot create plan")
        return None

    # Verify client has a completed assessment
    assessment = await session.exec(
        select(Assessment).where(Assessment.client_id == client_id)
    )
    assessment_obj = assessment.first()

    if not assessment_obj:
        print(f"No assessment found for client {client_id} - cannot create plan")
        return None

    if assessment_obj.status != ExecutionStatus.COMPLETED.value:
        print(
            f"Cannot create plan for client {client_id} - assessment not completed (status: {assessment_obj.status})"
        )
        return None

    # Check if plan already exists
    existing = await session.exec(select(Plan).where(Plan.client_id == client_id))
    plan = existing.first()

    if not plan:
        print(f"Creating new plan for client {client_id}")
        # Create plan
        plan = Plan(
            client_id=client_id,
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

        # Use the plan_data we already loaded at the beginning of the function
        # Set plan fields from loaded data
        plan.result_gen_id = plan_data.get("result_gen_id")
        plan.client_extracted_info = plan_data.get("client_extracted_info", {})

        # Create plan generations from loaded data
        for gen_data in plan_data.get("generations", []):
            generation = PlanGeneration(
                plan_id=plan.id,
                gen_type=gen_data.get("gen_type", GenerationType.AUTOMATED),
                prompt=gen_data.get("prompt", ""),
                markdown_result=gen_data.get("markdown_result", ""),
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

        # Create plan assets from loaded data
        for asset_data in plan_data.get("assets", []):
            # Load asset content from file if it's a blob
            file_blob = None
            if asset_data.get("file_blob"):
                file_blob = asset_data["file_blob"].encode("utf-8")
            elif asset_data.get("filename"):
                # Try to load from separate asset file
                asset_file_path = (
                    Path(__file__).parent.parent.parent
                    / "data"
                    / "seed_workflow"
                    / f"{client_id}_{asset_data['filename']}"
                )
                if asset_file_path.exists():
                    with open(asset_file_path, "rb") as f:
                        file_blob = f.read()

            if file_blob:
                asset = PlanAsset(
                    plan_id=plan.id,
                    filename=asset_data.get("filename", ""),
                    mimetype=asset_data.get("mimetype", "text/plain"),
                    file_blob=file_blob,
                )
                session.add(asset)

        session.add(plan)
        await session.commit()
        print(f"Successfully created completed plan for client {client_id}")
    else:
        print(f"Plan already exists for client {client_id} - skipping")

    return plan
