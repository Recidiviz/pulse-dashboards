"""
Evaluate summary generation using fake conversation and assessment data, or real data from the database.

This command allows testing the summary generation pipeline without running a full conversation,
using pre-defined conversation history data from JSON files or default values, or
loading real intakes/plans from the database.

NOTE: Config YAML files are now managed via the Config Management UI.
To use this command, first export a config from the UI at /config, then provide
the exported file name as the output_config_name parameter.
"""

import asyncio
import csv
import json
import logging
from dataclasses import dataclass
from datetime import datetime
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

import sqlalchemy as sa
import structlog
from dotenv import load_dotenv
from langsmith.schemas import Example, Run
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.data_config.output_configs.loader import OutputFileLoader
from app.crud.intake import get_intake_messages
from app.crud.plan_asset import get_asset_by_filename
from app.models.base import IntakeType
from app.utils.config_loader import ConfigLoader
from app.utils.intake_summary_runner import generate_summary

from ..base import cli
from ..extract_intake_conversation import get_postgres_engine
from ._html_utils import write_html_report
from .summary_evals import (
    COVERAGE_PASS_THRESHOLD,
    coverage_check,
    grounding_check,
    has_section_headers,
    no_judgments,
    not_toxic,
    section_length,
    tone,
)

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(name)s - %(message)s")
logger = structlog.get_logger(__name__)


# Default conversation messages
DEFAULT_CONVERSATION = [
    {
        "role": "assistant",
        "content": "Hi, I'm here to help gather some information from you. Let's start with your background. Can you tell me about your education and employment history?",
    },
    {
        "role": "user",
        "content": "I finished high school and worked at a factory for 5 years before my conviction.",
    },
    {
        "role": "assistant",
        "content": "Thank you for sharing that. Can you tell me about your housing situation and family support?",
    },
    {
        "role": "user",
        "content": "I'm staying with my mom right now. My wife and I are separated, and I have two kids I want to reconnect with.",
    },
    {
        "role": "assistant",
        "content": "I understand. Let's talk about any substance use or other challenges you might be facing.",
    },
    {
        "role": "user",
        "content": "I used to drink heavily, which contributed to my problems. I've been sober for 6 months now and want to stay that way.",
    },
]


@dataclass
class EvalItem:
    conversation_messages: list[dict]
    summary: str
    meta: dict  # {plan_id, intake_id, client_pseudo_id, config}
    system_prompt: Optional[str] = None  # system prompt used by the summary LLM


def format_conversation_from_messages(messages: List[Dict[str, Any]]) -> str:
    """
    Format conversation messages into a readable string.

    Args:
        messages: List of message dictionaries with 'role' and 'content' keys

    Returns:
        A formatted string with the conversation
    """
    formatted_output = ""

    for message in messages:
        role = message.get("role", "unknown")
        content = message.get("content", "")

        # Map role to display name (handles both intake-API names and DB-stored names)
        if role in ("assistant", "case manager"):
            display_role = "Caseworker"
        elif role in ("user", "client"):
            display_role = "Client"
        else:
            display_role = role.capitalize()

        formatted_output += f"{display_role}: {content}\n\n"

    return formatted_output


def _print_intake_conversation(
    messages: List[Dict[str, Any]], max_messages: Optional[int] = None
) -> None:
    """Print intake conversation with consistent role labels."""
    print("\n" + "=" * 60)
    print("🗨️  INTAKE CONVERSATION")
    print("=" * 60)
    display = messages if max_messages is None else messages[:max_messages]
    for msg in display:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        if role in ("assistant", "case manager"):
            display_role = "Caseworker"
        elif role in ("user", "client"):
            display_role = "Client"
        else:
            display_role = role.capitalize()
        print(f"{display_role}: {content}")
    if max_messages and len(messages) > max_messages:
        print(f"  ... ({len(messages) - max_messages} more messages)")


def _print_summary_text(summary: str) -> None:
    """Print a summary with a standard header."""
    print("\n" + "=" * 60)
    print("📄 CLIENT SUMMARY")
    print("=" * 60)
    print(summary)


async def _evaluate_assets(
    summary: str,
    conversation_messages: List[Dict[str, Any]],
    meta: Dict,
    system_prompt: Optional[str] = None,
) -> Dict:
    """Run grounding and coverage evaluations and return the result dict.

    Callers are responsible for printing the intake and summary before calling this.
    """
    logger.info("Running evaluations")
    formatted = format_conversation_from_messages(conversation_messages)
    eval_results = await _run_evaluations(
        summary, formatted, system_prompt=system_prompt
    )
    return {**meta, **eval_results}


async def _run_pipeline(
    items: List[EvalItem],
    output_format: str,
    max_messages: Optional[int] = None,
    report_file: Optional[str] = None,
) -> None:
    """Evaluate each item, then output all results."""
    results = []
    for item in items:
        if output_format == "console":
            _print_intake_conversation(item.conversation_messages, max_messages)
            _print_summary_text(item.summary)
        result = await _evaluate_assets(
            item.summary, item.conversation_messages, item.meta, item.system_prompt
        )
        results.append(result)
    _output_results(results, output_format, items=items, report_file=report_file)


