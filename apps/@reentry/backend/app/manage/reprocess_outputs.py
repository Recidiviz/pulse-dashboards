# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================
"""
Reprocess outputs (Summary + Action Plan) for specific intakes with a different output config.

This script deletes the existing plan for each intake and regenerates it from scratch
using the specified output config. Decision tree results from the existing plan are
preserved and reused (re-running decision tree selection requires the Taskiq broker).

Usage:
    uv run python -m app.manage reprocess-outputs \\
        <intake_id_1> <intake_id_2> \\
        --summary-config-code my-summary-config-v2 \\
        --plan-config-code my-plan-config-v2

The output config type (intake_summary or action_plan) determines which output it
overrides. The other type falls back to the config linked to the assessment config.

Running against a non-local environment (staging, prod, etc.)
--------------------------------------------------------------
STEP 1 — Start Cloud SQL Proxy in a separate terminal and leave it running:

    cloud-sql-proxy recidiviz-rnd-planner:us-central1:recidiviz-staging --port 5433
    # prod:  recidiviz-rnd-planner:us-central1:recidiviz-prod
    # pilot: recidiviz-rnd-planner:us-central1:recidiviz-pilot

STEP 2 — In your original terminal, run the script with the remote DB credentials:

    RECIDIVIZ_POSTGRES_SERVER=127.0.0.1 \\
    RECIDIVIZ_POSTGRES_PORT=5433 \\
    RECIDIVIZ_POSTGRES_USER=<db-user> \\
    RECIDIVIZ_POSTGRES_PASSWORD=<db-password> \\
    RECIDIVIZ_POSTGRES_DB=<db-name> \\
        uv run python -m app.manage reprocess-outputs \\
            <intake_id_1> <intake_id_2> \\
            --summary-config-code my-summary-config-v2 \\
            --plan-config-code my-plan-config-v2
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Optional
from uuid import UUID

import structlog
import typer

from app.core.data_config.output_configs.loader import OutputFileLoader
from app.core.db import get_session_async_manager
from app.crud.config_management import get_active_output_config
from app.crud.intake import get_intake_by_id, get_intake_messages
from app.crud.plan import (
    Plan,
    create_plan,
    delete_plan_by_id,
    get_plan_by_intake_id,
)
from app.crud.plan_asset import PlanAsset, get_assets_by_plan_id
from app.crud.plan_decision_tree import get_plan_decision_tree_by_plan_id
from app.crud.plan_generation import (
    PlanGeneration,
    create_plan_generation,
    get_gen_by_plan_id,
)
from app.models.base import IntakeType
from app.models.execution import Execution, ExecutionStatus
from app.models.models import GenerationType
from app.models.output_config import OutputType
from app.models.plan_decision_tree import PlanDecisionTree
from app.tasks.action_plan import generate_action_plan
from app.utils.config_loader import ConfigLoader
from app.utils.intake_summary_runner import generate_summary

from .base import cli

logger = structlog.get_logger(__name__)


@cli.command()
async def reprocess_outputs(
    intake_ids: Annotated[
        list[str],
        typer.Argument(help="One or more intake UUIDs to reprocess"),
    ],
    summary_config_code: Annotated[
        Optional[str],
        typer.Option(
            "--summary-config-code",
            help="Code of an intake_summary OutputConfig to use (from DB, must be active).",
        ),
    ] = None,
    plan_config_code: Annotated[
        Optional[str],
        typer.Option(
            "--plan-config-code",
            help="Code of an action_plan OutputConfig to use (from DB, must be active).",
        ),
    ] = None,
    dry_run: Annotated[
        bool,
        typer.Option(
            "--dry-run",
            help="Validate inputs and show what would be done without making any changes or LLM calls.",
        ),
    ] = False,
):
    """
    Delete and recreate Summary + Action Plan for the given intakes using a
    different output config. Does not require the Taskiq broker to be running.
    """

    if not summary_config_code and not plan_config_code:
        typer.echo(
            "❌ At least one of --summary-config-code or --plan-config-code is required",
            err=True,
        )
        raise typer.Exit(1)

    if dry_run:
        typer.echo("🔍 DRY RUN — no changes will be made\n")

    async with get_session_async_manager() as session:
        # --- Load and validate all specified output configs up front ---
        summary_config_override = None
        plan_config_override = None

        for code, expected_type in [
            (summary_config_code, OutputType.intake_summary),
            (plan_config_code, OutputType.action_plan),
        ]:
            if not code:
                continue
            output_db = await get_active_output_config(session, code)
            if not output_db:
                typer.echo(
                    f"❌ Output config '{code}' not found or not active", err=True
                )
                raise typer.Exit(1)
            if output_db.output_type != expected_type:
                typer.echo(
                    f"❌ Config '{code}' has type '{output_db.output_type}' "
                    f"but expected '{expected_type.value}'",
                    err=True,
                )
                raise typer.Exit(1)

            parsed = OutputFileLoader.validate_yaml_content(output_db.config_yaml)
            typer.echo(
                f"Loaded: {output_db.code} v{output_db.version} (type={output_db.output_type})"
            )

            if expected_type == OutputType.intake_summary:
                summary_config_override = parsed
            else:
                plan_config_override = parsed

        # --- Process each intake ---
        for intake_id_str in intake_ids:
            typer.echo(f"\n{'='*60}")
            typer.echo(f"Intake: {intake_id_str}")

            intake = await get_intake_by_id(session, UUID(intake_id_str))
            if not intake:
                typer.echo("  ⚠️  Not found, skipping", err=True)
                continue

            typer.echo(f"  Client: {intake.client_pseudo_id}")
            typer.echo(f"  Type:   {intake.intake_type}")

            if intake.intake_type != IntakeType.CONVERSATION.value:
                typer.echo(
                    f"  ⚠️  intake_type={intake.intake_type} is not supported by this script, skipping"
                )
                continue

            # 1. Fetch and format messages
            typer.echo("  Fetching messages...")
            intake_messages = await get_intake_messages(session, intake_id=intake.id)
            if not intake_messages:
                typer.echo("  ❌ No messages found, skipping")
                continue
            typer.echo(f"  Found {len(intake_messages)} messages")

            messages_json = []
            formatted_messages_list = []
            for msg in intake_messages:
                role = "client" if msg.from_role == "client" else "case manager"
                messages_json.append(
                    {"role": role, "content": msg.content, "section": msg.section}
                )
                fmt_role = "client" if msg.from_role == "client" else "assistant"
                formatted_messages_list.append(f'{fmt_role}: "{msg.content}"')
            formatted_messages = "\n".join(formatted_messages_list)

            # 2. Capture decision tree results before deleting the existing plan
            captured_trees: list[dict] = []
            existing_plan = await get_plan_by_intake_id(session, intake.id)

            if existing_plan:
                typer.echo(
                    f"  Found existing plan {existing_plan.id}, capturing decision trees..."
                )
                plan_decision_trees = await get_plan_decision_tree_by_plan_id(
                    session, existing_plan.id, with_decision_tree=True
                )
                for pdt in plan_decision_trees:
                    captured_trees.append(
                        {
                            "decision_tree_id": pdt.decision_tree_id,
                            "run_statements": pdt.run_statements,
                            "run_steps": pdt.run_steps,
                        }
                    )
                typer.echo(f"  Captured {len(plan_decision_trees)} decision tree(s)")

                # Backup existing assets and generations before deletion
                existing_assets = await get_assets_by_plan_id(session, existing_plan.id)
                existing_gens = await get_gen_by_plan_id(session, existing_plan.id)

                backup_dir = (
                    Path(__file__).parents[3]
                    / "backups"
                    / "reprocess_outputs"
                    / f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}_{intake_id_str[:8]}"
                )

                if dry_run:
                    typer.echo(
                        f"  [DRY RUN] Would back up {len(existing_assets)} asset(s) and "
                        f"{len(existing_gens)} generation(s) to {backup_dir}"
                    )
                else:
                    backup_dir.mkdir(parents=True, exist_ok=True)

                    for asset in existing_assets:
                        if asset.file_blob:
                            asset_path = backup_dir / asset.filename
                            asset_path.write_bytes(asset.file_blob)

                    for gen in existing_gens:
                        if gen.markdown_result:
                            (backup_dir / f"generation_{gen.id}_plan.md").write_text(
                                gen.markdown_result
                            )
                        if gen.gen_data_json:
                            (backup_dir / f"generation_{gen.id}_data.json").write_text(
                                gen.gen_data_json
                            )

                    typer.echo(
                        f"  Backed up {len(existing_assets)} asset(s) and "
                        f"{len(existing_gens)} generation(s) to {backup_dir}"
                    )

                if dry_run:
                    typer.echo(f"  [DRY RUN] Would delete plan {existing_plan.id}")
                else:
                    typer.confirm(
                        f"  Delete plan {existing_plan.id} for intake {intake_id_str}?",
                        abort=True,
                    )
                    typer.echo(f"  Deleting plan {existing_plan.id}...")
                    await delete_plan_by_id(session, existing_plan.id)
                    # Refresh the intake so SQLAlchemy doesn't see a stale intake.plan
                    # reference during the next flush. The Intake.plan relationship has
                    # cascade="all, delete-orphan"; without this, SQLAlchemy may try to
                    # re-delete the already-deleted plan and raise StaleDataError, rolling
                    # back the new plan INSERT.
                    await session.refresh(intake)
            else:
                typer.echo("  No existing plan found, starting fresh")

            # 3. Create new Plan
            if dry_run:
                typer.echo("  [DRY RUN] Would create new Plan")
                plan = None
                execution = None
            else:
                plan = Plan(
                    client_pseudo_id=intake.client_pseudo_id, intake_id=intake.id
                )
                plan = await create_plan(session, plan)
                typer.echo(f"  Created plan {plan.id}")

                # Create a completed stub execution so the UI treats the plan as
                # finished (drives is_create_execution_finished and processing status).
                execution = Execution(
                    status=ExecutionStatus.COMPLETED,
                    table_name="plan",
                    table_entity_id=plan.id,
                    progress=100,
                    message="Reprocessed via manage command",
                )
                session.add(execution)
                await session.commit()
                await session.refresh(execution)
                plan.create_execution_id = execution.id
                session.add(plan)
                await session.commit()
                typer.echo(f"  Created stub execution {execution.id}")

                # Re-attach captured decision trees so generate_action_plan can find
                # them without re-running the decision tree task.
                for tree_data in captured_trees:
                    stub_tree_exec = Execution(
                        status=ExecutionStatus.COMPLETED,
                        table_name="plandecisiontrees",
                        table_entity_id=plan.id,
                        progress=100,
                        message="Reprocessed via manage command",
                    )
                    session.add(stub_tree_exec)
                    await session.flush()
                    session.add(
                        PlanDecisionTree(
                            plan_id=plan.id,
                            decision_tree_id=tree_data["decision_tree_id"],
                            execution_id=stub_tree_exec.id,
                            run_statements=tree_data["run_statements"],
                            run_steps=tree_data["run_steps"],
                        )
                    )
                if captured_trees:
                    await session.commit()
                    typer.echo(f"  Re-attached {len(captured_trees)} decision tree(s)")

            # 4. Save messages.json asset
            if dry_run:
                typer.echo(
                    f"  [DRY RUN] Would save messages.json ({len(messages_json)} messages)"
                )
            else:
                session.add(
                    PlanAsset(
                        plan_id=plan.id,
                        filename="messages.json",
                        file_blob=json.dumps(messages_json).encode("utf-8"),
                        mimetype="application/json",
                    )
                )
                await session.commit()
                typer.echo("  Saved messages.json")

            # 5. Resolve summary config
            summary_config = (
                summary_config_override
                or await ConfigLoader.load_summary_config(
                    intake.assessment_config_id, session
                )
            )

            summary_text: Optional[str] = None
            if summary_config:
                summary_source = (
                    f"override ({summary_config_code})"
                    if summary_config_override
                    else "assessment default"
                )
                if dry_run:
                    typer.echo(
                        f"  [DRY RUN] Would generate summary using config: {summary_source}"
                    )
                else:
                    typer.echo(f"  Generating summary (config: {summary_source})...")
                    summary_text = await generate_summary(
                        formatted_messages,
                        summary_config,
                        client_pseudo_id=intake.client_pseudo_id,
                    )
                    session.add(
                        PlanAsset(
                            plan_id=plan.id,
                            filename="summary.md",
                            file_blob=summary_text.encode("utf-8"),
                            mimetype="text/markdown",
                        )
                    )
                    await session.commit()
                    typer.echo("  Saved summary.md")
            else:
                typer.echo("  ⚠️  No summary config found, skipping summary generation")

            # 6. Resolve action plan config
            plan_config = plan_config_override or await ConfigLoader.load_plan_config(
                intake.assessment_config_id, session
            )

            if not plan_config:
                typer.echo(
                    "  ℹ️  No action plan config for this assessment — summary-only workflow, done"
                )
                continue

            if not intake.address:
                typer.echo("  ❌ No address on intake — cannot generate action plan")
                continue

            # 7. Generate action plan
            plan_source = (
                f"override ({plan_config_code})"
                if plan_config_override
                else "assessment default"
            )
            if dry_run:
                typer.echo(
                    f"  [DRY RUN] Would generate action plan using config: {plan_source} "
                    f"with {len(captured_trees)} decision tree(s)"
                )
                typer.echo("  [DRY RUN] Would save PlanGeneration to DB")
            else:
                typer.echo(f"  Generating action plan (config: {plan_source})...")

                gen = PlanGeneration(plan_id=plan.id, gen_type=GenerationType.MANUAL)
                gen = await create_plan_generation(session, gen)

                await generate_action_plan(
                    execution=execution,
                    gen_id=gen.id,
                    progress=None,
                    session=session,
                    task_logger=logger,
                    action_plan_config=plan_config,
                )
                typer.echo(f"  ✅ Action plan saved (generation {gen.id})")

        typer.echo(f"\n{'='*60}")
        typer.echo("Dry run complete — no changes made" if dry_run else "Done")
