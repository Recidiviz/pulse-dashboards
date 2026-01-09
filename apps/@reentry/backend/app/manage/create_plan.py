from pathlib import Path

import structlog

from app.services.client_data.queries import Queries

from .base import cli

logger = structlog.get_logger(__name__)


async def _create_plan(
    intake_id: str,
    force: bool = False,
    regen: bool = False,
    prompt: str | None = None,
    resource_remove_id: str | None = None,
    resource_add_id: str | None = None,
):
    """
    Use the tasks to create a new plan
    """

    from uuid import UUID

    from app.core.db import get_session_async_manager
    from app.crud.intake import get_intake_by_id
    from app.crud.plan import (
        Plan,
        create_plan,
        delete_plan_by_id,
        get_plan_by_intake_id,
    )
    from app.crud.plan_generation import (
        PlanGeneration,
        create_plan_generation,
    )

    async with get_session_async_manager() as session:
        # Get the intake first
        intake = await get_intake_by_id(session, UUID(intake_id))
        if not intake:
            logger.error("Intake not found", intake_id=intake_id)
            return

        client_pseudo_id = intake.client_pseudo_id
        plan = await get_plan_by_intake_id(session, intake_id)

        if regen:
            # Regeneration checks
            if not plan:
                logger.error(
                    "Plan not found, cannot regen", client_pseudo_id=client_pseudo_id
                )
                return
            if not (prompt or resource_remove_id or resource_add_id):
                logger.error(
                    "prompt, resource_remove_id or resource_add_id required for regen",
                    client_pseudo_id=client_pseudo_id,
                )
                return

        else:
            # Creation checks
            if resource_remove_id or resource_add_id:
                logger.error("Resource add/remove is only allowed for regen")
                return
            if plan:
                if not force:
                    logger.info(
                        "Plan already exists", client_pseudo_id=client_pseudo_id
                    )
                    return
                await delete_plan_by_id(session, plan.id)

        execution = None
        if regen:
            # Regeneration process
            plan_gen = PlanGeneration(
                plan_id=plan.id,
                prompt=prompt,
                resource_to_remove_id=resource_remove_id,
                resource_to_add_id=resource_add_id,
            )
            gen = await create_plan_generation(session, plan_gen)
            execution = await gen.schedule_execution(session)
        else:
            # Creation process
            plan = Plan(client_pseudo_id=client_pseudo_id, intake_id=intake.id)
            plan = await create_plan(session, plan)
            execution = await plan.schedule_initial_creation(session)

        # Wait for the execution to complete
        print(f"Waiting for plan execution {execution.id} to complete...")
        success = await execution.wait(
            session, timeout=360, poll=2
        )  # 6 min timeout, poll every 2 seconds

        if success:
            print("✅ Plan execution completed successfully!")
        else:
            print("❌ Plan execution timed out or failed!")
            return

        # Get the completed plan and latest generation
        plan = await get_plan_by_intake_id(session, intake_id)
        latest_generation = await plan.get_latest_generation(session)
        if not latest_generation:
            logger.error("No generation found", client_pseudo_id=client_pseudo_id)
            return

        return plan, latest_generation


@cli.command()
async def create_plan(
    client_pseudo_id: str,
    force: bool = False,
    regen: bool = False,
    prompt: str | None = None,
):
    experiments_dir = (
        Path(__file__).parent.parent.parent / "experiments" / "structured_action_plan"
    )
    experiments_dir.mkdir(parents=True, exist_ok=True)

    res = await _create_plan(client_pseudo_id, force, regen, prompt)
    if not res:
        return
    plan, latest_generation = res
    data = Queries.get_client_by_pseudonymized_id_unsafe(plan.client_pseudo_id)
    if not data:
        logger.error("Client not found", client_pseudo_id=plan.client_pseudo_id)
        return

    counter = 1
    while True:
        prefix = f"{data.full_name.given_names}_it{counter}"
        if not any(
            [
                (experiments_dir / f"{prefix}_plan.json").exists(),
                (experiments_dir / f"{prefix}_plan.md").exists(),
                (experiments_dir / f"{prefix}_gen_data.json").exists(),
            ]
        ):
            break
        counter += 1

    # save the files
    with open(experiments_dir / f"{prefix}_plan.json", "w") as f:
        f.write(plan.model_dump_json(by_alias=True))
    with open(experiments_dir / f"{prefix}_plan.md", "w") as f:
        f.write(latest_generation.markdown_result)
    with open(experiments_dir / f"{prefix}_gen_data.json", "w") as f:
        f.write(latest_generation.gen_data_json)

    print(f"\n\nPlan saved to {experiments_dir / f'{prefix}_plan.json'}\n\n")
