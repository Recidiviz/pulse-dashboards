"""
Plan Decision Tree Tasks
========================

Module for handling tasks and utilities related to decision tree processing.

This module includes functionality to select and run decision trees for plans using
the `taskiq` task queue framework. It interacts with the database to fetch or persist
decision tree-related data and utilizes a runner to execute decision tree logic based
on the plan's context.

Classes and functions are also provided for managing tasks asynchronously and ensuring
proper logging via the `structlog` library.
"""

from uuid import UUID

import structlog
from taskiq import TaskiqDepends
from taskiq.depends.progress_tracker import ProgressTracker

from app.core.db import AsyncSession, get_session
from app.crud.decision_tree import get_decision_tree_by_id, get_decision_trees
from app.crud.plan import Plan, get_plan_by_id
from app.crud.plan_asset import PlanAsset, get_assets_by_plan_id
from app.crud.plan_decision_tree import (
    PlanDecisionTree,
    create_plan_decision_tree,
    get_plan_decision_tree_by_id,
    get_plan_decision_tree_by_plan_id,
)
from app.utils.decision_tree_runner import DecisionTreeRunner, DecisionTreeSelection

from .base import broker
from .scheduler import Execution, execution_context

logger = structlog.get_logger(__name__)


async def get_plan_asset(
    session: AsyncSession, plan_id: UUID, filename: str
) -> PlanAsset | None:
    assets = await get_assets_by_plan_id(session, plan_id)

    # ensure there is the intake_json available
    asset = next((asset for asset in assets if asset.filename == filename), None)
    if not asset:
        logger.warning("Asset not found", plan_id=plan_id, filename=filename)
        return None

    return asset


async def get_decision_runner_with_data(
    session: AsyncSession, plan: Plan, execution_id: UUID
) -> DecisionTreeRunner:
    # Load action plan config from intake
    from app.crud.intake import get_intake_by_client_pseudo_id
    from app.utils.config_loader import ConfigLoader

    # TODO phase 2 : link plan to intake and planconfig to plan so we can load the config from plan without relying on one plan per client
    intake = await get_intake_by_client_pseudo_id(
        session, client_pseudo_id=plan.client_pseudo_id
    )
    if not intake:
        raise ValueError(
            f"Cannot run decision tree: no intake found for client {plan.client_pseudo_id}"
        )

    if not intake.assessment_config_id:
        raise ValueError(
            f"Cannot run decision tree: intake for client {plan.client_pseudo_id} has no assessment_config_id"
        )

    try:
        action_plan_config = await ConfigLoader.load_plan_config(
            intake.assessment_config_id, session
        )
        logger.debug(
            "Loaded action plan config for decision tree",
            config_code=action_plan_config.metadata.code,
        )
    except Exception as e:
        logger.error(
            "Failed to load action plan config",
            assessment_config_id=intake.assessment_config_id,
            error=str(e),
        )
        raise ValueError(
            f"Cannot run decision tree: failed to load config for assessment_config_id={intake.assessment_config_id}: {e}"
        )

    # load all assets
    asset_messages = await get_plan_asset(session, plan.id, "messages.json")
    asset_summary = await get_plan_asset(session, plan.id, "summary.md")
    asset_assessment_summary = await get_plan_asset(
        session, plan.id, "assessment_summary.md"
    )

    # instanciate the decision tree runner
    runner = DecisionTreeRunner(
        action_plan_config=action_plan_config, task_id=execution_id
    )
    if asset_messages:
        runner.set_client_messages(asset_messages.data_as_json())
    if asset_summary:
        runner.set_client_summary(asset_summary.data_as_text())
    if asset_assessment_summary:
        runner.set_client_assessment_summary(asset_assessment_summary.data_as_text())
    if not any([asset_messages, asset_summary]):
        raise ValueError("No assets found for plan (messages.json or summary.md)")

    return runner


@broker.task
async def plan_decision_tree_select_task(
    execution_id: UUID,
    plan_id: UUID,
    progress: ProgressTracker[int] = TaskiqDepends(),
    session: AsyncSession = TaskiqDepends(get_session),
):
    async with execution_context(session, execution_id) as execution:
        task_logger = logger.bind(execution_id=execution_id.hex, plan_id=plan_id.hex)
        await plan_decision_tree_select(
            execution=execution,
            plan_id=plan_id,
            progress=progress,
            session=session,
            task_logger=task_logger,
        )


