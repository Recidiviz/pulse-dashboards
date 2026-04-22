"""
Output config eval task
=======================

Generates summaries using the target output config against a set of hardcoded
intakes, runs grounding and coverage LLM-as-judge evaluations for each, and
persists aggregated results.
"""

from datetime import datetime, timezone
from uuid import UUID

import structlog
import yaml
from taskiq import TaskiqDepends

from app.core.data_config.output_configs.output_config import IntakeSummaryConfigFile
from app.core.db import AsyncSession, get_session
from app.crud.intake import get_intake_messages
from app.crud.output_config_eval_result import (
    get_output_config_eval_result_by_id,
    update_output_config_eval_result,
)
from app.manage.evaluate.evaluate_summary import (
    _run_evaluations,
    format_conversation_from_messages,
)
from app.manage.evaluate.summary_evals import COVERAGE_PASS_THRESHOLD
from app.utils.intake_summary_runner import generate_summary

from .base import broker
from .scheduler import execution_context

logger = structlog.get_logger(__name__)


@broker.task
async def output_config_eval_task(
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

        await execution.log_progress(session, 5, "Parsing output config")
        config_file = IntakeSummaryConfigFile.model_validate(
            yaml.safe_load(output_config_yaml)
        )
        system_prompt = config_file.prompts.system if config_file.prompts else None

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
            formatted = format_conversation_from_messages(conversation_messages)

            try:
                summary = await generate_summary(formatted, config_file)
                eval_metrics = await _run_evaluations(summary, formatted, system_prompt)
                per_intake_results.append({"intake_id": intake_id_str, **eval_metrics})
            except Exception as e:
                logger.exception("Eval failed for intake", intake_id=intake_id_str)
                per_intake_results.append({"intake_id": intake_id_str, "error": str(e)})

        await execution.log_progress(session, 90, "Aggregating results")

        successful = [r for r in per_intake_results if "error" not in r]
        grounding_scores = [
            r["grounding"]["score"] for r in successful if r.get("grounding")
        ]
        coverage_scores = [
            r["coverage"]["score"] for r in successful if r.get("coverage")
        ]

        summary_stats = {
            "n": n,
            "n_successful": len(successful),
            "coverage_pass_threshold": COVERAGE_PASS_THRESHOLD,
            "grounding_pass_rate": (
                sum(grounding_scores) / len(grounding_scores)
                if grounding_scores
                else None
            ),
            "coverage_mean": (
                sum(coverage_scores) / len(coverage_scores) if coverage_scores else None
            ),
            "coverage_pass_rate": (
                sum(1 for s in coverage_scores if s >= COVERAGE_PASS_THRESHOLD)
                / len(coverage_scores)
                if coverage_scores
                else None
            ),
        }

        metrics = {"summary": summary_stats, "intakes": per_intake_results}

        await update_output_config_eval_result(
            session,
            eval_result,
            metrics=metrics,
            ran_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
