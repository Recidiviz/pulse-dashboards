"""
Action Plan generator
=====================
"""

import asyncio
import textwrap
from datetime import datetime, timezone
from uuid import UUID

import orjson
import structlog
from taskiq import TaskiqDepends
from taskiq.depends.progress_tracker import ProgressTracker

from app.core.db import AsyncSession, get_session
from app.crud.plan_decision_tree import (
    PlanDecisionTree,
    get_plan_decision_tree_by_plan_id,
)
from app.crud.plan_generation import (
    get_gen_by_id,
    get_gen_by_plan_id,
    update_plan_generation,
)
from app.models.models import (
    PlanGeneration,
    PlanGenerationResourceAssociation,
    ResourceAssociationAction,
)
from app.services.client_data.queries import Queries
from app.services.resources import GetResourcesRequest, Resource, TravelMode
from app.utils.action_plan_types import (
    ActionPlanMilestones,
    ActionPlanSection,
    ActionPlanTimelines,
    ResourceAssociation,
)
from app.utils.config_loader import ConfigLoader
from app.utils.llm_agent_edit_plan import LLMAgentEdit
from app.utils.llm_agent_gen_plan import LLMAgentGenerate
from app.utils.resources_utils import (
    fetch_resources_with_retry,
    transform_resources_associations_to_map,
)

from .base import broker
from .plan_decision_tree import get_plan_asset
from .scheduler import Execution, execution_context

logger = structlog.get_logger(__name__)

TIMEOUT_EXECUTION_DT = 5 * 60


def render_intake_messages(json_messages: str):
    messages = orjson.loads(json_messages)
    lines = []

    # reorder messages using createdAt (need to be parsed) from older to newer
    if messages[0].get("createdAt"):
        messages.sort(key=lambda msg: datetime.fromisoformat(msg["createdAt"]))
    for message in messages:
        who = message.get("role")
        content = message.get("content")

        if who and content:
            lines.append(f"{who}: {content}")
        else:
            logger.warning(
                "Message missing role or content",
                message=message,
            )

    return "\n".join(lines)


async def ensure_tree_execution_task(
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
    plan_decision_tree: PlanDecisionTree,
):
    if plan_decision_tree.is_execution_finished:
        task_logger.debug("Decision tree is ready")
        # Log if it failed but don't raise an exception
        if plan_decision_tree.status == "failed":
            task_logger.warning(
                f"Decision tree {plan_decision_tree.id} execution failed, but continuing with plan generation"
            )
        return

    # schedule and wait for it
    task_logger.debug("Schedule decision tree execution")
    execution = await plan_decision_tree.schedule_execution(session)

    # maximum 5 minutes for executing a decision tree
    task_logger.debug("Wait for decision tree execution")
    await execution.wait(session=session, timeout=TIMEOUT_EXECUTION_DT)

    # refresh the plan decision tree
    task_logger.debug("Decision tree execution done, refreshing")
    await session.refresh(plan_decision_tree)

    # Log if the execution failed but don't raise an exception
    if plan_decision_tree.status == "failed":
        task_logger.warning(
            f"Decision tree {plan_decision_tree.id} execution failed, but continuing with plan generation"
        )


async def ensure_plan_decision_trees_executed(
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
    plan_decision_trees: list[PlanDecisionTree],
):
    for pdt in plan_decision_trees:
        pdt_logger = task_logger.bind(plan_decision_tree_id=pdt.id.hex)
        await ensure_tree_execution_task(
            session=session,
            task_logger=pdt_logger,
            plan_decision_tree=pdt,
        )

    # double check here - log issues but don't fail the overall plan
    failed_trees = []
    incomplete_trees = []
    for pdt in plan_decision_trees:
        if not pdt.is_execution_finished:
            task_logger.warning(f"Decision tree {pdt.id} not executed")
            incomplete_trees.append(pdt.id)
        elif pdt.status == "failed":
            task_logger.warning(f"Decision tree {pdt.id} execution failed")
            failed_trees.append(pdt.id)

    if failed_trees or incomplete_trees:
        task_logger.warning(
            f"Some decision trees had issues but continuing with plan generation. "
            f"Failed: {len(failed_trees)}, Incomplete: {len(incomplete_trees)}"
        )