@cli.command()
async def evaluate_summary(
    mode: str,
    output_config_name: Optional[str] = None,
    conversation_file: Optional[str] = None,
    summary_file: Optional[str] = None,
    intake_id: Optional[str] = None,
    plan_id: Optional[str] = None,
    client_pseudo_id: Optional[str] = None,
    since_date: Optional[str] = None,
    limit: int = 10,
    output: str = "console",
    env: str = "prod",
    max_messages: Optional[int] = None,
    report_file: Optional[str] = None,
):
    """
    Evaluate summary generation with fake data or real data from database.

    FAKE DATA MODE:
        python -m app.manage evaluate-summary fake --output-config-name summary-default-v0.yaml

    TEST MODE (evaluate pre-written summary):
        python -m app.manage evaluate-summary test --summary-file summary.json

    DATABASE MODE (reads RECIDIVIZ_POSTGRES_PASSWORD_<ENV> from .env):
        python -m app.manage evaluate-summary db --plan-id <uuid>
        python -m app.manage evaluate-summary db --intake-id <uuid>
        python -m app.manage evaluate-summary db --client-pseudo-id <id> --limit 5
        python -m app.manage evaluate-summary db --client-pseudo-id <id> --env staging
        python -m app.manage evaluate-summary db --since-date 2025-01-01 --output json
        python -m app.manage evaluate-summary db --since-date 2025-01-01 --output report
        python -m app.manage evaluate-summary db --since-date 2025-01-01 --output report --report-file my_report.md
        python -m app.manage evaluate-summary db --since-date 2025-01-01 --output html
        python -m app.manage evaluate-summary db --since-date 2025-01-01 --output html --report-file my_report.html

    Args:
        mode: Evaluation mode: db, test, or fake
        output_config_name: Name of the output config YAML file (required for fake mode)
        conversation_file: Optional path to JSON file with conversation messages
        summary_file: Path to JSON file with pre-written summary (required for test mode)
        intake_id: UUID of intake to evaluate from database
        plan_id: UUID of plan to evaluate from database
        client_pseudo_id: Filter by client pseudo ID (database mode)
        since_date: Filter by creation date YYYY-MM-DD (database mode)
        limit: Maximum number of intakes/plans to evaluate (default: 10)
        output: Output format: console (default), json, csv, report, html
        env: Database environment: prod (default), staging, demo, dev, local
        max_messages: Truncate conversation display to this many messages (default: show all)
        report_file: Path for report output file (only used with --output report/html,
            defaults to eval_report_YYYY-MM-DD_HHMMSS.md/.html in current directory)
    """
    logger.info("Starting summary evaluation")

    try:
        if mode == "db":
            logger.info("Running in DATABASE mode")
            logger.info(f"Connecting to '{env}' database")
            items = await _collect_database(
                intake_id=intake_id,
                plan_id=plan_id,
                client_pseudo_id=client_pseudo_id,
                since_date=since_date,
                limit=limit,
                env=env,
            )
        elif mode == "test":
            logger.info("Running in TEST mode (pre-written summary)")
            items = await _collect_test_summary(
                conversation_file=conversation_file,
                summary_file=summary_file,
            )
        elif mode == "fake":
            if not output_config_name:
                logger.error(
                    "--output-config-name is required for fake mode",
                    usage="evaluate-summary fake --output-config-name <name>",
                )
                return

            logger.info("Running in FAKE DATA mode")
            logger.info(f"Output config: {output_config_name}")
            items = await _collect_fake_data(
                output_config_name=output_config_name,
                conversation_file=conversation_file,
            )
        else:
            logger.error("Unknown mode", mode=mode, valid_modes=["db", "test", "fake"])
            return

        await _run_pipeline(items, output, max_messages, report_file=report_file)

    except FileNotFoundError as e:
        logger.error("File not found", error=str(e))
        if mode == "fake":
            logger.info(
                "Tip: Config YAML files are now managed via the Config Management UI. "
                "Export a config from the UI at /config, then provide the exported file name."
            )
    except json.JSONDecodeError as e:
        logger.error("Invalid JSON in input file", error=str(e))
    except ValueError as e:
        logger.error("Invalid input", error=str(e))
    except Exception as e:
        logger.error("Error during evaluation", error=str(e))
        raise


async def _collect_fake_data(
    output_config_name: str,
    conversation_file: Optional[str],
) -> List[EvalItem]:
    """Collect eval items using fake conversation data (original functionality)."""
    if conversation_file:
        conversation_path = Path(conversation_file)
        with open(conversation_path, "r") as f:
            conversation_messages = json.load(f)
        logger.info(
            f"Loaded {len(conversation_messages)} conversation messages from file"
        )
    else:
        conversation_messages = DEFAULT_CONVERSATION
        logger.info(
            f"Using default conversation with {len(conversation_messages)} messages"
        )

    yaml_content = OutputFileLoader.read_file_content(output_config_name)
    output_config = OutputFileLoader.validate_yaml_content(yaml_content)
    logger.info(
        f"Loaded output config: {output_config.metadata.code} v{output_config.metadata.version}"
    )

    formatted_conversation = format_conversation_from_messages(conversation_messages)

    logger.info("Generating summary")
    summary = await generate_summary(formatted_conversation, output_config)

    return [
        EvalItem(
            conversation_messages=conversation_messages,
            summary=summary,
            meta={
                "intake_id": None,
                "plan_id": None,
                "client_pseudo_id": "fake-client",
                "config": output_config_name,
            },
            system_prompt=output_config.prompts.system,
        )
    ]


async def _collect_test_summary(
    conversation_file: Optional[str],
    summary_file: str,
) -> List[EvalItem]:
    """Collect eval items from pre-written summary and conversation files."""
    summary_path = Path(summary_file)
    with open(summary_path, "r") as f:
        summary_data = json.load(f)

    summary = summary_data.get("expected_summary") or summary_data.get("summary")
    if not summary:
        raise ValueError(
            f"No 'expected_summary' or 'summary' field found in {summary_file}"
        )

    if conversation_file:
        conversation_path = Path(conversation_file)
        with open(conversation_path, "r") as f:
            conversation_data = json.load(f)
        conversation_messages = (
            conversation_data.get("conversation") or conversation_data
        )
        logger.info(
            f"Loaded {len(conversation_messages)} conversation messages from file"
        )
    else:
        conversation_messages = summary_data.get("conversation")
        if not conversation_messages:
            raise ValueError(
                "No conversation provided (use --conversation-file or include 'conversation' in summary file)"
            )
        logger.info(
            f"Using conversation from summary file ({len(conversation_messages)} messages)"
        )

    logger.info("Loaded test scenario")

    return [
        EvalItem(
            conversation_messages=conversation_messages,
            summary=summary,
            meta={
                "intake_id": None,
                "plan_id": None,
                "client_pseudo_id": "test",
                "config": "test-scenario",
            },
        )
    ]


