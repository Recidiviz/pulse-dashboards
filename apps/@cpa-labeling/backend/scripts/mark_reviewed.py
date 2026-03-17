#!/usr/bin/env python3
"""Mark or unmark intakes as reviewed by managing empty feedback rows.

This script manages empty feedback rows for a given reviewer. Empty rows
effectively mark intakes as "reviewed" without actual review, removing them
from the reviewer's queue without affecting stats.

Usage:
    # Mark intakes before a date as reviewed:
    python scripts/mark_reviewed.py mark --evaluator "user@example.com" --before "2026-01-15"

    # Unmark (remove empty feedback) for intakes in a date range:
    python scripts/mark_reviewed.py unmark --evaluator "user@example.com" --after "2026-01-01" --before "2026-01-15"

    # Delete a specific feedback row by intake ID:
    python scripts/mark_reviewed.py delete --evaluator "user@example.com" --intake-id "uuid-here"

    # Dry run (show what would be done without making changes):
    python scripts/mark_reviewed.py mark --evaluator "user@example.com" --before "2026-01-15" --dry-run
    python scripts/mark_reviewed.py unmark --evaluator "user@example.com" --after "2026-01-01" --before "2026-01-15" --dry-run
    python scripts/mark_reviewed.py delete --evaluator "user@example.com" --intake-id "uuid-here" --dry-run
"""

import argparse
import asyncio
import os
import sys
from datetime import datetime
from uuid import uuid4, UUID

# Add the app directory to the path so we can import models
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


async def get_reentry_db_url() -> str:
    """Get the reentry database URL from environment."""
    host = os.environ.get("LABELING_REENTRY_POSTGRES_HOST", "localhost")
    port = os.environ.get("LABELING_REENTRY_POSTGRES_PORT", "5432")
    user = os.environ.get("LABELING_REENTRY_POSTGRES_USER", "postgres")
    password = os.environ.get("LABELING_REENTRY_POSTGRES_PASSWORD", "postgres")
    db = os.environ.get("LABELING_REENTRY_POSTGRES_DB", "reentry")
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"


async def get_labeling_db_url() -> str:
    """Get the labeling database URL from environment."""
    host = os.environ.get("LABELING_LABELING_POSTGRES_HOST", "localhost")
    port = os.environ.get("LABELING_LABELING_POSTGRES_PORT", "5432")
    user = os.environ.get("LABELING_LABELING_POSTGRES_USER", "postgres")
    password = os.environ.get("LABELING_LABELING_POSTGRES_PASSWORD", "postgres")
    db = os.environ.get("LABELING_LABELING_POSTGRES_DB", "labeling")
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"


def is_empty_feedback(feedback) -> bool:
    """Check if a feedback row is empty (no actual labels, just a skip marker)."""
    from app.models.labeling_feedback import SeverityLevel

    # Check transcript detail JSON
    if feedback.transcript_detail_feedback:
        td = feedback.transcript_detail_feedback
        for criterion in ["danger_indication", "toxic_language", "inappropriate_topic",
                          "user_frustration", "major_output_error", "chatbot_misunderstanding",
                          "looping_questions", "skipping_questions", "other",
                          "audio_quality", "transcription_quality"]:
            criterion_data = td.get(criterion, {})
            if isinstance(criterion_data, dict):
                if criterion_data.get("severity", "none") != "none":
                    return False
                if criterion_data.get("notes"):
                    return False

    # Check summary columns
    if any([
        feedback.summary_factual_severity != SeverityLevel.NONE.value,
        feedback.summary_tone_severity != SeverityLevel.NONE.value,
        feedback.summary_other_severity != SeverityLevel.NONE.value,
        feedback.summary_factual_notes,
        feedback.summary_tone_notes,
        feedback.summary_other_notes,
    ]):
        return False

    # Check plan detail JSON
    if feedback.plan_detail_feedback:
        for section_data in feedback.plan_detail_feedback.get("sections", {}).values():
            for field in ["recommendation_groundedness", "unsound_recommendation",
                         "obvious_incoherence", "missing_incomplete_sections"]:
                field_data = section_data.get(field, {})
                if isinstance(field_data, dict):
                    if field_data.get("severity", "none") != "none":
                        return False
                    if field_data.get("notes"):
                        return False

    # Check overall notes
    if feedback.overall_notes:
        return False

    return True