@broker.task
async def generate_action_plan_task(
    execution_id: UUID,
    gen_id: UUID,
    progress: ProgressTracker[int] = TaskiqDepends(),
    session: AsyncSession = TaskiqDepends(get_session),
):
    async with execution_context(session, execution_id) as execution:
        gen = await get_gen_by_id(session, gen_id, with_plan=True)
        if not gen:
            raise ValueError(f"Plan Generation with id {gen_id} not found")

        structlog.contextvars.bind_contextvars(
            client_pseudo_id=gen.plan.client_pseudo_id
        )

        task_logger = logger.bind(
            execution_id=execution_id.hex,
            gen_id=gen_id.hex,
        )
        await generate_action_plan(
            execution=execution,
            gen_id=gen_id,
            progress=progress,
            session=session,
            task_logger=task_logger,
        )


async def get_client_background_data(gen: PlanGeneration, session: AsyncSession) -> str:
    asset_messages = await get_plan_asset(session, gen.plan_id, "messages.json")
    asset_summary = await get_plan_asset(session, gen.plan_id, "summary.md")

    client_data = ""
    if asset_messages:
        # XXX it's a json, but could be formatted as text honestly'
        messages = asset_messages.data_as_text()
        messages = render_intake_messages(messages)
        client_data += f"# Client intake messages\n\n{messages}\n\n"

    if asset_summary:
        summary = asset_summary.data_as_text()
        client_data += f"# Client intake summary\n\n{summary}\n\n"

    if not client_data:
        raise ValueError("No client data found")

    # Get client data using client_pseudo_id
    # Using unsafe version since this is a background task and we don't have access to current user
    # In production, this should use a service account with appropriate permissions
    # We could retrieve the staff_id from the plan if it exists
    record = Queries.get_client_by_pseudonymized_id_unsafe(gen.plan.client_pseudo_id)
    record_dict = {}
    if record:
        record_dict = record.model_dump()

    formatted_record = "\n".join(
        f"{key}: {value}" for key, value in record_dict.items()
    )
    return f"# Client informations\n\n{formatted_record}\n\n{client_data}"


