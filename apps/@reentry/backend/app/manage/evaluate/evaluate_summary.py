"""
Evaluate summary generation using fake conversation and assessment data, or real data from the database.

This command allows testing the summary generation pipeline without running a full conversation,
using pre-defined conversation history data from JSON files or default values, or
loading real intakes/plans from the database.

NOTE: Config YAML files are now managed via the Config Management UI.
To use this command, first export a config from the UI at /config, then provide
the exported file name as the output_config_name parameter.
"""

import csv
import json
import logging
from dataclasses import dataclass
from datetime import datetime
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

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
from .summary_evals import COVERAGE_PASS_THRESHOLD, coverage_check, grounding_check

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
) -> Dict:
    """Run grounding and coverage evaluations and return the result dict.

    Callers are responsible for printing the intake and summary before calling this.
    """
    print("\n" + "=" * 60)
    print("🔍 RUNNING EVALUATIONS")
    print("=" * 60)
    formatted = format_conversation_from_messages(conversation_messages)
    eval_results = await _run_evaluations(summary, formatted)
    return {**meta, **eval_results}


async def _run_pipeline(
    items: List[EvalItem], output_format: str, max_messages: Optional[int] = None
) -> None:
    """Print and evaluate each item, then output all results."""
    results = []
    for item in items:
        _print_intake_conversation(item.conversation_messages, max_messages)
        _print_summary_text(item.summary)
        result = await _evaluate_assets(
            item.summary, item.conversation_messages, item.meta
        )
        results.append(result)
    _output_results(results, output_format)


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
        output: Output format: console (default), json, csv
        env: Database environment: prod (default), staging, demo, dev, local
        max_messages: Truncate conversation display to this many messages (default: show all)
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
                print("❌ Error: --output-config-name is required for fake mode")
                print("Usage: evaluate-summary fake --output-config-name <name>")
                return

            logger.info("Running in FAKE DATA mode")
            logger.info(f"Output config: {output_config_name}")
            items = await _collect_fake_data(
                output_config_name=output_config_name,
                conversation_file=conversation_file,
            )
        else:
            print(f"❌ Error: Unknown mode '{mode}'. Choose from: db, test, fake")
            return

        await _run_pipeline(items, output, max_messages)

    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        print(f"❌ Error: {e}")
        if mode == "fake":
            print(
                "\n💡 Tip: Config YAML files are now managed via the Config Management UI."
            )
            print(
                "   Export a config from the UI at /config, then provide the exported file name."
            )
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON: {e}")
        print(f"❌ Error: Invalid JSON in input file: {e}")
    except ValueError as e:
        logger.error(f"Invalid input: {e}")
        print(f"❌ Error: {e}")
    except Exception as e:
        logger.error(f"Error during evaluation: {e}")
        print(f"❌ Error: {e}")
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

    print("\n" + "=" * 60)
    print("📝 GENERATING SUMMARY")
    print("=" * 60)
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

    print("\n" + "=" * 60)
    print("📝 TEST SCENARIO")
    print("=" * 60)

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
                    print(f"❌ Error: Plan not found: {plan_id}")
                    return []
                plans = [plan]
            elif intake_id:
                from sqlalchemy import text

                row = await session.execute(
                    text(
                        "SELECT id, intake_type, assessment_config_id, client_pseudo_id"
                        " FROM intake WHERE id = :id"
                    ),
                    {"id": UUID(intake_id)},
                )
                intake_row = row.fetchone()
                if not intake_row:
                    print(f"❌ Error: Intake not found: {intake_id}")
                    return []

                result = await session.execute(
                    select(Plan)
                    .where(Plan.intake_id == UUID(intake_id))
                    .options(*NO_LAZY)
                )
                plan = result.scalar_one_or_none()
                plans = [plan] if plan else []
                if not plans:
                    print(
                        f"⚠️  No plan found for intake {intake_id}, will generate summary"
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
                print("No plans found matching filters")
                return []

            print(f"Found {len(plans)} plan(s) to evaluate\n")

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
    print(f"\n[{idx}/{total}] Evaluating Plan: {plan.id}")

    summary_asset = await get_asset_by_filename(session, plan.id, "summary.md")
    if not summary_asset or not summary_asset.file_blob:
        print("  ⚠️  Skipping: no summary found")
        return None

    summary = summary_asset.file_blob.decode("utf-8")

    messages_asset = await get_asset_by_filename(session, plan.id, "messages.json")
    if not messages_asset or not messages_asset.file_blob:
        print("  ⚠️  Skipping: no messages found")
        return None

    messages_json = json.loads(messages_asset.file_blob.decode("utf-8"))

    return EvalItem(
        conversation_messages=messages_json,
        summary=summary,
        meta={
            "plan_id": str(plan.id),
            "intake_id": str(plan.intake_id) if plan.intake_id else None,
            "client_pseudo_id": plan.client_pseudo_id,
            "config": "existing",
        },
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

    print(f"[{idx}/{total}] Evaluating Intake: {intake_id}")

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
        print(f"  ⚠️  Skipping: intake type {intake_type} not supported yet")
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
    )


async def _run_evaluations(summary: str, intake_messages: str) -> Dict:
    """Run grounding and coverage evaluations on a summary."""
    from uuid import uuid4

    # Create Run and Example objects to satisfy the LangSmith evaluator interface
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
        inputs={"intake_messages": intake_messages},
        outputs={},
    )

    # Run evaluators
    grounding_result = await grounding_check(run, example)
    coverage_result = await coverage_check(run, example)

    return {
        "grounding": grounding_result,
        "coverage": coverage_result,
    }


def _output_results(results: List[Dict], output_format: str):
    """Output evaluation results in the specified format."""
    if output_format == "json":
        print(json.dumps(results, indent=2))
    elif output_format == "csv":
        if not results:
            print("No results to output")
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

        print("\n" + "=" * 60)
        print(f"Overall: {passed_checks}/{total_checks} checks passed")
        print("=" * 60)


if __name__ == "__main__":
    import asyncio

    asyncio.run(
        evaluate_summary(
            "summary-default-v0.yaml",
        )
    )
