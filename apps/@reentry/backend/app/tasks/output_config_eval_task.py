"""
Output config eval task
=======================

Generates summaries using the target output config against a set of hardcoded
intakes, runs grounding and coverage LLM-as-judge evaluations for each, and
persists aggregated results.
"""

import asyncio
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
from app.manage.evaluate.evaluate_generation import _mean
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

        # Fetch all transcripts upfront using the shared session (sequential, fast).
        await execution.log_progress(session, 10, "Loading intake transcripts")
        intake_transcripts: list[tuple[str, str | None]] = []
        for intake_id_str in intake_ids:
            intake_uuid = UUID(intake_id_str)
            intake_messages = await get_intake_messages(session, intake_id=intake_uuid)
            if not intake_messages:
                logger.warning(
                    "No messages for intake, skipping", intake_id=intake_id_str
                )
                intake_transcripts.append((intake_id_str, None))
                continue
            conversation_messages = [
                {
                    "role": "client" if m.from_role == "client" else "assistant",
                    "content": m.content,
                }
                for m in intake_messages
            ]
            intake_transcripts.append(
                (
                    intake_id_str,
                    format_conversation_from_messages(conversation_messages),
                )
            )

        # Run LLM-heavy work (summary generation + evaluators) in parallel.
        # Cap at 10 concurrent to avoid rate limits.
        await execution.log_progress(
            session, 20, f"Running evals for {n} intakes in parallel"
        )
        _sem = asyncio.Semaphore(10)

        async def _eval_one(intake_id_str: str, formatted: str | None) -> dict:
            if formatted is None:
                return {"intake_id": intake_id_str, "error": "No messages found"}
            async with _sem:
                try:
                    summary = await generate_summary(formatted, config_file)
                    eval_metrics = await _run_evaluations(
                        summary, formatted, system_prompt
                    )
                    return {
                        "intake_id": intake_id_str,
                        "transcript": formatted,
                        "summary": summary,
                        **eval_metrics,
                    }
                except Exception as e:
                    logger.exception("Eval failed for intake", intake_id=intake_id_str)
                    return {"intake_id": intake_id_str, "error": str(e)}

        per_intake_results = list(
            await asyncio.gather(
                *[_eval_one(iid, fmt) for iid, fmt in intake_transcripts]
            )
        )

        await execution.log_progress(session, 90, "Aggregating results")

        successful = [r for r in per_intake_results if "error" not in r]

        def _scores(key: str) -> list[int]:
            return [r[key]["score"] for r in successful if r.get(key)]

        grounding_scores = _scores("grounding")
        coverage_scores = _scores("coverage")
        not_toxic_scores = _scores("not_toxic")
        tone_scores = _scores("tone")
        no_judgments_scores = _scores("no_judgments")
        has_section_headers_scores = _scores("has_section_headers")
        section_length_scores = _scores("section_length")

        summary_stats = {
            "n": n,
            "n_successful": len(successful),
            "coverage_pass_threshold": COVERAGE_PASS_THRESHOLD,
            "grounding_pass_rate": _mean(grounding_scores),
            "coverage_mean": _mean(coverage_scores),
            "coverage_pass_rate": (
                sum(1 for s in coverage_scores if s >= COVERAGE_PASS_THRESHOLD)
                / len(coverage_scores)
                if coverage_scores
                else None
            ),
            "not_toxic_pass_rate": _mean(not_toxic_scores),
            "tone_mean": _mean(tone_scores),
            "no_judgments_mean": _mean(no_judgments_scores),
            "has_section_headers_mean": _mean(has_section_headers_scores),
            "section_length_mean": _mean(section_length_scores),
        }

        metrics = {"summary": summary_stats, "intakes": per_intake_results}

        await update_output_config_eval_result(
            session,
            eval_result,
            metrics=metrics,
            ran_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