async def mark_reviewed(evaluator: str, before_date: datetime, dry_run: bool = False):
    """Mark all intakes before the given date as reviewed by the evaluator."""
    from app.models.intake import Intake, IntakeStatus
    from app.models.labeling_feedback import LabelingFeedback

    reentry_url = await get_reentry_db_url()
    labeling_url = await get_labeling_db_url()

    reentry_engine = create_async_engine(reentry_url)
    labeling_engine = create_async_engine(labeling_url)

    ReentrySession = sessionmaker(reentry_engine, class_=AsyncSession, expire_on_commit=False)
    LabelingSession = sessionmaker(labeling_engine, class_=AsyncSession, expire_on_commit=False)

    async with ReentrySession() as reentry_session, LabelingSession() as labeling_session:
        # Get all completed intakes before the cutoff date
        completed_or_updated = func.coalesce(Intake.completed_at, Intake.updated_at)
        result = await reentry_session.execute(
            select(Intake)
            .where(Intake.status == IntakeStatus.COMPLETED)
            .where(completed_or_updated < before_date)
            .order_by(completed_or_updated.asc())
        )
        intakes = result.scalars().all()

        print(f"Found {len(intakes)} completed intakes before {before_date.date()}")

        inserted_count = 0
        skipped_count = 0

        for intake in intakes:
            # Check if feedback already exists for this evaluator
            existing = await labeling_session.execute(
                select(LabelingFeedback).where(
                    LabelingFeedback.intake_id == intake.id,
                    LabelingFeedback.evaluator == evaluator
                )
            )
            if existing.scalar_one_or_none():
                skipped_count += 1
                continue

            if dry_run:
                print(f"  [DRY RUN] Would insert empty feedback for intake {intake.id} "
                      f"(created {intake.created_at.date()})")
            else:
                # Insert empty feedback row
                feedback = LabelingFeedback(
                    id=uuid4(),
                    intake_id=intake.id,
                    evaluator=evaluator,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    # All other fields use defaults (severity="none", notes=None)
                )
                labeling_session.add(feedback)

            inserted_count += 1

        if not dry_run:
            await labeling_session.commit()
            print(f"\nInserted {inserted_count} empty feedback rows for evaluator '{evaluator}'")
        else:
            print(f"\n[DRY RUN] Would insert {inserted_count} empty feedback rows for evaluator '{evaluator}'")

        print(f"Skipped {skipped_count} intakes (already have feedback from this evaluator)")

    await reentry_engine.dispose()
    await labeling_engine.dispose()


async def unmark_reviewed(evaluator: str, after_date: datetime, before_date: datetime, dry_run: bool = False):
    """Remove empty feedback rows for intakes in the given date range."""
    from app.models.intake import Intake, IntakeStatus
    from app.models.labeling_feedback import LabelingFeedback

    reentry_url = await get_reentry_db_url()
    labeling_url = await get_labeling_db_url()

    reentry_engine = create_async_engine(reentry_url)
    labeling_engine = create_async_engine(labeling_url)

    ReentrySession = sessionmaker(reentry_engine, class_=AsyncSession, expire_on_commit=False)
    LabelingSession = sessionmaker(labeling_engine, class_=AsyncSession, expire_on_commit=False)

    async with ReentrySession() as reentry_session, LabelingSession() as labeling_session:
        # Get all completed intakes in the date range
        completed_or_updated = func.coalesce(Intake.completed_at, Intake.updated_at)
        result = await reentry_session.execute(
            select(Intake)
            .where(Intake.status == IntakeStatus.COMPLETED)
            .where(completed_or_updated >= after_date)
            .where(completed_or_updated < before_date)
            .order_by(completed_or_updated.asc())
        )
        intakes = result.scalars().all()
        intake_ids = [intake.id for intake in intakes]

        print(f"Found {len(intakes)} completed intakes between {after_date.date()} and {before_date.date()}")

        if not intake_ids:
            print("No intakes found in date range.")
            return

        # Get all feedback rows for this evaluator and these intakes
        feedback_result = await labeling_session.execute(
            select(LabelingFeedback).where(
                LabelingFeedback.intake_id.in_(intake_ids),
                LabelingFeedback.evaluator == evaluator
            )
        )
        feedback_rows = feedback_result.scalars().all()

        print(f"Found {len(feedback_rows)} feedback rows for evaluator '{evaluator}'")

        deleted_count = 0
        skipped_count = 0

        for fb in feedback_rows:
            if is_empty_feedback(fb):
                if dry_run:
                    print(f"  [DRY RUN] Would delete empty feedback {fb.id} for intake {fb.intake_id}")
                else:
                    await labeling_session.delete(fb)
                deleted_count += 1
            else:
                skipped_count += 1
                if dry_run:
                    print(f"  [SKIP] Feedback {fb.id} has actual labels, not deleting")

        if not dry_run:
            await labeling_session.commit()
            print(f"\nDeleted {deleted_count} empty feedback rows for evaluator '{evaluator}'")
        else:
            print(f"\n[DRY RUN] Would delete {deleted_count} empty feedback rows for evaluator '{evaluator}'")

        print(f"Skipped {skipped_count} feedback rows (have actual labels)")

    await reentry_engine.dispose()
    await labeling_engine.dispose()