async def _collect_database(
    intake_id: Optional[str],
    plan_id: Optional[str],
    client_pseudo_id: Optional[str],
    since_date: Optional[str],
    limit: int,
    env: str = "prod",
) -> List[EvalItem]:
    """Collect eval items from the database."""
    connector = None
    try:
        engine, connector = await get_postgres_engine(env)
        async_session_factory = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        async with async_session_factory() as session:
            # Plan.intake has lazy="selectin" which auto-fires a SELECT for
            # every Plan loaded — that query includes columns not yet in prod
            # (e.g. external_chat_messages). Suppress it with noload().
            # Same for create_execution which also uses selectin.
            from sqlalchemy.orm import noload
            from sqlmodel import select

            from app.models.models import Plan

            NO_LAZY = [noload(Plan.intake), noload(Plan.create_execution)]

            intake_row = None

            if plan_id:
                result = await session.execute(
                    select(Plan).where(Plan.id == UUID(plan_id)).options(*NO_LAZY)
                )
                plan = result.scalar_one_or_none()
                if not plan:
                    logger.error("Plan not found", plan_id=plan_id)
                    return []
                plans = [plan]
            elif intake_id:
                row = await session.execute(
                    sa.text(
                        "SELECT id, intake_type, assessment_config_id, client_pseudo_id"
                        " FROM intake WHERE id = :id"
                    ),
                    {"id": UUID(intake_id)},
                )
                intake_row = row.fetchone()
                if not intake_row:
                    logger.error("Intake not found", intake_id=intake_id)
                    return []

                result = await session.execute(
                    select(Plan)
                    .where(Plan.intake_id == UUID(intake_id))
                    .options(*NO_LAZY)
                )
                plan = result.scalar_one_or_none()
                plans = [plan] if plan else []
                if not plans:
                    logger.warning(
                        "No plan found for intake, will generate summary",
                        intake_id=intake_id,
                    )
                    plans = [None]  # Sentinel to trigger summary generation
            else:
                query = select(Plan).options(*NO_LAZY)

                if client_pseudo_id:
                    query = query.where(Plan.client_pseudo_id == client_pseudo_id)

                if since_date:
                    since_dt = datetime.fromisoformat(since_date)
                    query = query.where(Plan.created_at >= since_dt)

                query = query.limit(limit)

                result = await session.execute(query)
                plans = list(result.scalars().all())

            if not plans:
                logger.info("No plans found matching filters")
                return []

            logger.info(f"Found {len(plans)} plan(s) to evaluate")

            items = []
            for idx, plan in enumerate(plans, 1):
                if plan is None:
                    item = await _collect_item_from_intake(
                        session, intake_row, idx, len(plans)
                    )
                else:
                    item = await _collect_item_from_plan(session, plan, idx, len(plans))

                if item:
                    items.append(item)

            logger.info("Database collection completed successfully")
            return items

    finally:
        if connector:
            await connector.close_async()


async def _collect_item_from_plan(
    session, plan, idx: int, total: int
) -> Optional[EvalItem]:
    """Load a single plan's summary and messages into an EvalItem."""
    logger.info(f"[{idx}/{total}] Evaluating plan", plan_id=str(plan.id))

    summary_asset = await get_asset_by_filename(session, plan.id, "summary.md")
    if not summary_asset or not summary_asset.file_blob:
        logger.warning("Skipping plan: no summary found", plan_id=str(plan.id))
        return None

    summary = summary_asset.file_blob.decode("utf-8")

    messages_asset = await get_asset_by_filename(session, plan.id, "messages.json")
    if not messages_asset or not messages_asset.file_blob:
        logger.warning("Skipping plan: no messages found", plan_id=str(plan.id))
        return None

    messages_json = json.loads(messages_asset.file_blob.decode("utf-8"))

    system_prompt = None
    if plan.intake_id:
        row = await session.execute(
            sa.text("SELECT assessment_config_id FROM intake WHERE id = :id"),
            {"id": plan.intake_id},
        )
        assessment_config_id = row.scalar_one_or_none()
        if assessment_config_id:
            summary_config = await ConfigLoader.load_summary_config(
                assessment_config_id, session
            )
            if summary_config:
                system_prompt = summary_config.prompts.system

    return EvalItem(
        conversation_messages=messages_json,
        summary=summary,
        meta={
            "plan_id": str(plan.id),
            "intake_id": str(plan.intake_id) if plan.intake_id else None,
            "client_pseudo_id": plan.client_pseudo_id,
            "config": "existing",
        },
        system_prompt=system_prompt,
    )


async def _collect_item_from_intake(
    session, intake_row, idx: int, total: int
) -> Optional[EvalItem]:
    """Generate a summary for a single intake and return an EvalItem.

    intake_row is a SQLAlchemy Row from a targeted column query — not a full ORM
    object — so we use _mapping to access fields by name.
    """
    row = intake_row._mapping
    intake_id = row["id"]
    intake_type = row["intake_type"]
    assessment_config_id = row["assessment_config_id"]
    client_pseudo_id = row["client_pseudo_id"]

    logger.info(f"[{idx}/{total}] Evaluating intake", intake_id=str(intake_id))

    if intake_type == IntakeType.CONVERSATION.value:
        intake_messages = await get_intake_messages(session, intake_id=intake_id)
        conversation_messages = [
            {
                "role": "client" if msg.from_role == "client" else "assistant",
                "content": msg.content,
            }
            for msg in intake_messages
        ]
    else:
        logger.warning(
            "Skipping intake: unsupported type",
            intake_type=intake_type,
            intake_id=str(intake_id),
        )
        return None

    summary_config = await ConfigLoader.load_summary_config(
        assessment_config_id, session
    )
    formatted_messages = format_conversation_from_messages(conversation_messages)
    summary = await generate_summary(
        formatted_messages,
        summary_config,
        client_pseudo_id=client_pseudo_id,
    )

    return EvalItem(
        conversation_messages=conversation_messages,
        summary=summary,
        meta={
            "plan_id": None,
            "intake_id": str(intake_id),
            "client_pseudo_id": client_pseudo_id,
            "config": summary_config.metadata.code if summary_config else "unknown",
        },
        system_prompt=summary_config.prompts.system if summary_config else None,
    )


