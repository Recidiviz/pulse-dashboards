from pathlib import Path
from pprint import pprint

import structlog

from app.models.assessment import Assessment

from .base import cli

logger = structlog.get_logger(__name__)


async def _create_assessment(intake_id: str, force: bool = False):
    """
    Use the tasks to create a new assessment
    """
    from uuid import UUID

    from app.core.db import get_session_async_manager
    from app.crud.assessment import create_assessment

    async with get_session_async_manager() as session:
        # Try to find the intake by ID
        from app.crud.assessment import get_assessments_by_intake_id
        from app.crud.intake import get_intake_by_id

        intake = await get_intake_by_id(session, UUID(intake_id))

        # Ensure intake exists before proceeding
        if not intake:
            raise ValueError(
                f"No intake found with ID {intake_id}. Assessment requires an intake."
            )

        client_pseudo_id = intake.client_pseudo_id

        # If force is enabled, delete existing assessments
        if force:
            existing_assessments = await get_assessments_by_intake_id(
                session, intake.id
            )
            for existing_assessment in existing_assessments:
                print(
                    f"🗑️  Deleting existing assessment {existing_assessment.id} for client {client_pseudo_id}"
                )
                await session.delete(existing_assessment)
            if existing_assessments:
                await session.commit()

        # Create assessment, linking to intake
        assessment = Assessment(client_pseudo_id=client_pseudo_id, intake_id=intake.id)
        assessment = await create_assessment(session, assessment)
        execution = await assessment.schedule_execution(session)
        await session.refresh(assessment)

        # Wait for the execution to complete
        print(f"Waiting for assessment execution {execution.id} to complete...")
        success = await execution.wait(
            session, timeout=360, poll=2
        )  # 6 min timeout, poll every 2 seconds

        if success:
            print("✅ Assessment execution completed successfully!")
            # Refresh assessment to get the latest scores and results
            await session.refresh(assessment)

            # Check if a plan already exists for this client
            from app.crud.plan import get_plan_by_intake_id

            existing_plan = await get_plan_by_intake_id(session, intake.id)
            if existing_plan:
                print(f"\n💡 Plan already exists for client {client_pseudo_id}")
                print("   To regenerate the plan with updated assessment data, run:")
                print(f"   uv run -m app.manage create-plan {client_pseudo_id} --force")
        else:
            print("❌ Assessment execution timed out or failed!")

        return assessment


@cli.command()
async def create_assessment(intake_id: str, force: bool = False):
    experiments_dir = (
        Path(__file__).parent.parent.parent / "experiments" / "structured_assessment"
    )
    experiments_dir.mkdir(parents=True, exist_ok=True)

    assessment = await _create_assessment(intake_id, force)

    print("Scores: ")
    pprint(assessment.scores)
    print("Misses: ")
    pprint(assessment.misses_counts)

    counter = 1
    file_name = f"{assessment.client_pseudo_id}_assessment_it{counter}.json"
    while True:
        if not (experiments_dir / file_name).exists():
            break
        counter += 1
        file_name = f"{assessment.client_pseudo_id}_assessment_it{counter}.json"

    data = assessment.model_dump_json(by_alias=True)
    (experiments_dir / file_name).write_text(data)

    print(f"\nAssessment saved to {experiments_dir / file_name}\n\n")


@cli.command()
async def create_assessment_from_config(force: bool = False):
    """Create assessment for client specified in CLIENT_PSID_ASSESSMENT_TASK config"""
    from app.core.config import settings
    from app.core.db import get_session_async_manager
    from app.crud.intake import get_latest_active_conversation_intake

    if not settings.CLIENT_PSID_ASSESSMENT_TASK:
        logger.error("CLIENT_PSID_ASSESSMENT_TASK not set in configuration")
        return

    client_pseudo_id = settings.CLIENT_PSID_ASSESSMENT_TASK
    logger.info(f"Creating assessment for client: {client_pseudo_id}")

    # Look up the latest active conversation intake for this client
    async with get_session_async_manager() as session:
        intake = await get_latest_active_conversation_intake(session, client_pseudo_id)
        if not intake:
            logger.error(f"No active intake found for client {client_pseudo_id}")
            return
        intake_id = str(intake.id)

    assessment = await _create_assessment(intake_id, force)

    if assessment.scores:
        score_count = len(assessment.scores)
        logger.info(
            f"Assessment completed successfully with {score_count} scoring items"
        )
    else:
        logger.warning("Assessment completed but no scores generated")
