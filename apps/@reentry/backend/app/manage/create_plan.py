from pathlib import Path

import structlog

from app.models.models import PlanType
from app.services.client_data.queries import get_client_data_unsafe

from .base import cli

logger = structlog.get_logger(__name__)


async def _create_plan(
    client_id: str,
    force: bool = False,
    regen: bool = False,
    prompt: str | None = None,
    resource_remove_id: str | None = None,
    resource_add_id: str | None = None,
    mark_eval: bool = False,
):
    """
    Use the tasks to create a new plan
    """

    from app.core.db import get_session_async_manager
    from app.crud.plan import (
        Plan,
        create_plan,
        delete_plan_by_id,
        get_plan_by_client_id,
    )
    from app.crud.plan_generation import (
        PlanGeneration,
        create_plan_generation,
    )

    async with get_session_async_manager() as session:
        plan = await get_plan_by_client_id(session, client_id)

        if regen:
            # Regeneration checks
            if not plan:
                logger.error("Plan not found, cannot regen", client_id=client_id)
                return
            if not (prompt or resource_remove_id or resource_add_id):
                logger.error(
                    "prompt, resource_remove_id or resource_add_id required for regen",
                    client_id=client_id,
                )
                return

        else:
            # Creation checks
            if resource_remove_id or resource_add_id:
                logger.error("Resource add/remove is only allowed for regen")
                return
            if plan:
                if not force:
                    logger.info("Plan already exists", client_id=client_id)
                    return
                await delete_plan_by_id(session, plan.id)

        if regen:
            # Regeneration process
            plan_gen = PlanGeneration(
                plan_id=plan.id,
                prompt=prompt,
                resource_to_remove_id=resource_remove_id,
                resource_to_add_id=resource_add_id,
            )
            gen = await create_plan_generation(session, plan_gen)
            await gen.schedule_execution(session)
        else:
            # Creation process
            type = PlanType.EVALUATION if mark_eval else PlanType.LIVE
            plan = Plan(client_id=client_id, type=type)
            plan = await create_plan(session, plan)
            await plan.schedule_initial_creation(session)

        # save the plan to a file
        plan = await get_plan_by_client_id(session, client_id)

        # refresh the plan
        plan = await get_plan_by_client_id(session, client_id)
        latest_generation = await plan.get_latest_generation(session)
        print(latest_generation)
        if not latest_generation:
            logger.error("No generation found", client_id=client_id)
            return

        return plan, latest_generation


@cli.command()
async def create_plan(
    client_id: str,
    force: bool = False,
    regen: bool = False,
    prompt: str | None = None,
):
    experiments_dir = (
        Path(__file__).parent.parent.parent / "experiments" / "structured_action_plan"
    )
    experiments_dir.mkdir(parents=True, exist_ok=True)

    res = await _create_plan(client_id, force, regen, prompt)
    if not res:
        return
    plan, latest_generation = res
    data = get_client_data_unsafe(plan.client_id)
    if not data:
        logger.error("Client not found", client_id=plan.client_id)
        return

    counter = 1
    while True:
        prefix = f"{data.full_name}_it{counter}"
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