async def _run_evaluations(
    summary: str, intake_messages: str, system_prompt: Optional[str] = None
) -> Dict:
    """Run all evaluations on a summary."""
    from uuid import uuid4

    run = Run(
        id=uuid4(),
        name="eval_run",
        start_time=datetime.now(),
        run_type="chain",
        outputs={"summary": summary},
    )
    example = Example(
        id=uuid4(),
        created_at=datetime.now(),
        inputs={
            "intake_messages": intake_messages,
            "system_prompt": system_prompt or "",
        },
        outputs={},
    )

    (
        grounding_result,
        coverage_result,
        toxic_result,
        tone_result,
        judgments_result,
    ) = await asyncio.gather(
        grounding_check(run, example),
        coverage_check(run, example),
        not_toxic(run, example),
        tone(run, example),
        no_judgments(run, example),
    )
    headers_result = has_section_headers(run, example)
    length_result = section_length(run, example)

    return {
        "grounding": grounding_result,
        "coverage": coverage_result,
        "has_section_headers": headers_result,
        "section_length": length_result,
        "not_toxic": toxic_result,
        "tone": tone_result,
        "no_judgments": judgments_result,
    }


def _output_results(
    results: List[Dict],
    output_format: str,
    items: Optional[List[EvalItem]] = None,
    report_file: Optional[str] = None,
):
    """Output evaluation results in the specified format."""
    if output_format == "json":
        print(json.dumps(results, indent=2))
    elif output_format == "csv":
        if not results:
            logger.info("No results to output")
            return

        # Flatten results for CSV
        csv_rows = []
        for result in results:
            base = {
                "plan_id": result.get("plan_id", ""),
                "intake_id": result.get("intake_id", ""),
                "client_pseudo_id": result.get("client_pseudo_id", ""),
                "config": result.get("config", ""),
            }
            # Add grounding row
            if "grounding" in result:
                grounding = result["grounding"]
                csv_rows.append(
                    {
                        **base,
                        "eval_type": "grounding",
                        "passed": grounding["score"] == 1,
                        "score": grounding["score"],
                        "correct_count": len(grounding.get("correct_facts", [])),
                        "interpretive_count": len(
                            grounding.get("interpretive_additions", [])
                        ),
                        "hallucinated_count": len(
                            grounding.get("hallucinated_facts", [])
                        ),
                        "explanation": grounding.get("explanation", ""),
                        "correct_facts": json.dumps(grounding.get("correct_facts", [])),
                        "interpretive_additions": json.dumps(
                            grounding.get("interpretive_additions", [])
                        ),
                        "hallucinated_facts": json.dumps(
                            grounding.get("hallucinated_facts", [])
                        ),
                        "missing_details": "",
                        "missing_count": "",
                    }
                )
            # Add coverage row
            if "coverage" in result:
                coverage = result["coverage"]
                csv_rows.append(
                    {
                        **base,
                        "eval_type": "coverage",
                        "passed": coverage["score"] >= COVERAGE_PASS_THRESHOLD,
                        "score": coverage["score"],
                        "correct_count": "",
                        "interpretive_count": "",
                        "hallucinated_count": "",
                        "explanation": coverage.get("explanation", ""),
                        "correct_facts": "",
                        "interpretive_additions": "",
                        "hallucinated_facts": "",
                        "missing_details": json.dumps(
                            coverage.get("missing_details", [])
                        ),
                        "missing_count": len(coverage.get("missing_details", [])),
                    }
                )

        output = StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "plan_id",
                "intake_id",
                "client_pseudo_id",
                "config",
                "eval_type",
                "passed",
                "score",
                "correct_count",
                "interpretive_count",
                "hallucinated_count",
                "missing_count",
                "explanation",
                "correct_facts",
                "interpretive_additions",
                "hallucinated_facts",
                "missing_details",
            ],
        )
        writer.writeheader()
        writer.writerows(csv_rows)
        print(output.getvalue())
    elif output_format == "report":
        _write_report(results, items or [], report_file)
    elif output_format == "html":
        _write_html_report(results, items or [], report_file)
    else:
        # Console format (default)
        print("\n" + "=" * 60)
        print("🔍 EVALUATION RESULTS")
        print("=" * 60)

        total_checks = 0
        passed_checks = 0

        for result in results:
            if result.get("plan_id"):
                print(f"\n📋 Plan: {result['plan_id']}")
            elif result.get("intake_id"):
                print(f"\n📋 Intake: {result['intake_id']}")

            if result.get("client_pseudo_id"):
                print(f"   Client: {result['client_pseudo_id']}")
            if result.get("config"):
                print(f"   Config: {result['config']}")

            # Grounding check
            if "grounding" in result:
                grounding = result["grounding"]
                total_checks += 1
                passed = grounding["score"] == 1
                if passed:
                    passed_checks += 1
                status = "✓ PASS" if passed else "✗ FAIL"

                # Count facts
                correct_count = len(grounding.get("correct_facts", []))
                interpretive_count = len(grounding.get("interpretive_additions", []))
                hallucinated_count = len(grounding.get("hallucinated_facts", []))
                total_facts = correct_count + interpretive_count + hallucinated_count

                print(f"\n   {status}  Grounding Check ({grounding['score']}/1)")
                if total_facts > 0:
                    print(
                        f"   Summary: {correct_count}/{total_facts} correct, {interpretive_count}/{total_facts} interpretive, {hallucinated_count}/{total_facts} hallucinated"
                    )

                # Show correct facts
                if grounding.get("correct_facts"):
                    print(f"\n   ✓ Correct Facts ({correct_count}):")
                    for item in grounding["correct_facts"]:
                        print(f"      • {item['fact']}")
                        print(f"        ({item['explanation']})")

                # Show interpretive additions
                if grounding.get("interpretive_additions"):
                    print(f"\n   ⚡ Interpretive Additions ({interpretive_count}):")
                    for item in grounding["interpretive_additions"]:
                        print(f"      • {item['fact']}")
                        print(f"        ({item['explanation']})")

                # Show hallucinations
                if grounding.get("hallucinated_facts"):
                    print(f"\n   ✗ Hallucinated Facts ({hallucinated_count}):")
                    for item in grounding["hallucinated_facts"]:
                        print(f"      • {item['fact']}")
                        print(f"        ({item['explanation']})")

                print(f"\n   Explanation: {grounding.get('explanation', '')}")

            # Coverage check
            if "coverage" in result:
                coverage = result["coverage"]
                total_checks += 1
                passed = coverage["score"] >= COVERAGE_PASS_THRESHOLD
                if passed:
                    passed_checks += 1
                status = "✓ PASS" if passed else "✗ FAIL"

                missing_count = len(coverage.get("missing_details", []))

                print(f"\n   {status}  Coverage Check ({coverage['score']}/10)")
                if missing_count > 0:
                    print(f"   Summary: {missing_count} important details missing")

                # Show missing details
                if coverage.get("missing_details"):
                    print(f"\n   ✗ Missing Details ({missing_count}):")
                    for detail in coverage["missing_details"]:
                        print(f"      • {detail}")

                print(f"\n   Explanation: {coverage.get('explanation', '')}")

            # has_section_headers
            if "has_section_headers" in result:
                h = result["has_section_headers"]
                print(
                    f"\n   Has Section Headers (score {h['score']}/10, {h['header_count']} headers)"
                )
                print(f"   Explanation: {h.get('explanation', '')}")

            # section_length
            if "section_length" in result:
                sl = result["section_length"]
                flagged_count = len(sl.get("flagged_sections", []))
                print(
                    f"\n   Section Length (score {sl['score']}/10, {flagged_count} flagged)"
                )
                if sl.get("flagged_sections"):
                    for entry in sl["flagged_sections"]:
                        print(
                            f"      • {entry['header'] or '(no header)'}: {entry['word_count']} words — {entry['reason']}"
                        )
                print(f"   Explanation: {sl.get('explanation', '')}")

            # not_toxic
            if "not_toxic" in result:
                nt = result["not_toxic"]
                total_checks += 1
                passed = nt["score"] == 1
                if passed:
                    passed_checks += 1
                status = "✓ PASS" if passed else "✗ FAIL"
                print(f"\n   {status}  Not Toxic ({nt['score']}/1)")
                print(f"   Explanation: {nt.get('explanation', '')}")

            # tone
            if "tone" in result:
                t = result["tone"]
                print(f"\n   Tone (score {t['score']}/10)")
                print(f"   Explanation: {t.get('explanation', '')}")

            # no_judgments
            if "no_judgments" in result:
                nj = result["no_judgments"]
                print(f"\n   No Judgments (score {nj['score']}/10)")
                print(f"   Explanation: {nj.get('explanation', '')}")

        print("\n" + "=" * 60)
        print(f"Overall: {passed_checks}/{total_checks} checks passed")
        print("=" * 60)