async def _regenerate_action_plan(
    execution: Execution,
    gen: PlanGeneration,
    latest_plan_generation: PlanGeneration,
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
    action_plan_config,
):
    logger.debug(
        "Previous action plan found",
        previous_gen_id=latest_plan_generation.id.hex,
    )
    await execution.log_progress(
        session,
        5,
        "",
        logger=task_logger,
    )

    if not latest_plan_generation.gen_data_json:
        raise ValueError(
            f"Previous generation {latest_plan_generation.id} has no gen_data_json"
        )
    plan = orjson.loads(latest_plan_generation.gen_data_json)

    resource_to_remove_id = gen.resource_to_remove_id
    resource_to_remove = None
    if resource_to_remove_id:
        suggested_resources = [
            Resource.model_validate(r) for r in plan["suggested_resources"]
        ]
        resource_to_remove = next(
            (r for r in suggested_resources if r.id == resource_to_remove_id), None
        )
        if not resource_to_remove:
            raise ValueError(
                f"Resource to remove with id {resource_to_remove_id} not found in plan's suggested resources"
            )

    resource_to_add = None
    if gen.resource_to_add_content:
        resource_to_add = Resource.model_validate(gen.resource_to_add_content)

    instructions = ""
    if resource_to_add and resource_to_remove:
        instructions = textwrap.dedent(f"""
        Replace the resource [{resource_to_remove.name}](#{resource_to_remove.id}) with the resource [{resource_to_add.name}](#{resource_to_add.id}).
        Both are '{resource_to_add.category}' category resources.
        Check on appropriate sections to do this change.
        If there is no resources matching, do not change the section.
        """)
    elif resource_to_add:
        instructions = f"Add {resource_to_add}"
    elif resource_to_remove:
        instructions = f"Remove {resource_to_remove}"
    elif gen.prompt:
        instructions = gen.prompt

    if not instructions:
        logger.debug("No extra instructions or resource changes found")
        return None

    messages = plan["messages"]
    current_sections = [
        ActionPlanSection.model_validate(s)
        for s in plan["structured_action_plan"]["sections"]
    ]
    suggested_resources = [
        Resource.model_validate(r) for r in plan["suggested_resources"]
    ]

    structured_action_plan = plan["structured_action_plan"]
    current_timeline = structured_action_plan.get("timeline", None)
    if current_timeline:
        current_timeline = ActionPlanTimelines.model_validate(
            {"timelines": current_timeline}
        )

    current_milestones = structured_action_plan.get("milestones", None)
    if current_milestones:
        current_milestones = ActionPlanMilestones.model_validate(
            {"milestones": current_milestones}
        )

    # Both the plan and intake are optional on the models,
    # so we check existence for each.
    if not gen.plan:
        raise ValueError("Could not get client information for plan.")
    if not gen.plan.intake:
        raise ValueError("Plan has no associated intake.")

    # Get address from the specific intake linked to this plan
    if not gen.plan.intake.address:
        raise ValueError("Could not get client address for plan.")

    client_address = gen.plan.intake.address
    client_pseudo_id = gen.plan.client_pseudo_id

    agent = LLMAgentEdit(
        messages=messages,
        current_sections=current_sections,
        suggested_resources=suggested_resources,
        thread_id=gen.plan_id.hex,
        client_address=client_address.as_formatted_string(),
        current_timeline=current_timeline,
        current_milestones=current_milestones,
        action_plan_config=action_plan_config,
        client_pseudo_id=client_pseudo_id,
    )
    action_plan = await agent.generate(
        extra_instructions=instructions,
        resource_to_add=resource_to_add,
        resource_to_remove_id=resource_to_remove_id,
    )
    return action_plan


async def _generate_new_action_plan(
    execution: Execution,
    gen: PlanGeneration,
    previous_sections: list[str] | None,
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
    action_plan_config,
):
    await execution.log_progress(
        session, 10, "Fetching decision trees", logger=task_logger
    )
    plan_decision_trees = await get_plan_decision_tree_by_plan_id(
        session, gen.plan_id, with_decision_tree=True
    )

    await execution.log_progress(
        session,
        20,
        "Ensuring decision trees are executed before generating the action plan",
        logger=task_logger,
    )
    await ensure_plan_decision_trees_executed(
        session=session,
        task_logger=task_logger,
        plan_decision_trees=plan_decision_trees,
    )

    await execution.log_progress(
        session, 30, "Fetching client data", logger=task_logger
    )
    client_data = await get_client_background_data(gen, session)

    # Both the plan and intake are optional on the models,
    # so we check existence for each.
    if not gen.plan:
        raise ValueError("Could not get client information for plan.")
    if not gen.plan.intake:
        raise ValueError("Plan has no associated intake.")

    # Get address from the specific intake linked to this plan
    if not gen.plan.intake.address:
        raise ValueError("Could not get client address for plan.")

    client_address = gen.plan.intake.address
    client_pseudo_id = gen.plan.client_pseudo_id

    await execution.log_progress(
        session, 40, "Preparing decision tree data", logger=task_logger
    )
    decision_tree_statements = []
    for pdt in plan_decision_trees:
        entry = f"""
        For the decision tree "{pdt.decision_tree.name}", the recommandations are:
        """
        if pdt.run_statements:
            for statement in pdt.run_statements:
                entry += f"- {statement}\n"
        decision_tree_statements.append(entry)
    decision_tree_statements = "\n\n".join(decision_tree_statements)

    await execution.log_progress(
        session, 60, "Generating action plan", logger=task_logger
    )

    agent = LLMAgentGenerate(
        client_data=client_data,
        decision_tree_statements=decision_tree_statements,
        previous_sections=previous_sections,
        client_address=client_address.as_formatted_string(),
        thread_id=gen.plan_id,
        action_plan_config=action_plan_config,
        client_pseudo_id=client_pseudo_id,
    )

    action_plan = await agent.generate()
    return action_plan


