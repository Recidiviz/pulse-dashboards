"""CRUD operations for labeling.

This module contains two types of operations:
1. Reentry data operations (read-only from reentry DB): intake, plan, etc.
2. Labeling feedback operations (read-write to labeling DB): feedback

The routes are responsible for injecting the appropriate session.
"""

from datetime import datetime, timezone
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


async def get_feedback_by_id(
    session: AsyncSession, feedback_id: UUID
) -> Optional[LabelingFeedback]:
    """Get a feedback record by its ID. Uses labeling database."""
    result = await session.execute(
        select(LabelingFeedback).where(LabelingFeedback.id == feedback_id)
    )
    return result.scalar_one_or_none()


async def update_override_feedback(
    session: AsyncSession,
    feedback_id: UUID,
    override_data: dict[str, Any],
) -> Optional[LabelingFeedback]:
    """Update the override_feedback column for a feedback record. Uses labeling database."""
    feedback = await get_feedback_by_id(session, feedback_id)
    if not feedback:
        return None

    feedback.override_feedback = override_data
    feedback.updated_at = datetime.utcnow()
    session.add(feedback)
    await session.commit()
    await session.refresh(feedback)
    return feedback


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

    # Check summary_detail_feedback JSON
    if feedback.summary_detail_feedback:
        sd = feedback.summary_detail_feedback
        # needs_risks_overview: dict of category -> {facts_incorrect, facts_missing, tone_issues, other}
        for cat_data in sd.get("needs_risks_overview", {}).values():
            if isinstance(cat_data, dict):
                for field in ["facts_incorrect", "facts_missing", "tone_issues", "other"]:
                    field_data = cat_data.get(field, {})
                    if isinstance(field_data, dict) and not _is_empty_severity(field_data.get("severity")):
                        return True
        # priority_needs, longer_term_needs: {needs_not_justified, needs_missing, other}
        for section_key in ["priority_needs", "longer_term_needs"]:
            section_data = sd.get(section_key, {})
            if isinstance(section_data, dict):
                for field in ["needs_not_justified", "needs_missing", "other"]:
                    field_data = section_data.get(field, {})
                    if isinstance(field_data, dict) and not _is_empty_severity(field_data.get("severity")):
                        return True
        # final_thoughts: {statements_not_supported, other}
        ft = sd.get("final_thoughts", {})
        if isinstance(ft, dict):
            for field in ["statements_not_supported", "other"]:
                field_data = ft.get(field, {})
                if isinstance(field_data, dict) and not _is_empty_severity(field_data.get("severity")):
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

    # Order by date (descending)
    stmt = stmt.order_by(LabelingFeedback.created_at.desc())

    result = await session.execute(stmt)
    all_records = list(result.scalars().all())

    # Post-filter for has_issues using _has_any_issue_in_json() which correctly
    # inspects JSON content instead of just checking for JSON column presence
    if has_issues is True:
        all_records = [fb for fb in all_records if _has_any_issue_in_json(fb)]
    elif has_issues is False:
        all_records = [fb for fb in all_records if not _has_any_issue_in_json(fb)]

    total = len(all_records)

    # Paginate
    start = (page - 1) * size
    end = start + size
    return all_records[start:end], total


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


def _get_effective_transcript_severity(
    criterion: str,
    original_td: dict,
    override_td: Optional[dict],
) -> str:
    """Get effective severity for a transcript criterion, using override if available."""
    if override_td and criterion in override_td:
        od = override_td.get(criterion, {})
        if isinstance(od, dict) and od.get("severity"):
            return od["severity"]
    cd = original_td.get(criterion, {})
    if isinstance(cd, dict):
        return cd.get("severity") or "none"
    return "none"


def _get_effective_column_severity(
    fb: LabelingFeedback,
    component: str,
    field: str,
    override_component: Optional[dict],
) -> str:
    """Get effective severity for a column-based field (summary/plan overall)."""
    if override_component and field in override_component:
        od = override_component.get(field, {})
        if isinstance(od, dict) and od.get("severity"):
            return od["severity"]
    return getattr(fb, f"{component}_{field}_severity", "none") or "none"