async def delete_feedback(evaluator: str, intake_id: UUID, dry_run: bool = False):
    """Delete a specific feedback row for the given evaluator and intake."""
    from app.models.labeling_feedback import LabelingFeedback

    labeling_url = await get_labeling_db_url()
    labeling_engine = create_async_engine(labeling_url)
    LabelingSession = sessionmaker(labeling_engine, class_=AsyncSession, expire_on_commit=False)

    async with LabelingSession() as labeling_session:
        # Find the feedback row
        result = await labeling_session.execute(
            select(LabelingFeedback).where(
                LabelingFeedback.intake_id == intake_id,
                LabelingFeedback.evaluator == evaluator
            )
        )
        feedback = result.scalar_one_or_none()

        if not feedback:
            print(f"No feedback found for evaluator '{evaluator}' and intake '{intake_id}'")
            return

        is_empty = is_empty_feedback(feedback)
        print(f"Found feedback row:")
        print(f"  ID: {feedback.id}")
        print(f"  Created: {feedback.created_at}")
        print(f"  Updated: {feedback.updated_at}")
        print(f"  Is empty (skip marker): {is_empty}")

        if dry_run:
            print(f"\n[DRY RUN] Would delete feedback {feedback.id}")
        else:
            await labeling_session.delete(feedback)
            await labeling_session.commit()
            print(f"\nDeleted feedback {feedback.id}")

    await labeling_engine.dispose()


def parse_date(date_str: str) -> datetime:
    """Parse a date string in YYYY-MM-DD format."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise argparse.ArgumentTypeError(f"Invalid date format: {date_str}. Use YYYY-MM-DD")


def main():
    parser = argparse.ArgumentParser(
        description="Mark or unmark intakes as reviewed by managing empty feedback rows."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Mark command
    mark_parser = subparsers.add_parser("mark", help="Mark intakes as reviewed (insert empty feedback)")
    mark_parser.add_argument(
        "--evaluator",
        required=True,
        help="The evaluator email/name to mark as having reviewed"
    )
    mark_parser.add_argument(
        "--before",
        required=True,
        type=parse_date,
        help="Mark all intakes created before this date (YYYY-MM-DD)"
    )
    mark_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes"
    )

    # Unmark command
    unmark_parser = subparsers.add_parser("unmark", help="Unmark intakes (remove empty feedback rows)")
    unmark_parser.add_argument(
        "--evaluator",
        required=True,
        help="The evaluator email/name to unmark"
    )
    unmark_parser.add_argument(
        "--after",
        required=True,
        type=parse_date,
        help="Unmark intakes created on or after this date (YYYY-MM-DD)"
    )
    unmark_parser.add_argument(
        "--before",
        required=True,
        type=parse_date,
        help="Unmark intakes created before this date (YYYY-MM-DD)"
    )
    unmark_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes"
    )

    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete a specific feedback row")
    delete_parser.add_argument(
        "--evaluator",
        required=True,
        help="The evaluator email/name"
    )
    delete_parser.add_argument(
        "--intake-id",
        required=True,
        help="The intake UUID to delete feedback for"
    )
    delete_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes"
    )

    args = parser.parse_args()

    if args.command == "mark":
        print(f"Marking intakes as reviewed:")
        print(f"  Evaluator: {args.evaluator}")
        print(f"  Before: {args.before.date()}")
        print(f"  Dry run: {args.dry_run}")
        print()
        asyncio.run(mark_reviewed(args.evaluator, args.before, args.dry_run))

    elif args.command == "unmark":
        print(f"Unmarking intakes (removing empty feedback):")
        print(f"  Evaluator: {args.evaluator}")
        print(f"  After: {args.after.date()}")
        print(f"  Before: {args.before.date()}")
        print(f"  Dry run: {args.dry_run}")
        print()
        asyncio.run(unmark_reviewed(args.evaluator, args.after, args.before, args.dry_run))

    elif args.command == "delete":
        try:
            intake_uuid = UUID(args.intake_id)
        except ValueError:
            print(f"Error: Invalid UUID format: {args.intake_id}")
            sys.exit(1)

        print(f"Deleting feedback:")
        print(f"  Evaluator: {args.evaluator}")
        print(f"  Intake ID: {intake_uuid}")
        print(f"  Dry run: {args.dry_run}")
        print()
        asyncio.run(delete_feedback(args.evaluator, intake_uuid, args.dry_run))


if __name__ == "__main__":
    main()