async def hydrate_resource_associations(
    gen: PlanGeneration,
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
) -> None:
    """Populate PlanGenerationResourceAssociation rows for a freshly-saved generation.

    For each (section, subcategory) pair in resources_associations_map, queries the
    external resources API in parallel and writes an ADD event row per resource returned.
    Rows are deduplicated by (resource_id, section_title) before insertion.

    This is a non-critical post-processing step — errors are logged but never re-raised
    so that a resource API failure cannot fail an otherwise-complete plan generation.
    """
    if not gen.resources_associations_map:
        return

    if not gen.plan or not gen.plan.intake or not gen.plan.intake.address:
        task_logger.warning("Cannot hydrate resources: missing address")
        return

    client_address = gen.plan.intake.address.as_formatted_string()

    # Build one fetch job per (section, subcategory) pair. Each job carries its
    # section title so results can be attributed back to the correct section after
    # the parallel gather.
    fetch_jobs: list[tuple[str, GetResourcesRequest]] = []
    for section_title, assoc_dicts in gen.resources_associations_map.items():
        for assoc_dict in assoc_dicts:
            assoc = ResourceAssociation.model_validate(assoc_dict)
            fetch_jobs.append(
                (
                    section_title,
                    GetResourcesRequest(
                        category=assoc.resource_category,
                        subcategory=assoc.resource_subcategory,
                        address=client_address,
                        distance_miles=50,
                        travel_mode=TravelMode.DRIVING,
                        use_search=True,
                        limit=2
                    ),
                )
            )

    if not fetch_jobs:
        return

    task_logger.debug(
        "Fetching resources for plan generation in parallel",
        num_requests=len(fetch_jobs),
        gen_id=gen.id,
    )

    # Fire all requests concurrently; return_exceptions=True ensures one failure
    # doesn't cancel the rest — we handle each result individually below.
    results = await asyncio.gather(
        *[fetch_resources_with_retry(request) for _, request in fetch_jobs],
        return_exceptions=True,
    )

    now = datetime.now(timezone.utc)
    # Track (resource_id, section_title) pairs already queued to avoid inserting
    # duplicate rows when two subcategory requests return the same resource.
    seen: set[tuple[str, str]] = set()
    new_rows: list[PlanGenerationResourceAssociation] = []

    for (section_title, _), result in zip(fetch_jobs, results):
        if isinstance(result, BaseException):
            # Log and skip — a single failed subcategory lookup shouldn't block the rest.
            task_logger.warning(
                "Resource fetch failed for section",
                section=section_title,
                error=str(result),
            )
            continue
        for resource in result:
            # TODO: Remove when legacy `list_resources` method is no longer used in endpoints
            if resource.resource_id is None:
                continue
            key = (resource.id, section_title)
            if key in seen:
                continue
            seen.add(key)
            new_rows.append(
                PlanGenerationResourceAssociation(
                    plan_generation_id=gen.id,
                    # store the ids as `int`, as a way to validate the IDs since
                    # they are integers in the Resources API database
                    resource_id=int(resource.resource_id),
                    section_title=section_title,
                    action=ResourceAssociationAction.ADD.value,
                    action_by="SYSTEM",
                    action_at=now,
                )
            )

    if new_rows:
        session.add_all(new_rows)
        await session.commit()
        task_logger.info(
            "Resource associations hydrated", count=len(new_rows), gen_id=gen.id
        )