def _write_report(
    results: List[Dict],
    items: List[EvalItem],
    report_file: Optional[str] = None,
) -> None:
    """Write a human-readable markdown report of evaluation results."""
    if not report_file:
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        report_file = f"eval_report_{timestamp}.md"

    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines: List[str] = [f"# Eval Report — {timestamp_str}", ""]

    for result, item in zip(results, items):
        plan_id = result.get("plan_id")
        intake_id = result.get("intake_id")
        client_pseudo_id = result.get("client_pseudo_id", "")

        id_str = f"Plan: {plan_id}" if plan_id else f"Intake: {intake_id}"
        lines += ["---", "", f"## {id_str} | Client: {client_pseudo_id}", ""]

        # Intake conversation
        lines += ["### Intake Conversation", ""]
        for msg in item.conversation_messages:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            if role in ("assistant", "case manager"):
                display_role = "**Caseworker**"
            elif role in ("user", "client"):
                display_role = "**Client**"
            else:
                display_role = f"**{role.capitalize()}**"
            lines += [f"{display_role}: {content}", ""]

        # Summary
        lines += ["### Summary", "", item.summary, ""]

        # Evaluation results
        lines += ["### Evaluation Results", ""]

        if "grounding" in result:
            grounding = result["grounding"]
            passed = grounding["score"] == 1
            status = "✓ PASS" if passed else "✗ FAIL"
            lines += [f"#### Grounding: {status} ({grounding['score']}/1)", ""]
            lines += [f"**Explanation:** {grounding.get('explanation', '')}", ""]

            correct_facts = grounding.get("correct_facts", [])
            if correct_facts:
                lines.append(f"**Correct Facts ({len(correct_facts)}):**")
                for fact in correct_facts:
                    lines.append(f"- {fact['fact']} _({fact['explanation']})_")
                lines.append("")

            interpretive = grounding.get("interpretive_additions", [])
            if interpretive:
                lines.append(f"**Interpretive Additions ({len(interpretive)}):**")
                for fact in interpretive:
                    lines.append(f"- {fact['fact']} _({fact['explanation']})_")
                lines.append("")

            hallucinated = grounding.get("hallucinated_facts", [])
            if hallucinated:
                lines.append(f"**Hallucinated Facts ({len(hallucinated)}):**")
                for fact in hallucinated:
                    lines.append(f"- {fact['fact']} _({fact['explanation']})_")
                lines.append("")

        if "coverage" in result:
            coverage = result["coverage"]
            passed = coverage["score"] >= COVERAGE_PASS_THRESHOLD
            status = "✓ PASS" if passed else "✗ FAIL"
            lines += [f"#### Coverage: {status} ({coverage['score']}/10)", ""]
            lines += [f"**Explanation:** {coverage.get('explanation', '')}", ""]

            missing = coverage.get("missing_details", [])
            if missing:
                lines.append(f"**Missing Details ({len(missing)}):**")
                for detail in missing:
                    lines.append(f"- {detail}")
                lines.append("")

    Path(report_file).write_text("\n".join(lines))
    logger.info("Report written", path=report_file)