def _get_effective_plan_detail_severity(
    field: str,
    original_section: dict,
    override_section: Optional[dict],
) -> str:
    """Get effective severity for a plan detail field, using override if available."""
    if override_section and field in override_section:
        od = override_section.get(field, {})
        if isinstance(od, dict) and od.get("severity"):
            return od["severity"]
    fd = original_section.get(field, {})
    if isinstance(fd, dict):
        return fd.get("severity") or "none"
    return "none"


TRANSCRIPT_CRITERIA = [
    "danger_indication", "toxic_language", "inappropriate_topic",
    "user_frustration", "major_output_error", "chatbot_misunderstanding",
    "looping_questions", "skipping_questions", "other",
    "audio_quality", "transcription_quality",
]

PLAN_DETAIL_FIELDS = [
    "recommendation_groundedness", "unsound_recommendation",
    "obvious_incoherence", "missing_incomplete_sections", "other",
]


def _compute_record_stats(fb: LabelingFeedback, use_overrides: bool) -> dict[str, Any]:
    """Compute per-record stats, optionally applying override severities."""
    override = fb.override_feedback if use_overrides and fb.override_feedback else None

    all_severities: list[str] = []
    has_transcript_issue = False
    has_summary_issue = False
    has_plan_issue = False
    issue_types: dict[str, int] = {}

    # Transcript
    td = fb.transcript_detail_feedback or {}
    override_td = (override or {}).get("transcript_detail_feedback")
    for criterion in TRANSCRIPT_CRITERIA:
        sev = _get_effective_transcript_severity(criterion, td, override_td)
        all_severities.append(sev)
        if sev != "none":
            has_transcript_issue = True
            # Only count non-audio criteria in issue_types
            if criterion not in ("audio_quality", "transcription_quality"):
                issue_types[criterion] = issue_types.get(criterion, 0) + 1

    # Summary (column-based, overrides in JSON)
    override_sf = (override or {}).get("summary_feedback")
    for field in ["factual", "tone", "other"]:
        sev = _get_effective_column_severity(fb, "summary", field, override_sf)
        all_severities.append(sev)
        if sev != "none":
            has_summary_issue = True

    # Summary detail JSON
    sd = fb.summary_detail_feedback or {}
    override_sd = (override or {}).get("summary_detail_feedback") or {}
    # needs_risks_overview categories
    orig_nro = sd.get("needs_risks_overview", {})
    ovr_nro = override_sd.get("needs_risks_overview", {})
    for cat_key in set(orig_nro.keys()) | set(ovr_nro.keys()):
        orig_cat = orig_nro.get(cat_key, {})
        ovr_cat = ovr_nro.get(cat_key)
        for field in ["facts_incorrect", "facts_missing", "tone_issues", "other"]:
            sev = _get_effective_plan_detail_severity(field, orig_cat or {}, ovr_cat)
            all_severities.append(sev)
            if sev != "none":
                has_summary_issue = True
    # priority_needs, longer_term_needs
    for section_key in ["priority_needs", "longer_term_needs"]:
        orig_sec = sd.get(section_key, {})
        ovr_sec = override_sd.get(section_key)
        for field in ["needs_not_justified", "needs_missing", "other"]:
            sev = _get_effective_plan_detail_severity(field, orig_sec or {}, ovr_sec)
            all_severities.append(sev)
            if sev != "none":
                has_summary_issue = True
    # final_thoughts
    orig_ft = sd.get("final_thoughts", {})
    ovr_ft = override_sd.get("final_thoughts")
    for field in ["statements_not_supported", "other"]:
        sev = _get_effective_plan_detail_severity(field, orig_ft or {}, ovr_ft)
        all_severities.append(sev)
        if sev != "none":
            has_summary_issue = True

    # Plan overall (column-based)
    override_pf = (override or {}).get("plan_feedback")
    for field in ["factual", "tone", "other"]:
        sev = _get_effective_column_severity(fb, "plan", field, override_pf)
        all_severities.append(sev)
        if sev != "none":
            has_plan_issue = True

    # Plan detail JSON
    pd_data = fb.plan_detail_feedback or {}
    override_pd = (override or {}).get("plan_detail_feedback") or {}
    original_sections = pd_data.get("sections", {})
    override_sections = override_pd.get("sections", {})
    all_section_keys = set(original_sections.keys()) | set(override_sections.keys())

    for section_key in all_section_keys:
        orig_section = original_sections.get(section_key, {})
        ovr_section = override_sections.get(section_key)
        for field in PLAN_DETAIL_FIELDS:
            sev = _get_effective_plan_detail_severity(field, orig_section, ovr_section)
            all_severities.append(sev)
            if sev != "none":
                has_plan_issue = True
                issue_types[field] = issue_types.get(field, 0) + 1

    return {
        "has_transcript_issue": has_transcript_issue,
        "has_summary_issue": has_summary_issue,
        "has_plan_issue": has_plan_issue,
        "has_any_issue": has_transcript_issue or has_summary_issue or has_plan_issue,
        "has_severe": "severe" in all_severities,
        "all_severities": all_severities,
        "issue_types": issue_types,
    }