async def _get_latest_plan_generation(
    session: AsyncSession,
    gen: PlanGeneration,
):
    all_gens = await get_gen_by_plan_id(session, gen.plan_id)
    completed_gens = [
        g
        for g in all_gens
        if g.id != gen.id
        and g.finished_at is not None
        and g.markdown_result is not None
    ]

    if not completed_gens:
        return None

    completed_gens = sorted(completed_gens, key=lambda x: x.finished_at, reverse=True)
    return completed_gens[0]


async def generate_action_plan(
    execution: Execution,
    gen_id: UUID,
    progress: ProgressTracker[int],
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
):
    await execution.log_progress(session, 1, "Fetching plan", logger=task_logger)
    gen = await get_gen_by_id(session, gen_id, with_plan=True)
    if not gen:
        raise ValueError(f"Plan Generation with id {gen_id} not found")

    await execution.log_progress(
        session, 5, "Generating action plan", logger=task_logger
    )

    # Load action plan config from assessment
    if not gen.plan.intake:
        raise ValueError(
            f"Cannot generate action plan: plan {gen.plan.id} has no associated intake"
        )

    intake = gen.plan.intake

    if not intake.assessment_config_id:
        raise ValueError(
            f"Cannot generate action plan: intake {intake.id} has no assessment_config_id"
        )

    action_plan_config = await ConfigLoader.load_plan_config(
        intake.assessment_config_id, session
    )

    if not action_plan_config:
        task_logger.error(
            "No action plan config found for assessment",
            assessment_config_id=intake.assessment_config_id,
        )
        raise ValueError(
            f"Cannot generate action plan: no action plan config found for assessment_config_id={intake.assessment_config_id}. "
            f"This assessment config only supports intake summary generation."
        )

    task_logger.debug(
        "Loaded action plan config",
        config_code=action_plan_config.metadata.code,
    )

    # Check if there is a previous plan generated
    latest_plan_generation = await _get_latest_plan_generation(session, gen)

    if latest_plan_generation and not gen.force_generation:
        action_plan = await _regenerate_action_plan(
            execution=execution,
            gen=gen,
            latest_plan_generation=latest_plan_generation,
            session=session,
            task_logger=task_logger,
            action_plan_config=action_plan_config,
        )
        if not action_plan:
            return
    else:
        # Check and log previous section names if the home address changed
        previous_sections = None
        if gen.force_generation and latest_plan_generation:
            previous_plan = orjson.loads(latest_plan_generation.gen_data_json)
            previous_sections = [
                section["title"]
                for section in previous_plan["structured_action_plan"]["sections"]
            ]
            task_logger.debug(
                "Home address changed, previous sections found and will be reused",
                sections=previous_sections,
            )

        action_plan = await _generate_new_action_plan(
            execution=execution,
            gen=gen,
            previous_sections=previous_sections,
            session=session,
            task_logger=task_logger,
            action_plan_config=action_plan_config,
        )

    await execution.log_progress(session, 90, "Saving action plan", logger=task_logger)
    gen.markdown_result = action_plan.action_plan
    gen.gen_data_json = str(action_plan.model_dump_json())
    gen.finished_at = datetime.utcnow()

    # Transform and save resources associations
    if action_plan.resources_associations:
        resources_map = transform_resources_associations_to_map(action_plan.resources_associations)
        if resources_map:
            # Convert Pydantic models to dict for JSON serialization
            gen.resources_associations_map = {
                section: [assoc.model_dump() for assoc in associations]
                for section, associations in resources_map.items()
            }

    await update_plan_generation(session, gen)

    try:
        await hydrate_resource_associations(gen, session, task_logger)
    except Exception as e:
        task_logger.error("Failed to hydrate resource associations", error=str(e))