def _write_html_report(
    results: List[Dict],
    items: List[EvalItem],
    report_file: Optional[str] = None,
) -> None:
    """Write a self-contained interactive HTML report of evaluation results."""
    if not report_file:
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        report_file = f"eval_report_{timestamp}.html"

    entries = []
    for result, item in zip(results, items):
        entries.append(
            {
                "plan_id": result.get("plan_id"),
                "intake_id": result.get("intake_id"),
                "client_pseudo_id": result.get("client_pseudo_id", ""),
                "config": result.get("config", ""),
                "conversation_messages": item.conversation_messages,
                "summary": item.summary,
                "grounding": result.get("grounding", {}),
                "coverage": result.get("coverage", {}),
                "has_section_headers": result.get("has_section_headers", {}),
                "section_length": result.get("section_length", {}),
                "not_toxic": result.get("not_toxic", {}),
                "tone": result.get("tone", {}),
                "no_judgments": result.get("no_judgments", {}),
            }
        )

    write_html_report(_HTML_TEMPLATE, entries, report_file)


_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Eval Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }

    /* ── Main view ── */
    #main-view { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
    h1 { font-size: 24px; font-weight: 600; margin-bottom: 6px; }
    .subtitle { color: #888; font-size: 13px; margin-bottom: 28px; }

    .stats-bar { display: flex; gap: 12px; margin-bottom: 28px; }
    .stat-card { background: white; border-radius: 8px; padding: 16px 20px; flex: 1;
                 box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .stat-label { font-size: 11px; color: #888; text-transform: uppercase;
                  letter-spacing: 0.6px; margin-bottom: 6px; }
    .stat-value { font-size: 26px; font-weight: 700; }

    table { width: 100%; background: white; border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-collapse: collapse; }
    th { text-align: left; padding: 11px 16px; font-size: 11px; text-transform: uppercase;
         letter-spacing: 0.5px; color: #888; border-bottom: 1px solid #eee; }
    td { padding: 13px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    tr:last-child td { border-bottom: none; }
    tr.intake-row:hover { background: #fafafa; cursor: pointer; }

    /* ── Detail view ── */
    #detail-view { display: none; height: 100vh; flex-direction: column; }
    .detail-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px;
                     background: white; border-bottom: 1px solid #e5e5e5; flex-shrink: 0; }
    .back-btn { background: none; border: 1px solid #ddd; border-radius: 6px;
                padding: 5px 12px; cursor: pointer; font-size: 13px; color: #555; }
    .back-btn:hover { background: #f5f5f5; }
    .detail-title { font-weight: 600; font-size: 14px; flex: 1;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nav-btn { background: none; border: 1px solid #ddd; border-radius: 6px;
               padding: 5px 11px; cursor: pointer; font-size: 13px; color: #555; }
    .nav-btn:hover:not(:disabled) { background: #f5f5f5; }
    .nav-btn:disabled { opacity: 0.35; cursor: default; }
    .nav-info { font-size: 12px; color: #aaa; white-space: nowrap; }

    .panes { display: flex; flex: 1; overflow: hidden; }
    .pane { flex: 1; display: flex; flex-direction: column; border-right: 1px solid #e5e5e5; min-width: 0; }
    .pane:last-child { border-right: none; }
    .pane-header { padding: 10px 14px; font-size: 11px; font-weight: 600;
                   text-transform: uppercase; letter-spacing: 0.5px; color: #777;
                   background: #fafafa; border-bottom: 1px solid #eee; flex-shrink: 0; }
    .pane-body { flex: 1; overflow-y: auto; padding: 14px; }

    /* ── Transcript ── */
    .message { margin-bottom: 10px; }
    .message-role { font-size: 10px; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.5px; margin-bottom: 3px; }
    .message-role.caseworker { color: #2563eb; }
    .message-role.client { color: #7c3aed; }
    .message-content { font-size: 13px; line-height: 1.55; background: white;
                       padding: 9px 12px; border-radius: 6px; border: 1px solid #eee; }
    .message.caseworker .message-content { border-left: 3px solid #2563eb; }
    .message.client .message-content { border-left: 3px solid #7c3aed; }

    /* ── Summary ── */
    .summary-text { font-size: 13px; line-height: 1.7; white-space: pre-wrap; }

    /* ── Eval results ── */
    .eval-section { margin-bottom: 18px; }
    .eval-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .eval-title { font-weight: 600; font-size: 14px; }
    .eval-explanation { font-size: 12px; color: #555; line-height: 1.5; margin-bottom: 10px;
                        padding: 9px 11px; background: #f9f9f9; border-radius: 6px; }
    .fact-group { margin-bottom: 10px; }
    .fact-group-title { font-size: 11px; font-weight: 700; text-transform: uppercase;
                        letter-spacing: 0.5px; color: #777; margin-bottom: 5px; }
    .fact-item { font-size: 12px; padding: 7px 10px; border-radius: 5px;
                 margin-bottom: 4px; line-height: 1.4; }
    .fact-text { margin-bottom: 2px; }
    .fact-expl { font-size: 11px; color: #777; font-style: italic; }
    .fact-item.correct { background: #f0fdf4; border-left: 3px solid #16a34a; }
    .fact-item.interpretive { background: #fffbeb; border-left: 3px solid #d97706; }
    .fact-item.hallucinated { background: #fef2f2; border-left: 3px solid #dc2626; }
    .missing-item { font-size: 12px; padding: 6px 10px; background: #fef2f2;
                    border-left: 3px solid #dc2626; border-radius: 5px; margin-bottom: 4px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 16px 0; }

    /* ── Shared badges / scores ── */
    .badge { display: inline-block; padding: 2px 9px; border-radius: 10px;
             font-size: 11px; font-weight: 700; }
    .badge.pass { background: #dcfce7; color: #16a34a; }
    .badge.fail { background: #fee2e2; color: #dc2626; }
    .score.pass { color: #16a34a; font-weight: 600; }
    .score.warn { color: #d97706; font-weight: 600; }
    .score.fail { color: #dc2626; font-weight: 600; }
    .stat-value.pass { color: #16a34a; }
    .stat-value.warn { color: #d97706; }
    .stat-value.fail { color: #dc2626; }
  </style>
</head>
<body>

<div id="main-view">
  <h1>Eval Report</h1>
  <div class="subtitle" id="report-subtitle"></div>
  <div class="stats-bar" id="stats-bar"></div>
  <table>
    <thead>
      <tr>
        <th>Client</th>
        <th>Plan / Intake ID</th>
        <th>Grounding</th>
        <th>Coverage</th>
        <th>Headers</th>
        <th>Sec Len</th>
        <th>Not Toxic</th>
        <th>Tone</th>
        <th>No Judg</th>
        <th>Config</th>
      </tr>
    </thead>
    <tbody id="intake-table"></tbody>
  </table>
</div>

<div id="detail-view">
  <div class="detail-header">
    <button class="back-btn" onclick="showMain()">← Back</button>
    <div class="detail-title" id="detail-title"></div>
    <span class="nav-info" id="nav-info"></span>
    <button class="nav-btn" id="prev-btn" onclick="navigate(-1)">← Prev</button>
    <button class="nav-btn" id="next-btn" onclick="navigate(1)">Next →</button>
  </div>
  <div class="panes">
    <div class="pane">
      <div class="pane-header">Transcript</div>
      <div class="pane-body" id="pane-transcript"></div>
    </div>
    <div class="pane">
      <div class="pane-header">Summary</div>
      <div class="pane-body" id="pane-summary"></div>
    </div>
    <div class="pane">
      <div class="pane-header">Eval Results</div>
      <div class="pane-body" id="pane-eval"></div>
    </div>
  </div>
</div>

<script>
  const DATA = __DATA__;
  const COVERAGE_PASS = 7;
  let currentIndex = 0;

  function scoreClass(val, max) {
    const r = val / max;
    return r >= 0.8 ? 'pass' : r >= 0.5 ? 'warn' : 'fail';
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function init() {
    const n = DATA.length;
    const gPassed = DATA.filter(d => d.grounding?.score === 1).length;
    const cScores = DATA.map(d => d.coverage?.score ?? 0);
    const cPassed = DATA.filter(d => (d.coverage?.score ?? 0) >= COVERAGE_PASS).length;
    const avgC = cScores.length ? (cScores.reduce((a, b) => a + b, 0) / cScores.length).toFixed(1) : '—';
    const ntPassed = DATA.filter(d => d.not_toxic?.score === 1).length;
    const avgTone = (() => { const s = DATA.filter(d => d.tone?.score != null).map(d => d.tone.score); return s.length ? (s.reduce((a,b)=>a+b,0)/s.length).toFixed(1) : '—'; })();
    const avgNJ = (() => { const s = DATA.filter(d => d.no_judgments?.score != null).map(d => d.no_judgments.score); return s.length ? (s.reduce((a,b)=>a+b,0)/s.length).toFixed(1) : '—'; })();

    document.getElementById('report-subtitle').textContent =
      `${n} intake${n !== 1 ? 's' : ''} evaluated`;

    document.getElementById('stats-bar').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Intakes Evaluated</div>
        <div class="stat-value">${n}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Grounding Passed</div>
        <div class="stat-value ${scoreClass(gPassed, n)}">${gPassed}/${n}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Coverage Passed</div>
        <div class="stat-value ${scoreClass(cPassed, n)}">${cPassed}/${n}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Coverage Score</div>
        <div class="stat-value ${scoreClass(parseFloat(avgC) || 0, 10)}">${avgC}<span style="font-size:15px;color:#bbb">/10</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Not Toxic Passed</div>
        <div class="stat-value ${scoreClass(ntPassed, n)}">${ntPassed}/${n}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Tone</div>
        <div class="stat-value ${scoreClass(parseFloat(avgTone) || 0, 10)}">${avgTone}<span style="font-size:15px;color:#bbb">/10</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg No Judgments</div>
        <div class="stat-value ${scoreClass(parseFloat(avgNJ) || 0, 10)}">${avgNJ}<span style="font-size:15px;color:#bbb">/10</span></div>
      </div>`;

    document.getElementById('intake-table').innerHTML = DATA.map((d, i) => {
      const gOk = d.grounding?.score === 1;
      const cScore = d.coverage?.score ?? 0;
      const cOk = cScore >= COVERAGE_PASS;
      const hScore = d.has_section_headers?.score ?? 0;
      const slScore = d.section_length?.score ?? 0;
      const ntOk = d.not_toxic?.score === 1;
      const tScore = d.tone?.score ?? 0;
      const njScore = d.no_judgments?.score ?? 0;
      const id = d.plan_id || d.intake_id || '—';
      const shortId = id.length > 12 ? id.slice(0, 12) + '…' : id;
      return `<tr class="intake-row" onclick="showDetail(${i})">
        <td>${esc(d.client_pseudo_id) || '—'}</td>
        <td title="${esc(id)}" style="font-family:monospace;font-size:12px;color:#888">${esc(shortId)}</td>
        <td><span class="badge ${gOk ? 'pass' : 'fail'}">${gOk ? '✓' : '✗'}</span></td>
        <td><span class="score ${cOk ? 'pass' : scoreClass(cScore, 10)}">${cScore}/10</span></td>
        <td><span class="score ${scoreClass(hScore, 10)}">${hScore}/10</span></td>
        <td><span class="score ${scoreClass(slScore, 10)}">${slScore}/10</span></td>
        <td><span class="badge ${ntOk ? 'pass' : 'fail'}">${ntOk ? '✓' : '✗'}</span></td>
        <td><span class="score ${scoreClass(tScore, 10)}">${tScore}/10</span></td>
        <td><span class="score ${scoreClass(njScore, 10)}">${njScore}/10</span></td>
        <td style="color:#aaa;font-size:12px">${esc(d.config) || '—'}</td>
      </tr>`;
    }).join('');
  }

  function showDetail(i) {
    currentIndex = i;
    const d = DATA[i];

    document.getElementById('main-view').style.display = 'none';
    document.getElementById('detail-view').style.display = 'flex';

    const id = d.plan_id || d.intake_id || '—';
    document.getElementById('detail-title').textContent = `${d.client_pseudo_id || '—'} · ${id}`;
    document.getElementById('nav-info').textContent = `${i + 1} / ${DATA.length}`;
    document.getElementById('prev-btn').disabled = i === 0;
    document.getElementById('next-btn').disabled = i === DATA.length - 1;

    // Transcript
    document.getElementById('pane-transcript').innerHTML =
      (d.conversation_messages || []).map(msg => {
        const cw = msg.role === 'assistant' || msg.role === 'case manager';
        const cls = cw ? 'caseworker' : 'client';
        return `<div class="message ${cls}">
          <div class="message-role ${cls}">${cw ? 'Caseworker' : 'Client'}</div>
          <div class="message-content">${esc(msg.content)}</div>
        </div>`;
      }).join('');

    // Summary
    document.getElementById('pane-summary').innerHTML =
      `<div class="summary-text">${esc(d.summary)}</div>`;

    // Eval
    const g = d.grounding || {};
    const c = d.coverage || {};
    const h = d.has_section_headers || {};
    const sl = d.section_length || {};
    const nt = d.not_toxic || {};
    const t = d.tone || {};
    const nj = d.no_judgments || {};
    const gOk = g.score === 1;
    const cScore = c.score ?? 0;
    const cOk = cScore >= COVERAGE_PASS;
    const ntOk = nt.score === 1;

    const factGroup = (title, facts, cls) => {
      if (!facts?.length) return '';
      return `<div class="fact-group">
        <div class="fact-group-title">${title} (${facts.length})</div>
        ${facts.map(f => `<div class="fact-item ${cls}">
          <div class="fact-text">${esc(f.fact)}</div>
          <div class="fact-expl">${esc(f.explanation)}</div>
        </div>`).join('')}
      </div>`;
    };

    document.getElementById('pane-eval').innerHTML = `
      <div class="eval-section">
        <div class="eval-header">
          <div class="eval-title">Grounding</div>
          <span class="badge ${gOk ? 'pass' : 'fail'}">${gOk ? '✓ PASS' : '✗ FAIL'}</span>
        </div>
        <div class="eval-explanation">${esc(g.explanation)}</div>
        ${factGroup('✓ Correct Facts', g.correct_facts, 'correct')}
        ${factGroup('⚡ Interpretive Additions', g.interpretive_additions, 'interpretive')}
        ${factGroup('✗ Hallucinated Facts', g.hallucinated_facts, 'hallucinated')}
      </div>
      <hr class="divider">
      <div class="eval-section">
        <div class="eval-header">
          <div class="eval-title">Coverage</div>
          <span class="badge ${cOk ? 'pass' : 'fail'}">${cOk ? '✓ PASS' : '✗ FAIL'}</span>
          <span class="score ${cOk ? 'pass' : scoreClass(cScore, 10)}">${cScore}/10</span>
        </div>
        <div class="eval-explanation">${esc(c.explanation)}</div>
        ${(c.missing_details?.length) ? `<div class="fact-group">
          <div class="fact-group-title">Missing Details (${c.missing_details.length})</div>
          ${c.missing_details.map(m => `<div class="missing-item">${esc(m)}</div>`).join('')}
        </div>` : ''}
      </div>
      <hr class="divider">
      <div class="eval-section">
        <div class="eval-header">
          <div class="eval-title">Has Section Headers</div>
          <span class="score ${scoreClass(h.score ?? 0, 10)}">${h.score ?? '—'}/10</span>
          <span style="font-size:12px;color:#aaa">${h.header_count ?? 0} header(s)</span>
        </div>
        <div class="eval-explanation">${esc(h.explanation)}</div>
      </div>
      <hr class="divider">
      <div class="eval-section">
        <div class="eval-header">
          <div class="eval-title">Section Length</div>
          <span class="score ${scoreClass(sl.score ?? 0, 10)}">${sl.score ?? '—'}/10</span>
        </div>
        <div class="eval-explanation">${esc(sl.explanation)}</div>
        ${(sl.flagged_sections?.length) ? `<div class="fact-group">
          <div class="fact-group-title">Flagged Sections (${sl.flagged_sections.length})</div>
          ${sl.flagged_sections.map(s => `<div class="missing-item">${esc(s.header || '(no header)')}: ${s.word_count} words — ${esc(s.reason)}</div>`).join('')}
        </div>` : ''}
      </div>
      <hr class="divider">
      <div class="eval-section">
        <div class="eval-header">
          <div class="eval-title">Not Toxic</div>
          <span class="badge ${ntOk ? 'pass' : 'fail'}">${ntOk ? '✓ PASS' : '✗ FAIL'}</span>
        </div>
        <div class="eval-explanation">${esc(nt.explanation)}</div>
      </div>
      <hr class="divider">
      <div class="eval-section">
        <div class="eval-header">
          <div class="eval-title">Tone</div>
          <span class="score ${scoreClass(t.score ?? 0, 10)}">${t.score ?? '—'}/10</span>
        </div>
        <div class="eval-explanation">${esc(t.explanation)}</div>
      </div>
      <hr class="divider">
      <div class="eval-section">
        <div class="eval-header">
          <div class="eval-title">No Judgments</div>
          <span class="score ${scoreClass(nj.score ?? 0, 10)}">${nj.score ?? '—'}/10</span>
        </div>
        <div class="eval-explanation">${esc(nj.explanation)}</div>
      </div>`;

    ['pane-transcript', 'pane-summary', 'pane-eval'].forEach(id =>
      { document.getElementById(id).scrollTop = 0; });
  }

  function showMain() {
    document.getElementById('detail-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
  }

  function navigate(dir) {
    const next = currentIndex + dir;
    if (next >= 0 && next < DATA.length) showDetail(next);
  }

  document.addEventListener('keydown', e => {
    if (document.getElementById('detail-view').style.display !== 'none') {
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'Escape') showMain();
    }
  });

  init();
</script>
</body>
</html>"""


if __name__ == "__main__":
    import asyncio

    asyncio.run(
        evaluate_summary(
            "summary-default-v0.yaml",
        )
    )