def _business_days_elapsed(start: datetime, end: datetime) -> int:
    """Count Mon–Fri business days between start and end (exclusive of start, inclusive of end)."""
    if end <= start:
        return 0
    count = 0
    current = start.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = end.replace(hour=0, minute=0, second=0, microsecond=0)
    # Move to the next day to start counting
    from datetime import timedelta
    current += timedelta(days=1)
    while current <= end_date:
        if current.weekday() < 5:  # Mon=0 ... Fri=4
            count += 1
        current += timedelta(days=1)
    return count


def _week_end_dates(reference: datetime, count: int) -> list[datetime]:
    """Return the last `count` Sunday dates (midnight UTC) before reference."""
    from datetime import timedelta
    # Find the most recent Sunday
    days_since_sunday = (reference.weekday() + 1) % 7  # Sun=0 in this scheme
    most_recent_sunday = reference - timedelta(days=days_since_sunday)
    most_recent_sunday = most_recent_sunday.replace(
        hour=23, minute=59, second=59, microsecond=999999
    )
    result = []
    for i in range(count):
        result.append(most_recent_sunday - timedelta(weeks=i))
    return list(reversed(result))


def _month_end_dates(reference: datetime, count: int) -> list[datetime]:
    """Return the last `count` month-end dates (end of day UTC) before reference."""
    import calendar
    result = []
    year, month = reference.year, reference.month
    # Go to previous month if we haven't finished this month yet
    # Always use completed months
    month -= 1
    if month == 0:
        month = 12
        year -= 1
    for _ in range(count):
        last_day = calendar.monthrange(year, month)[1]
        result.append(datetime(year, month, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(result))


async def get_queue_stats(
    reentry_session: AsyncSession,
    labeling_session: AsyncSession,
    evaluators: list[str],
) -> dict[str, Any]:
    """Compute per-evaluator queue sizes, overdue counts, and historical snapshots."""
    from app.models.intake import IntakeStatus

    now = datetime.now(timezone.utc)

    # Load all completed intakes
    intakes_result = await reentry_session.execute(
        select(Intake).where(Intake.status == IntakeStatus.COMPLETED)
    )
    all_intakes = list(intakes_result.scalars().all())

    # Load all feedback for the evaluators in one query
    if evaluators:
        feedback_result = await labeling_session.execute(
            select(LabelingFeedback).where(LabelingFeedback.evaluator.in_(evaluators))
        )
        all_feedback = list(feedback_result.scalars().all())
    else:
        all_feedback = []

    from datetime import timedelta

    # Build index: evaluator -> list of (intake_id, created_at)
    feedback_by_evaluator: dict[str, list[tuple[Any, datetime]]] = {e: [] for e in evaluators}
    for fb in all_feedback:
        if fb.evaluator in feedback_by_evaluator:
            fb_created = fb.created_at
            if fb_created.tzinfo is None:
                fb_created = fb_created.replace(tzinfo=timezone.utc)
            feedback_by_evaluator[fb.evaluator].append((fb.intake_id, fb_created))

    # First feedback date per evaluator (used to suppress overdue counts before they started)
    first_feedback_date: dict[str, datetime | None] = {
        e: (min(t for _, t in feedback_by_evaluator[e]) if feedback_by_evaluator[e] else None)
        for e in evaluators
    }

    # Intake map for fast lookup
    intake_map = {intake.id: intake for intake in all_intakes}

    def _cdt(intake: Any) -> datetime | None:
        dt = intake.completed_at or intake.updated_at
        if dt is None:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    # labeled_on_time: intake_ids where ANY evaluator submitted feedback within 2 biz days
    labeled_on_time: set = set()
    for evaluator in evaluators:
        for intake_id, fb_created in feedback_by_evaluator[evaluator]:
            intake = intake_map.get(intake_id)
            if intake:
                cdt = _cdt(intake)
                if cdt and _business_days_elapsed(cdt, fb_created) <= 2:
                    labeled_on_time.add(intake_id)

    # Compute snapshot dates
    week_ends = _week_end_dates(now, 4)

    def overdue_at(evaluator: str, snapshot_dt: datetime) -> int:
        """Count intakes overdue for evaluator as of snapshot_dt."""
        labeled_before = {
            intake_id
            for intake_id, created_at in feedback_by_evaluator.get(evaluator, [])
            if created_at <= snapshot_dt
        }
        count = 0
        for intake in all_intakes:
            cdt = _cdt(intake)
            if cdt is None or cdt > snapshot_dt:
                continue
            if _business_days_elapsed(cdt, snapshot_dt) <= 2:
                continue
            if intake.id not in labeled_before:
                count += 1
        return count

    evaluator_stats = []
    for evaluator in evaluators:
        labeled_intake_ids = {intake_id for intake_id, _ in feedback_by_evaluator[evaluator]}
        first_fb = first_feedback_date[evaluator]

        # Queue size: completed intakes not yet labeled by this evaluator
        queue_size = sum(1 for intake in all_intakes if intake.id not in labeled_intake_ids)

        # Current overdue — zero if evaluator has never submitted feedback
        current_overdue = overdue_at(evaluator, now) if first_fb is not None else 0

        fb_times = [created_at for _, created_at in feedback_by_evaluator[evaluator]]
        weekly_snapshots = []
        for d in week_ends:
            week_start = d - timedelta(weeks=1)
            completed_count = sum(1 for t in fb_times if week_start < t <= d)
            # Suppress overdue count for periods before evaluator's first feedback
            overdue_count = overdue_at(evaluator, d) if (first_fb is not None and d >= first_fb) else 0
            weekly_snapshots.append({
                "period_end": d.strftime("%Y-%m-%d"),
                "overdue_count": overdue_count,
                "completed_count": completed_count,
            })

        evaluator_stats.append({
            "evaluator": evaluator,
            "queue_size": queue_size,
            "overdue_count": current_overdue,
            "weekly_snapshots": weekly_snapshots,
        })

    # Aggregate weekly snapshots (across all evaluators, per-intake SLA view)
    aggregate_snapshots = []
    for d in week_ends:
        week_start = d - timedelta(weeks=1)
        eligible = []  # (intake_id, days_overdue_at_week_end)
        completed_this_week = 0

        for intake in all_intakes:
            cdt = _cdt(intake)
            if cdt is None:
                continue
            if week_start < cdt <= d:
                completed_this_week += 1
            # Eligible = SLA deadline (cdt + 2 biz days) falls within this week
            biz_to_start = _business_days_elapsed(cdt, week_start)
            biz_to_end = _business_days_elapsed(cdt, d)
            if biz_to_start <= 2 and biz_to_end >= 2:
                eligible.append((intake.id, biz_to_end - 2))

        overdue_items = [(iid, days) for iid, days in eligible if iid not in labeled_on_time]
        eligible_count = len(eligible)
        overdue_count = len(overdue_items)
        days_list = [days for _, days in overdue_items]

        aggregate_snapshots.append({
            "period_end": d.strftime("%Y-%m-%d"),
            "overdue_count": overdue_count,
            "eligible_count": eligible_count,
            "overdue_rate": round(overdue_count / eligible_count, 3) if eligible_count > 0 else 0.0,
            "completed_count": completed_this_week,
            "max_days_overdue": max(days_list) if days_list else None,
            "avg_days_overdue": round(sum(days_list) / len(days_list), 1) if days_list else None,
        })

    return {
        "evaluators": evaluator_stats,
        "aggregate_snapshots": aggregate_snapshots,
        "as_of": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


async def get_evaluator_queue(
    reentry_session: AsyncSession,
    labeling_session: AsyncSession,
    evaluator: str,
) -> list[dict[str, Any]]:
    """Return the full unlabeled queue for a single evaluator, sorted by completed_dt ASC."""
    from app.models.intake import IntakeStatus
    from datetime import timedelta

    now = datetime.now(timezone.utc)

    intakes_result = await reentry_session.execute(
        select(Intake).where(Intake.status == IntakeStatus.COMPLETED)
    )
    all_intakes = list(intakes_result.scalars().all())

    feedback_result = await labeling_session.execute(
        select(LabelingFeedback.intake_id).where(LabelingFeedback.evaluator == evaluator)
    )
    labeled_ids = {str(row[0]) for row in feedback_result.fetchall()}

    items = []
    for intake in all_intakes:
        if str(intake.id) in labeled_ids:
            continue
        completed_dt = intake.completed_at or intake.updated_at
        if completed_dt is None:
            continue
        if completed_dt.tzinfo is None:
            completed_dt = completed_dt.replace(tzinfo=timezone.utc)
        is_overdue = _business_days_elapsed(completed_dt, now) > 2
        items.append({
            "intake_id": str(intake.id),
            "completed_dt": completed_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "is_overdue": is_overdue,
        })

    items.sort(key=lambda x: x["completed_dt"])
    return items


async def get_labeling_stats(session: AsyncSession) -> dict[str, Any]:
    """Get labeling statistics. Uses labeling database.

    Returns two sets of stats: one with overrides applied (primary),
    and one without overrides (original). Empty/script-generated feedback
    is excluded from all counts.
    """
    # Fetch all feedback
    all_feedback_result = await session.execute(select(LabelingFeedback))
    all_feedback = all_feedback_result.scalars().all()

    # Filter to meaningful feedback only
    meaningful = [fb for fb in all_feedback if _is_meaningful_feedback(fb)]

    total = len(meaningful)
    unique_intakes = len({fb.intake_id for fb in meaningful})
    by_evaluator: dict[str, int] = {}
    for fb in meaningful:
        by_evaluator[fb.evaluator] = by_evaluator.get(fb.evaluator, 0) + 1

    # Compute stats with and without overrides
    def _aggregate(use_overrides: bool) -> dict[str, Any]:
        with_issues = 0
        with_severe = 0
        transcript_issues = 0
        summary_issues = 0
        plan_issues = 0
        severity_dist: dict[str, int] = {s.value: 0 for s in SeverityLevel}
        by_type: dict[str, int] = {}

        for fb in meaningful:
            rs = _compute_record_stats(fb, use_overrides)

            if rs["has_transcript_issue"]:
                transcript_issues += 1
            if rs["has_summary_issue"]:
                summary_issues += 1
            if rs["has_plan_issue"]:
                plan_issues += 1
            if rs["has_any_issue"]:
                with_issues += 1
            if rs["has_severe"]:
                with_severe += 1

            for sev in rs["all_severities"]:
                if sev in severity_dist:
                    severity_dist[sev] += 1

            for criterion, count in rs["issue_types"].items():
                by_type[criterion] = by_type.get(criterion, 0) + count

        return {
            "records_with_issues": with_issues,
            "records_with_severe_issues": with_severe,
            "by_component": {
                "transcript": transcript_issues,
                "summary": summary_issues,
                "plan": plan_issues,
            },
            "by_issue_type": by_type,
            "severity_distribution": severity_dist,
        }

    with_overrides = _aggregate(use_overrides=True)
    without_overrides = _aggregate(use_overrides=False)

    return {
        "total_feedback_records": total,
        "unique_intakes_labeled": unique_intakes,
        "by_evaluator": by_evaluator,
        # Primary stats (with overrides applied)
        "records_with_issues": with_overrides["records_with_issues"],
        "records_with_severe_issues": with_overrides["records_with_severe_issues"],
        "by_component": with_overrides["by_component"],
        "by_issue_type": with_overrides["by_issue_type"],
        "severity_distribution": with_overrides["severity_distribution"],
        # Original stats (without overrides)
        "records_with_issues_original": without_overrides["records_with_issues"],
        "records_with_severe_issues_original": without_overrides["records_with_severe_issues"],
        "by_component_original": without_overrides["by_component"],
        "by_issue_type_original": without_overrides["by_issue_type"],
        "severity_distribution_original": without_overrides["severity_distribution"],
    }
