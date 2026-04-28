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
Action plan config eval task
============================

For each predefined test intake, generates an ephemeral action plan using the
target output config, runs 9 markdown quality evaluators (LLM-as-judge), and
persists aggregated results to OutputConfigEvalResult.
"""

from datetime import datetime, timezone
from uuid import UUID, uuid4

import orjson
import structlog
from taskiq import TaskiqDepends

from app.core.data_config.output_configs.loader import OutputFileLoader
from app.core.db import AsyncSession, get_session
from app.crud.intake import get_intake_messages, get_intake_with_address_and_recording
from app.crud.output_config_eval_result import (
    get_output_config_eval_result_by_id,
    update_output_config_eval_result,
)
from app.crud.plan import get_plan_by_intake_id
from app.crud.plan_asset import get_asset_by_filename
from app.manage.evaluate.evaluate_generation import (
    _BINARY_EVALUATORS,
    _SCORE_EVALUATORS,
    GenEvalItem,
    _mean,
    _run_evaluations_gen,
)
from app.tasks.action_plan import render_intake_messages
from app.utils.llm_agent_gen_plan import LLMAgentGenerate

from .base import broker
from .scheduler import execution_context

logger = structlog.get_logger(__name__)


@broker.task
async def action_plan_config_eval_task(
    execution_id: UUID,
    eval_result_id: UUID,
    output_config_yaml: str,
    intake_ids: list[str],
    session: AsyncSession = TaskiqDepends(get_session),
):
    async with execution_context(session, execution_id) as execution:
        eval_result = await get_output_config_eval_result_by_id(session, eval_result_id)
        if not eval_result:
            raise ValueError(f"EvalResult {eval_result_id} not found")

        await execution.log_progress(session, 5, "Parsing action plan config")
        action_plan_config = OutputFileLoader.validate_yaml_content(output_config_yaml)

        n = len(intake_ids)
        per_intake_results = []

        for i, intake_id_str in enumerate(intake_ids):
            intake_uuid = UUID(intake_id_str)
            progress = 10 + int(80 * i / n)
            await execution.log_progress(
                session, progress, f"Evaluating intake {i + 1}/{n}"
            )

            intake_messages = await get_intake_messages(session, intake_id=intake_uuid)
            if not intake_messages:
                logger.warning(
                    "No messages for intake, skipping", intake_id=intake_id_str
                )
                per_intake_results.append(
                    {"intake_id": intake_id_str, "error": "No messages found"}
                )
                continue

            conversation_messages = [
                {
                    "role": "client" if m.from_role == "client" else "assistant",
                    "content": m.content,
                }
                for m in intake_messages
            ]

            messages_json = orjson.dumps(conversation_messages).decode()
            messages_text = render_intake_messages(messages_json)
            client_data = f"# Client intake messages\n\n{messages_text}\n\n"

            plan = await get_plan_by_intake_id(session, intake_uuid)
            if plan:
                summary_asset = await get_asset_by_filename(
                    session, plan.id, "summary.md"
                )
                if summary_asset and summary_asset.file_blob:
                    client_data += f"# Client intake summary\n\n{summary_asset.file_blob.decode('utf-8')}\n\n"

                assessment_asset = await get_asset_by_filename(
                    session, plan.id, "assessment_summary.md"
                )
                if assessment_asset and assessment_asset.file_blob:
                    client_data += f"# Client risk summary\n\n{assessment_asset.file_blob.decode('utf-8')}\n\n"

            intake = await get_intake_with_address_and_recording(session, intake_uuid)
            address = (
                intake.address.as_formatted_string()
                if intake and intake.address
                else ""
            )

            try:
                agent = LLMAgentGenerate(
                    client_data=client_data,
                    decision_tree_statements="",
                    client_address=address,
                    previous_sections=None,
                    thread_id=uuid4(),
                    action_plan_config=action_plan_config,
                )
                result = await agent.generate()

                item = GenEvalItem(
                    messages=conversation_messages,
                    summary="",
                    action_plan=result.action_plan,
                    structured_plan=result.structured_action_plan,
                    meta={"intake_id": intake_id_str},
                )
                scores = await _run_evaluations_gen(item)

                per_intake_results.append(
                    {
                        "intake_id": intake_id_str,
                        **{
                            k: {
                                "score": v.get("score"),
                                "explanation": v.get("explanation"),
                            }
                            for k, v in scores.items()
                        },
                    }
                )
            except Exception as e:
                logger.exception("Eval failed for intake", intake_id=intake_id_str)
                per_intake_results.append({"intake_id": intake_id_str, "error": str(e)})

        await execution.log_progress(session, 90, "Aggregating results")

        successful = [r for r in per_intake_results if "error" not in r]

        summary_stats: dict = {"n": n, "n_successful": len(successful)}

        for key in _SCORE_EVALUATORS:
            values = [
                r[key]["score"]
                for r in successful
                if r.get(key) and r[key].get("score") is not None
            ]
            summary_stats[f"{key}_mean"] = _mean(values)

        for key in _BINARY_EVALUATORS:
            values = [
                1 if r.get(key, {}).get("score") == 1 else 0
                for r in successful
                if r.get(key)
            ]
            summary_stats[f"{key}_pass_rate"] = _mean(values)

        await update_output_config_eval_result(
            session,
            eval_result,
            metrics={"summary": summary_stats, "intakes": per_intake_results},
            ran_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
