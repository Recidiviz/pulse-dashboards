"""CRUD operations for labeling.

This module contains two types of operations:
1. Reentry data operations (read-only from reentry DB): intake, plan, etc.
2. Labeling feedback operations (read-write to labeling DB): feedback

The routes are responsible for injecting the appropriate session.
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import case, func, literal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.intake import Intake, IntakeMessage, IntakeType
from app.models.plan import Plan, PlanAsset, PlanGeneration
from app.models.recording import RecordingSession
from app.models.labeling_feedback import LabelingFeedback, SeverityLevel


# =============================================================================
# Reentry Database Operations (read-only)
# These functions should be called with a reentry_session
# =============================================================================


async def get_intake_by_id(session: AsyncSession, intake_id: UUID) -> Optional[Intake]:
    """Get an intake by ID. Uses reentry database."""
    result = await session.execute(select(Intake).where(Intake.id == intake_id))
    return result.scalar_one_or_none()


async def get_intake_messages(session: AsyncSession, intake_id: UUID) -> list[IntakeMessage]:
    """Get all messages for an intake. Uses reentry database."""
    result = await session.execute(
        select(IntakeMessage)
        .where(IntakeMessage.intake_id == intake_id)
        .order_by(IntakeMessage.created_at)
    )
    return list(result.scalars().all())


async def get_plan_by_intake_id(session: AsyncSession, intake_id: UUID) -> Optional[Plan]:
    """Get the most recent plan by intake ID. Uses reentry database."""
    result = await session.execute(
        select(Plan)
        .where(Plan.intake_id == intake_id)
        .order_by(Plan.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_plan_asset_by_filename(
    session: AsyncSession, plan_id: UUID, filename: str
) -> Optional[PlanAsset]:
    """Get a specific plan asset by filename. Uses reentry database."""
    result = await session.execute(
        select(PlanAsset).where(
            PlanAsset.plan_id == plan_id,
            PlanAsset.filename == filename,
        )
    )
    return result.scalar_one_or_none()


async def get_plan_generations(session: AsyncSession, plan_id: UUID) -> list[PlanGeneration]:
    """Get all generations for a plan. Uses reentry database."""
    result = await session.execute(
        select(PlanGeneration)
        .where(PlanGeneration.plan_id == plan_id)
        .order_by(PlanGeneration.created_at.desc())
    )
    return list(result.scalars().all())


async def get_recording_session_for_intake(
    session: AsyncSession, intake_id: UUID
) -> Optional[RecordingSession]:
    """Get the recording session for an intake. Uses reentry database."""
    result = await session.execute(
        select(RecordingSession).where(RecordingSession.intake_id == intake_id)
    )
    return result.scalar_one_or_none()


async def get_recording_transcript(
    session: AsyncSession, intake_id: UUID
) -> list[dict[str, Any]]:
    """Fetch the processed transcript from GCS for a recorded intake.

    Returns a list of dicts with 'role', 'content', and 'created_at' keys,
    compatible with the TranscriptMessage format used by the frontend.
    """
    import json
    from google.cloud import storage as gcs

    recording = await get_recording_session_for_intake(session, intake_id)
    if not recording or not recording.gcs_bucket_name:
        return []

    client = gcs.Client()
    bucket = client.bucket(recording.gcs_bucket_name)
    blob = bucket.blob(f"transcriptions/{recording.id}_processed.json")

    if not blob.exists():
        return []

    data = json.loads(blob.download_as_text())
    conversation = data.get("conversation", [])

    messages = []
    for turn in conversation:
        messages.append({
            "role": turn.get("role", "unknown"),
            "content": turn.get("content", ""),
            "start_time": turn.get("startTime"),
        })
    return messages



async def get_completed_intakes(session: AsyncSession) -> list[Intake]:
    """Get all completed intakes. Uses reentry database."""
    from app.models.intake import IntakeStatus
    result = await session.execute(
        select(Intake)
        .where(Intake.status == IntakeStatus.COMPLETED)
        .order_by(Intake.created_at.desc())
    )
    return list(result.scalars().all())


# =============================================================================
# Labeling Database Operations (read-write)
# These functions should be called with a labeling_session
# =============================================================================


async def get_feedback_by_intake_id(
    session: AsyncSession, intake_id: UUID
) -> list[LabelingFeedback]:
    """Get all feedback for an intake. Uses labeling database."""
    result = await session.execute(
        select(LabelingFeedback).where(LabelingFeedback.intake_id == intake_id)
    )
    return list(result.scalars().all())


async def get_feedback_by_intake_and_evaluator(
    session: AsyncSession, intake_id: UUID, evaluator: str
) -> Optional[LabelingFeedback]:
    """Get feedback for a specific intake and evaluator. Uses labeling database."""
    result = await session.execute(
        select(LabelingFeedback).where(
            LabelingFeedback.intake_id == intake_id,
            LabelingFeedback.evaluator == evaluator,
        )
    )
    return result.scalar_one_or_none()


async def upsert_feedback(
    session: AsyncSession,
    intake_id: UUID,
    evaluator: str,
    data: dict[str, Any],
) -> LabelingFeedback:
    """Create or update feedback. Uses labeling database."""
    existing = await get_feedback_by_intake_and_evaluator(session, intake_id, evaluator)

    if existing:
        # Update existing
        for key, value in data.items():
            if hasattr(existing, key):
                setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        session.add(existing)
    else:
        # Create new
        existing = LabelingFeedback(
            intake_id=intake_id,
            evaluator=evaluator,
            **data,
        )
        session.add(existing)

    await session.commit()
    await session.refresh(existing)
    return existing


def _has_any_issue_in_json(feedback: LabelingFeedback) -> bool:
    """Check if a feedback record has any non-'none' severity in JSON columns.

    Null severities are treated as 'none' (no issue).
    """
    # Check transcript_detail_feedback JSON
    if feedback.transcript_detail_feedback:
        td = feedback.transcript_detail_feedback
        transcript_criteria = [
            "danger_indication", "toxic_language", "inappropriate_topic",
            "user_frustration", "major_output_error", "chatbot_misunderstanding",
            "looping_questions", "skipping_questions", "other",
            "audio_quality", "transcription_quality"
        ]
        for criterion in transcript_criteria:
            criterion_data = td.get(criterion, {})
            if isinstance(criterion_data, dict):
                severity = criterion_data.get("severity")
                if not _is_empty_severity(severity):
                    return True

    # Check plan_detail_feedback JSON
    if feedback.plan_detail_feedback:
        for section_data in feedback.plan_detail_feedback.get("sections", {}).values():
            for field in ["recommendation_groundedness", "unsound_recommendation", "obvious_incoherence", "missing_incomplete_sections", "other"]:
                field_data = section_data.get(field, {})
                if isinstance(field_data, dict):
                    severity = field_data.get("severity")
                    if not _is_empty_severity(severity):
                        return True

    # Check summary columns (still uses individual columns) - treat null same as "none"
    if any([
        not _is_empty_severity(feedback.summary_factual_severity),
        not _is_empty_severity(feedback.summary_tone_severity),
        not _is_empty_severity(feedback.summary_other_severity),
    ]):
        return True

    return False


def _is_empty_severity(severity: Optional[str]) -> bool:
    """Check if a severity value is empty (None or 'none')."""
    return severity is None or severity == "none"


def _is_meaningful_feedback(feedback: LabelingFeedback) -> bool:
    """Check if feedback has any actual content (not just a 'skip' marker).

    Empty feedback rows (all severities='none' or null, no notes) are used to mark
    records as 'reviewed' without actual review. These should not count in stats.
    """
    # Check transcript detail JSON
    if feedback.transcript_detail_feedback:
        td = feedback.transcript_detail_feedback
        for criterion in ["danger_indication", "toxic_language", "inappropriate_topic",
                          "user_frustration", "major_output_error", "chatbot_misunderstanding",
                          "looping_questions", "skipping_questions", "other",
                          "audio_quality", "transcription_quality"]:
            criterion_data = td.get(criterion, {})
            if isinstance(criterion_data, dict):
                severity = criterion_data.get("severity")
                if not _is_empty_severity(severity):
                    return True
                if criterion_data.get("notes"):
                    return True

    # Check summary columns (treat null same as "none")
    if any([
        not _is_empty_severity(feedback.summary_factual_severity),
        not _is_empty_severity(feedback.summary_tone_severity),
        not _is_empty_severity(feedback.summary_other_severity),
        feedback.summary_factual_notes,
        feedback.summary_tone_notes,
        feedback.summary_other_notes,
    ]):
        return True

    # Check plan detail JSON
    if feedback.plan_detail_feedback:
        for section_data in feedback.plan_detail_feedback.get("sections", {}).values():
            for field in ["recommendation_groundedness", "unsound_recommendation",
                         "obvious_incoherence", "missing_incomplete_sections"]:
                field_data = section_data.get(field, {})
                if isinstance(field_data, dict):
                    severity = field_data.get("severity")
                    if not _is_empty_severity(severity):
                        return True
                    if field_data.get("notes"):
                        return True

    # Check overall notes
    if feedback.overall_notes:
        return True

    return False


def _has_any_issue_filter():
    """Build a filter expression for records with at least one non-'none' severity.

    Note: This only checks individual columns. For full accuracy including JSON columns,
    use _has_any_issue_in_json() on fetched records.
    """
    severity_fields = [
        LabelingFeedback.summary_factual_severity,
        LabelingFeedback.summary_tone_severity,
        LabelingFeedback.summary_other_severity,
        LabelingFeedback.plan_factual_severity,
        LabelingFeedback.plan_tone_severity,
        LabelingFeedback.plan_other_severity,
    ]
    from sqlalchemy import or_
    # Also check if JSON columns are not null (as a proxy for having data)
    return or_(
        *[f != SeverityLevel.NONE.value for f in severity_fields],
        LabelingFeedback.transcript_detail_feedback.isnot(None),
        LabelingFeedback.plan_detail_feedback.isnot(None),
    )


SEVERITY_ORDER = {
    SeverityLevel.NONE.value: 0,
    SeverityLevel.MILD.value: 1,
    SeverityLevel.LOW.value: 2,
    SeverityLevel.MED.value: 3,
    SeverityLevel.SEVERE.value: 4,
}


def _highest_severity_for_row(feedback: LabelingFeedback) -> str:
    """Return the highest severity string across all fields for a feedback row.

    Null severities are treated as 'none'.
    """
    # Collect severities from individual columns (summary/plan overall)
    # Handle potential null values
    severity_values = [
        feedback.summary_factual_severity or "none",
        feedback.summary_tone_severity or "none",
        feedback.summary_other_severity or "none",
        feedback.plan_factual_severity or "none",
        feedback.plan_tone_severity or "none",
        feedback.plan_other_severity or "none",
    ]

    # Add severities from transcript_detail_feedback JSON
    if feedback.transcript_detail_feedback:
        td = feedback.transcript_detail_feedback
        transcript_criteria = [
            "danger_indication", "toxic_language", "inappropriate_topic",
            "user_frustration", "major_output_error", "chatbot_misunderstanding",
            "looping_questions", "skipping_questions", "other",
            "audio_quality", "transcription_quality"
        ]
        for criterion in transcript_criteria:
            criterion_data = td.get(criterion, {})
            if isinstance(criterion_data, dict):
                severity = criterion_data.get("severity")
                severity_values.append(severity if severity is not None else "none")

    # Add severities from plan_detail_feedback JSON
    if feedback.plan_detail_feedback:
        for section_data in feedback.plan_detail_feedback.get("sections", {}).values():
            for field in ["recommendation_groundedness", "unsound_recommendation", "obvious_incoherence", "missing_incomplete_sections", "other"]:
                field_data = section_data.get(field, {})
                if isinstance(field_data, dict):
                    severity = field_data.get("severity")
                    severity_values.append(severity if severity is not None else "none")

    # Find highest severity
    best = SeverityLevel.NONE.value
    for s in severity_values:
        if SEVERITY_ORDER.get(s, 0) > SEVERITY_ORDER.get(best, 0):
            best = s
    return best


async def get_all_feedback(
    session: AsyncSession,
    *,
    page: int = 1,
    size: int = 20,
    evaluator: Optional[str] = None,
    has_issues: Optional[bool] = None,
    intake_id: Optional[UUID] = None,
) -> tuple[list[LabelingFeedback], int]:
    """Get paginated feedback records with optional filters. Uses labeling database."""
    stmt = select(LabelingFeedback)

    if evaluator:
        stmt = stmt.where(LabelingFeedback.evaluator == evaluator)
    if intake_id:
        stmt = stmt.where(LabelingFeedback.intake_id == intake_id)
    if has_issues is True:
        stmt = stmt.where(_has_any_issue_filter())
    elif has_issues is False:
        stmt = stmt.where(~_has_any_issue_filter())

    # Count before pagination
    from sqlalchemy import select as sa_select
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar() or 0

    # Order and paginate
    stmt = stmt.order_by(LabelingFeedback.created_at.desc())
    stmt = stmt.offset((page - 1) * size).limit(size)

    result = await session.execute(stmt)
    return list(result.scalars().all()), total


def _get_severities_from_transcript_json(td: dict) -> list[str]:
    """Extract all severity values from transcript_detail_feedback JSON.

    Null severities are converted to 'none' for consistent handling.
    """
    severities = []
    transcript_criteria = [
        "danger_indication", "toxic_language", "inappropriate_topic",
        "user_frustration", "major_output_error", "chatbot_misunderstanding",
        "looping_questions", "skipping_questions", "other",
        "audio_quality", "transcription_quality"
    ]
    for criterion in transcript_criteria:
        criterion_data = td.get(criterion, {})
        if isinstance(criterion_data, dict):
            severity = criterion_data.get("severity")
            # Treat null same as "none"
            severities.append(severity if severity is not None else "none")
    return severities


def _get_severities_from_plan_json(pd: dict) -> list[str]:
    """Extract all severity values from plan_detail_feedback JSON.

    Null severities are converted to 'none' for consistent handling.
    """
    severities = []
    for section_data in pd.get("sections", {}).values():
        for field in ["recommendation_groundedness", "unsound_recommendation", "obvious_incoherence", "missing_incomplete_sections", "other"]:
            field_data = section_data.get(field, {})
            if isinstance(field_data, dict):
                severity = field_data.get("severity")
                # Treat null same as "none"
                severities.append(severity if severity is not None else "none")
    return severities


async def get_labeling_stats(session: AsyncSession) -> dict[str, Any]:
    """Get labeling statistics. Uses labeling database."""
    # Total feedback records
    total_result = await session.execute(select(func.count(LabelingFeedback.id)))
    total = total_result.scalar() or 0

    # Unique intakes labeled
    unique_intakes_result = await session.execute(
        select(func.count(func.distinct(LabelingFeedback.intake_id)))
    )
    unique_intakes = unique_intakes_result.scalar() or 0

    # By evaluator
    by_evaluator_result = await session.execute(
        select(LabelingFeedback.evaluator, func.count(LabelingFeedback.id)).group_by(
            LabelingFeedback.evaluator
        )
    )
    by_evaluator = {row[0]: row[1] for row in by_evaluator_result.all()}

    # Fetch all feedback for detailed analysis
    all_feedback_result = await session.execute(select(LabelingFeedback))
    all_feedback = all_feedback_result.scalars().all()

    # Compute stats from all feedback records
    with_issues = 0
    with_severe = 0
    transcript_issues = 0
    summary_issues = 0
    plan_issues = 0
    severity_distribution: dict[str, int] = {s.value: 0 for s in SeverityLevel}

    # Track issues by the new criteria categories
    by_issue_type: dict[str, int] = {}

    for fb in all_feedback:
        # Skip "empty" feedback (used for marking as reviewed without actual review)
        if not _is_meaningful_feedback(fb):
            continue

        all_severities: list[str] = []
        has_transcript_issue = False
        has_summary_issue = False
        has_plan_issue = False

        # Check transcript from JSON
        if fb.transcript_detail_feedback:
            transcript_sevs = _get_severities_from_transcript_json(fb.transcript_detail_feedback)
            all_severities.extend(transcript_sevs)
            if any(s != "none" for s in transcript_sevs):
                has_transcript_issue = True
            # Track by criterion
            td = fb.transcript_detail_feedback
            for criterion in ["danger_indication", "toxic_language", "inappropriate_topic",
                              "user_frustration", "major_output_error", "chatbot_misunderstanding",
                              "looping_questions", "skipping_questions", "other"]:
                criterion_data = td.get(criterion, {})
                if isinstance(criterion_data, dict) and criterion_data.get("severity", "none") != "none":
                    by_issue_type[criterion] = by_issue_type.get(criterion, 0) + 1

        # Check summary from individual columns
        summary_sevs = [
            fb.summary_factual_severity,
            fb.summary_tone_severity,
            fb.summary_other_severity,
        ]
        all_severities.extend(summary_sevs)
        if any(s != SeverityLevel.NONE.value for s in summary_sevs):
            has_summary_issue = True

        # Check plan from JSON
        if fb.plan_detail_feedback:
            plan_sevs = _get_severities_from_plan_json(fb.plan_detail_feedback)
            all_severities.extend(plan_sevs)
            if any(s != "none" for s in plan_sevs):
                has_plan_issue = True
            # Track by criterion
            for section_data in fb.plan_detail_feedback.get("sections", {}).values():
                for field in ["recommendation_groundedness", "unsound_recommendation", "obvious_incoherence", "missing_incomplete_sections", "other"]:
                    field_data = section_data.get(field, {})
                    if isinstance(field_data, dict) and field_data.get("severity", "none") != "none":
                        by_issue_type[field] = by_issue_type.get(field, 0) + 1

        # Update counts
        if has_transcript_issue:
            transcript_issues += 1
        if has_summary_issue:
            summary_issues += 1
        if has_plan_issue:
            plan_issues += 1

        if has_transcript_issue or has_summary_issue or has_plan_issue:
            with_issues += 1

        if "severe" in all_severities:
            with_severe += 1

        # Update severity distribution
        for sev in all_severities:
            if sev in severity_distribution:
                severity_distribution[sev] += 1

    return {
        "total_feedback_records": total,
        "unique_intakes_labeled": unique_intakes,
        "records_with_issues": with_issues,
        "records_with_severe_issues": with_severe,
        "by_evaluator": by_evaluator,
        "by_component": {
            "transcript": transcript_issues,
            "summary": summary_issues,
            "plan": plan_issues,
        },
        "by_issue_type": by_issue_type,
        "severity_distribution": severity_distribution,
    }