async def plan_decision_tree_select(
    execution: Execution,
    plan_id: UUID,
    progress: ProgressTracker[int],
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
):
    """
    This function processes a plan's decision trees by selecting applicable decision
    trees for a given plan. It utilizes a decision tree runner to evaluate which
    decision trees should be applied based on the plan's data. It handles fetching
    necessary decision trees, running the evaluation, and updating the database
    with the new decision tree selections if they are not already associated with
    the plan.
    """
    # fetch the plan
    task_logger.debug("Fetching plan")
    plan = await get_plan_by_id(session, plan_id)
    if not plan:
        raise ValueError(f"Plan with id {plan_id} not found")

    # load all decision trees
    task_logger.debug("Load enabled decision trees")
    decision_trees = await get_decision_trees(
        session,
        include_revisions=True,
    )
    task_logger.debug(f"Found {len(decision_trees)} decision trees")

    # use the DecisionTreeRunner to find the decision trees to apply for the client
    task_logger.debug("Instantiate DecisionTreeRunner")
    runner = await get_decision_runner_with_data(
        session, plan, execution_id=execution.id
    )
    runner.load_decision_trees(decision_trees)

    task_logger.info("Find decision trees to apply")
    dt_llm_selection: list[
        DecisionTreeSelection
    ] = await runner.find_decision_trees_to_applies()

    task_logger.info(
        f"Found {len(dt_llm_selection)} decision trees to apply",
        dt_llm_selection=dt_llm_selection,
    )

    decision_trees_by_name = {dt.name: dt for dt in decision_trees}

    # load all current plan decision trees of the current plan
    decision_tree_plans = await get_plan_decision_tree_by_plan_id(session, plan_id)

    # create the one that are missing
    # XXX require an upsert, but sqlmodel does not support it...
    # Found https://github.com/dan1elt0m/sadel but need to check it.
    task_logger.info(f"Create {len(dt_llm_selection)} missing plan decision trees")
    for selection in dt_llm_selection:
        name = selection.decision_tree_key
        decision_tree = decision_trees_by_name.get(name)
        if decision_tree is None:
            logger.warning(f"Decision tree '{name}' not found in the database")
            continue

        if any(decision_tree.id == pdt.decision_tree_id for pdt in decision_tree_plans):
            task_logger.warning(
                f"Decision tree {decision_tree.name} already in the plan"
            )
            continue

        data = selection.model_dump()
        annotations = data.get("annotations", {})

        plan_decision_tree = PlanDecisionTree(
            plan_id=plan_id,
            decision_tree_id=decision_tree.id,
            annotations=annotations,
        )
        await create_plan_decision_tree(session, plan_decision_tree)
        task_logger.info(f"Decision tree {decision_tree.name} added to the plan")


@broker.task
async def plan_decision_tree_run_task(
    execution_id: UUID,
    plan_decision_tree_id: UUID,
    progress: ProgressTracker[int] = TaskiqDepends(),
    session: AsyncSession = TaskiqDepends(get_session),
):
    async with execution_context(session, execution_id) as execution:
        task_logger = logger.bind(
            execution_id=execution_id.hex,
            plan_decision_tree_id=plan_decision_tree_id.hex,
        )
        await plan_decision_tree_run(
            execution=execution,
            plan_decision_tree_id=plan_decision_tree_id,
            progress=progress,
            session=session,
            task_logger=task_logger,
        )


async def plan_decision_tree_run(
    execution: Execution,
    plan_decision_tree_id: UUID,
    progress: ProgressTracker[int],
    session: AsyncSession,
    task_logger: structlog.BoundLogger,
):
    task_logger.info("Execute plan decision tree")
    plan_decision_tree = await get_plan_decision_tree_by_id(
        session,
        plan_decision_tree_id,
        with_plan=True,
    )
    if not plan_decision_tree:
        raise ValueError(
            f"Plan decision tree with id {plan_decision_tree_id} not found"
        )

    # load the decision_tree with revisions
    decision_tree = await get_decision_tree_by_id(
        session, plan_decision_tree.decision_tree_id
    )
    if not decision_tree:
        raise ValueError(
            f"Decision tree with id {plan_decision_tree.decision_tree_id} not found"
        )
    revision = decision_tree.revisions[-1]

    # load the decision tree runner
    runner = await get_decision_runner_with_data(
        session, plan_decision_tree.plan, execution_id=execution.id
    )
    runner.load_decision_tree_content(decision_tree.name, revision.mermaid_content)

    # execute the decision tree
    result = await runner.run_decision_tree(decision_tree.name)

    # it's a pydantic object, let's save it but separate for database
    jresult = result.model_dump()

    # update plan_decision_tree
    plan_decision_tree.run_statements = jresult["statements"]
    plan_decision_tree.run_steps = jresult["steps"]
    plan_decision_tree.execution_id = execution.id
    await create_plan_decision_tree(session, plan_decision_tree)

    task_logger.info("Plan decision tree executed", result=jresult)
