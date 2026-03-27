"""API routes for labeling."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth import require_auth
from app.config import settings
from app.database import get_reentry_session, get_labeling_session
from app.models.intake import Intake, IntakeMessage, IntakeStatus, IntakeType
from app.models.labeling_feedback import LabelingFeedback, SeverityLevel
from app.crud.labeling import (
    get_intake_by_id,
    get_intake_messages,
    get_plan_by_intake_id,
    get_plan_asset_by_filename,
    get_plan_generations,
    get_feedback_by_intake_id,
    get_feedback_by_intake_and_evaluator,
    get_feedback_by_id,
    upsert_feedback,
    update_override_feedback,
    get_labeling_stats,
    get_all_feedback,
    get_queue_stats,
    get_evaluator_queue,
    get_recording_transcript,
    get_recording_session_for_intake,
    _highest_severity_for_row,
)

router = APIRouter(dependencies=[Depends(require_auth)])


# ----- Request/Response Models -----


class TranscriptMessage(BaseModel):
    """A single message in the intake transcript."""

    role: str
    content: str
    section: Optional[str] = None
    created_at: datetime


class IssueFeedback(BaseModel):
    """Feedback for a single issue type."""

    severity: Optional[str] = None
    notes: Optional[str] = None
    related_to_transcription: bool = False


class OverallComponentFeedback(BaseModel):
    """Overall feedback for a component (used for summary/plan overall)."""

    factual: IssueFeedback = IssueFeedback()
    tone: IssueFeedback = IssueFeedback()
    other: IssueFeedback = IssueFeedback()


class TranscriptCriterionFeedback(BaseModel):
    """Feedback for a single transcript criterion."""

    severity: Optional[str] = None  # null, none, mild, severe
    notes: Optional[str] = None


class TranscriptDetailFeedback(BaseModel):
    """Detailed feedback for transcript criteria."""

    danger_indication: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    toxic_language: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    inappropriate_topic: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    user_frustration: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    major_output_error: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    chatbot_misunderstanding: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    looping_questions: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    skipping_questions: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    other: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    # Audio-only fields
    number_of_speakers: Optional[str] = None
    audio_quality: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    transcription_quality: TranscriptCriterionFeedback = TranscriptCriterionFeedback()
    audio_other_notes: Optional[str] = None


class SummaryNeedsRisksFeedback(BaseModel):
    """Feedback for a single needs/risks category."""

    facts_incorrect: IssueFeedback = IssueFeedback()
    facts_missing: IssueFeedback = IssueFeedback()
    tone_issues: IssueFeedback = IssueFeedback()
    other: IssueFeedback = IssueFeedback()


class SummaryNeedsSectionFeedback(BaseModel):
    """Feedback for priority/longer-term needs sections."""

    needs_not_justified: IssueFeedback = IssueFeedback()
    needs_missing: IssueFeedback = IssueFeedback()
    other: IssueFeedback = IssueFeedback()


class SummaryFinalThoughtsFeedback(BaseModel):
    """Feedback for final thoughts section."""

    statements_not_supported: IssueFeedback = IssueFeedback()
    other: IssueFeedback = IssueFeedback()


class SummaryDetailFeedback(BaseModel):
    """Detailed feedback for summary sections."""

    needs_risks_overview: dict[str, SummaryNeedsRisksFeedback] = {}
    priority_needs: SummaryNeedsSectionFeedback = SummaryNeedsSectionFeedback()
    longer_term_needs: SummaryNeedsSectionFeedback = SummaryNeedsSectionFeedback()
    final_thoughts: SummaryFinalThoughtsFeedback = SummaryFinalThoughtsFeedback()


class PlanSectionFeedback(BaseModel):
    """Feedback for a single action plan section."""

    recommendation_groundedness: IssueFeedback = IssueFeedback()
    unsound_recommendation: IssueFeedback = IssueFeedback()
    obvious_incoherence: IssueFeedback = IssueFeedback()
    missing_incomplete_sections: IssueFeedback = IssueFeedback()
    other: IssueFeedback = IssueFeedback()


class PlanDetailFeedback(BaseModel):
    """Detailed feedback for action plan sections."""

    sections: dict[str, PlanSectionFeedback] = {}


class LabelingFeedbackResponse(BaseModel):
    """Response model for labeling feedback."""

    id: UUID
    created_at: datetime
    updated_at: datetime
    intake_id: UUID
    plan_id: Optional[UUID] = None
    evaluator: str
    # New structure for transcript feedback
    transcript_feedback: Optional[TranscriptDetailFeedback] = None
    # Summary/Plan still use the overall component feedback
    summary_feedback: OverallComponentFeedback = OverallComponentFeedback()
    plan_feedback: OverallComponentFeedback = OverallComponentFeedback()
    summary_detail_feedback: Optional[SummaryDetailFeedback] = None
    plan_detail_feedback: Optional[PlanDetailFeedback] = None
    # Override feedback (reviewer overrides of original labels)
    override_feedback: Optional[dict[str, Any]] = None
    # Legacy fields
    transcript_needs_review: bool = False
    transcript_severity: str = SeverityLevel.NONE.value
    transcript_notes: Optional[str] = None
    summary_needs_review: bool = False
    summary_severity: str = SeverityLevel.NONE.value
    summary_notes: Optional[str] = None
    plan_needs_review: bool = False
    plan_severity: str = SeverityLevel.NONE.value
    plan_notes: Optional[str] = None
    overall_notes: Optional[str] = None


class RecordListItem(BaseModel):
    """Summary of a record for list view."""

    intake_id: UUID
    plan_id: Optional[UUID] = None
    client_pseudo_id: Optional[str] = None
    intake_created_at: datetime
    intake_completed_at: Optional[datetime] = None
    intake_status: str
    has_feedback: bool
    feedback_evaluators: list[str]


class RecordDetail(BaseModel):
    """Full record details for labeling view."""

    intake_id: UUID
    plan_id: Optional[UUID] = None
    client_pseudo_id: Optional[str] = None
    intake_created_at: datetime
    completed_at: Optional[datetime] = None
    state_code: Optional[str] = None
    assessment_config_code: Optional[str] = None
    transcript_messages: list[TranscriptMessage]
    summary_markdown: Optional[str] = None
    summary_sections: list = []
    action_plan_markdown: Optional[str] = None
    plan_sections: list = []
    existing_feedback: Optional[LabelingFeedbackResponse] = None
    has_audio: bool = False


class FeedbackSubmission(BaseModel):
    """Request model for submitting feedback."""

    intake_id: UUID
    plan_id: Optional[UUID] = None
    evaluator: str
    # New structure for transcript feedback
    transcript_feedback: Optional[TranscriptDetailFeedback] = None
    summary_feedback: Optional[OverallComponentFeedback] = None
    plan_feedback: Optional[OverallComponentFeedback] = None
    summary_detail_feedback: Optional[SummaryDetailFeedback] = None
    plan_detail_feedback: Optional[PlanDetailFeedback] = None
    # Legacy fields
    transcript_needs_review: bool = False
    transcript_severity: str = SeverityLevel.NONE.value
    transcript_notes: Optional[str] = None
    summary_needs_review: bool = False
    summary_severity: str = SeverityLevel.NONE.value
    summary_notes: Optional[str] = None
    plan_needs_review: bool = False
    plan_severity: str = SeverityLevel.NONE.value
    plan_notes: Optional[str] = None
    overall_notes: Optional[str] = None


class OverrideSubmission(BaseModel):
    """Request model for submitting override feedback."""

    evaluator: str
    notes: Optional[str] = None
    transcript_detail_feedback: Optional[dict[str, Any]] = None
    summary_detail_feedback: Optional[dict[str, Any]] = None
    plan_detail_feedback: Optional[dict[str, Any]] = None
    summary_feedback: Optional[dict[str, Any]] = None
    plan_feedback: Optional[dict[str, Any]] = None


class FeedbackListItem(BaseModel):
    """A feedback record in the feedback browser."""

    id: UUID
    intake_id: UUID
    evaluator: str
    created_at: datetime
    updated_at: datetime
    highest_severity: str
    components_with_issues: list[str]
    overall_notes: Optional[str] = None


class FeedbackListResponse(BaseModel):
    """Paginated feedback list response."""

    items: list[FeedbackListItem]
    total: int
    page: int
    size: int
    pages: int


class OverdueSnapshot(BaseModel):
    period_end: str
    overdue_count: int
    completed_count: int


class EvaluatorQueueStats(BaseModel):
    evaluator: str
    queue_size: int
    overdue_count: int
    weekly_snapshots: list[OverdueSnapshot]


class AggregateWeeklySnapshot(BaseModel):
    period_end: str
    overdue_count: int
    eligible_count: int
    overdue_rate: float
    completed_count: int
    max_days_overdue: Optional[int] = None
    avg_days_overdue: Optional[float] = None


class QueueStatsResponse(BaseModel):
    evaluators: list[EvaluatorQueueStats]
    aggregate_snapshots: list[AggregateWeeklySnapshot]
    as_of: str


class QueueItem(BaseModel):
    intake_id: str
    completed_dt: str
    is_overdue: bool


class LabelingStatsResponse(BaseModel):
    """Response model for labeling statistics."""

    total_feedback_records: int
    unique_intakes_labeled: int
    records_with_issues: int
    records_with_severe_issues: int
    by_evaluator: dict[str, int]
    by_component: dict[str, int]
    by_issue_type: dict[str, int]
    severity_distribution: dict[str, int]
    # Original stats (without overrides applied)
    records_with_issues_original: int
    records_with_severe_issues_original: int
    by_component_original: dict[str, int]
    by_issue_type_original: dict[str, int]
    severity_distribution_original: dict[str, int]


class PaginatedResponse(BaseModel):
    """Paginated response."""

    items: list[RecordListItem]
    total: int
    page: int
    size: int
    pages: int


# ----- Helper Functions -----


def feedback_to_response(feedback: LabelingFeedback) -> LabelingFeedbackResponse:
    """Convert a LabelingFeedback model to response format."""
    # Transcript feedback from JSON column
    transcript_feedback = None
    if feedback.transcript_detail_feedback:
        transcript_feedback = TranscriptDetailFeedback(**feedback.transcript_detail_feedback)

    summary_feedback = OverallComponentFeedback(
        factual=IssueFeedback(
            severity=feedback.summary_factual_severity,
            notes=feedback.summary_factual_notes,
        ),
        tone=IssueFeedback(
            severity=feedback.summary_tone_severity,
            notes=feedback.summary_tone_notes,
        ),
        other=IssueFeedback(
            severity=feedback.summary_other_severity,
            notes=feedback.summary_other_notes,
        ),
    )

    plan_feedback = OverallComponentFeedback(
        factual=IssueFeedback(
            severity=feedback.plan_factual_severity,
            notes=feedback.plan_factual_notes,
        ),
        tone=IssueFeedback(
            severity=feedback.plan_tone_severity,
            notes=feedback.plan_tone_notes,
        ),
        other=IssueFeedback(
            severity=feedback.plan_other_severity,
            notes=feedback.plan_other_notes,
        ),
    )

    summary_detail = None
    if feedback.summary_detail_feedback:
        summary_detail = SummaryDetailFeedback(**feedback.summary_detail_feedback)

    plan_detail = None
    if feedback.plan_detail_feedback:
        plan_detail = PlanDetailFeedback(**feedback.plan_detail_feedback)

    return LabelingFeedbackResponse(
        id=feedback.id,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
        intake_id=feedback.intake_id,
        plan_id=feedback.plan_id,
        evaluator=feedback.evaluator,
        transcript_feedback=transcript_feedback,
        summary_feedback=summary_feedback,
        plan_feedback=plan_feedback,
        summary_detail_feedback=summary_detail,
        plan_detail_feedback=plan_detail,
        override_feedback=feedback.override_feedback,
        transcript_needs_review=feedback.transcript_needs_review,
        transcript_severity=feedback.transcript_severity,
        transcript_notes=feedback.transcript_notes,
        summary_needs_review=feedback.summary_needs_review,
        summary_severity=feedback.summary_severity,
        summary_notes=feedback.summary_notes,
        plan_needs_review=feedback.plan_needs_review,
        plan_severity=feedback.plan_severity,
        plan_notes=feedback.plan_notes,
        overall_notes=feedback.overall_notes,
    )


async def check_and_send_severe_alert(
    submission: FeedbackSubmission,
    intake: Intake,
) -> None:
    """Check if any severity field is 'severe' and send Slack alert if so."""
    if not settings.slack_webhook_url:
        return

    severe_issues: list[str] = []

    # Check transcript feedback (new structure)
    if submission.transcript_feedback:
        tf = submission.transcript_feedback
        criteria_to_check = [
            ("Danger Indication", tf.danger_indication),
            ("Toxic Language", tf.toxic_language),
            ("Inappropriate Topic", tf.inappropriate_topic),
            ("User Frustration", tf.user_frustration),
            ("Major Output Error", tf.major_output_error),
            ("Chatbot Misunderstanding", tf.chatbot_misunderstanding),
            ("Looping Questions", tf.looping_questions),
            ("Skipping Questions", tf.skipping_questions),
            ("Other", tf.other),
            ("Audio Quality", tf.audio_quality),
            ("Transcription Quality", tf.transcription_quality),
        ]
        for name, criterion in criteria_to_check:
            if criterion.severity == SeverityLevel.SEVERE.value:
                severe_issues.append(f"Transcript - {name}: {criterion.notes or 'No notes'}")

    if submission.summary_feedback:
        if submission.summary_feedback.factual.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Summary - Factual: {submission.summary_feedback.factual.notes or 'No notes'}")
        if submission.summary_feedback.tone.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Summary - Tone: {submission.summary_feedback.tone.notes or 'No notes'}")
        if submission.summary_feedback.other.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Summary - Other: {submission.summary_feedback.other.notes or 'No notes'}")

    if submission.plan_feedback:
        if submission.plan_feedback.factual.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Plan - Factual: {submission.plan_feedback.factual.notes or 'No notes'}")
        if submission.plan_feedback.tone.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Plan - Tone: {submission.plan_feedback.tone.notes or 'No notes'}")
        if submission.plan_feedback.other.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Plan - Other: {submission.plan_feedback.other.notes or 'No notes'}")

    # Check summary detail feedback
    if submission.summary_detail_feedback:
        for category, fb in submission.summary_detail_feedback.needs_risks_overview.items():
            if fb.facts_incorrect.severity == SeverityLevel.SEVERE.value:
                severe_issues.append(f"Summary Detail ({category}) - Facts Incorrect: {fb.facts_incorrect.notes or 'No notes'}")
            if fb.facts_missing.severity == SeverityLevel.SEVERE.value:
                severe_issues.append(f"Summary Detail ({category}) - Facts Missing: {fb.facts_missing.notes or 'No notes'}")
            if fb.tone_issues.severity == SeverityLevel.SEVERE.value:
                severe_issues.append(f"Summary Detail ({category}) - Tone: {fb.tone_issues.notes or 'No notes'}")

        pn = submission.summary_detail_feedback.priority_needs
        if pn.needs_not_justified.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Priority Needs - Not Justified: {pn.needs_not_justified.notes or 'No notes'}")
        if pn.needs_missing.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Priority Needs - Missing: {pn.needs_missing.notes or 'No notes'}")

        lt = submission.summary_detail_feedback.longer_term_needs
        if lt.needs_not_justified.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Longer-term Needs - Not Justified: {lt.needs_not_justified.notes or 'No notes'}")
        if lt.needs_missing.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Longer-term Needs - Missing: {lt.needs_missing.notes or 'No notes'}")

        ft = submission.summary_detail_feedback.final_thoughts
        if ft.statements_not_supported.severity == SeverityLevel.SEVERE.value:
            severe_issues.append(f"Final Thoughts - Not Supported: {ft.statements_not_supported.notes or 'No notes'}")

    # Check plan detail feedback
    if submission.plan_detail_feedback:
        for section, fb in submission.plan_detail_feedback.sections.items():
            if fb.recommendation_groundedness.severity == SeverityLevel.SEVERE.value:
                severe_issues.append(f"Plan ({section}) - Recommendation Groundedness: {fb.recommendation_groundedness.notes or 'No notes'}")
            if fb.unsound_recommendation.severity == SeverityLevel.SEVERE.value:
                severe_issues.append(f"Plan ({section}) - Unsound Recommendation: {fb.unsound_recommendation.notes or 'No notes'}")
            if fb.obvious_incoherence.severity == SeverityLevel.SEVERE.value:
                severe_issues.append(f"Plan ({section}) - Obvious Incoherence: {fb.obvious_incoherence.notes or 'No notes'}")
            if fb.missing_incomplete_sections.severity == SeverityLevel.SEVERE.value:
                severe_issues.append(f"Plan ({section}) - Missing/Incomplete: {fb.missing_incomplete_sections.notes or 'No notes'}")

    # If any severe issues found, send Slack alert
    if severe_issues:
        client_id = intake.client_pseudo_id or str(submission.intake_id)[:8]
        issues_text = "\n".join(f"• {issue}" for issue in severe_issues)

        message = {
            "text": f"🚨 *Severe Issue Flagged in Labeling*\n\n*Client:* {client_id}\n*Evaluator:* {submission.evaluator}\n*Overall Notes:* {submission.overall_notes or 'None'}\n\n*Severe Issues:*\n{issues_text}",
        }

        try:
            async with httpx.AsyncClient() as client:
                await client.post(settings.slack_webhook_url, json=message)
        except Exception as e:
            print(f"Error sending Slack alert: {e}")


# ----- Endpoints -----


@router.get("/records", response_model=PaginatedResponse)
async def list_records(
    reentry_session: AsyncSession = Depends(get_reentry_session),
    labeling_session: AsyncSession = Depends(get_labeling_session),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = Query(default="completed"),
    evaluator: Optional[str] = Query(default=None),
    unlabeled_only: bool = Query(default=False),
):
    """List completed intakes available for manual labeling."""
    # Build base query for intakes - use the IntakeStatus enum for comparison
    # Sort by oldest first so reviewers see oldest unreviewed records first
    status_enum = IntakeStatus(status) if status else IntakeStatus.COMPLETED
    completed_or_updated = func.coalesce(Intake.completed_at, Intake.updated_at)
    stmt = select(Intake).where(Intake.status == status_enum).order_by(completed_or_updated.asc())

    result = await reentry_session.execute(stmt)
    intakes = result.scalars().all()

    # Build response items with feedback info
    items = []
    for intake in intakes:
        # Feedback comes from labeling database
        feedback_list = await get_feedback_by_intake_id(labeling_session, intake.id)
        feedback_evaluators = [f.evaluator for f in feedback_list]
        has_feedback = len(feedback_list) > 0

        if unlabeled_only:
            # If evaluator specified, filter by whether THIS evaluator has labeled
            if evaluator and evaluator in feedback_evaluators:
                continue
            # If no evaluator specified, filter by whether ANYONE has labeled
            elif not evaluator and has_feedback:
                continue

        # Plan comes from reentry database
        plan = await get_plan_by_intake_id(reentry_session, intake.id)
        plan_id = plan.id if plan else None

        # Use completed_at if available, otherwise fall back to updated_at
        completed_at = intake.completed_at or intake.updated_at

        items.append(
            RecordListItem(
                intake_id=intake.id,
                plan_id=plan_id,
                client_pseudo_id=intake.client_pseudo_id,
                intake_created_at=intake.created_at,
                intake_completed_at=completed_at,
                intake_status=intake.status.value if hasattr(intake.status, 'value') else str(intake.status),
                has_feedback=has_feedback,
                feedback_evaluators=feedback_evaluators,
            )
        )

    # Manual pagination
    total = len(items)
    pages = (total + size - 1) // size
    start = (page - 1) * size
    end = start + size
    page_items = items[start:end]

    return PaginatedResponse(
        items=page_items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/records/{intake_id}/audio")
async def get_audio(
    intake_id: UUID,
    reentry_session: AsyncSession = Depends(get_reentry_session),
):
    """Stream the audio file for a transcription intake directly from GCS."""
    from google.cloud import storage as gcs

    recording = await get_recording_session_for_intake(reentry_session, intake_id)
    if not recording or not recording.gcs_bucket_name:
        raise HTTPException(status_code=404, detail="No audio available")

    client = gcs.Client()
    bucket = client.bucket(recording.gcs_bucket_name)
    blob = bucket.blob(f"recordings/{recording.id}/final/final_audio.webm")

    if not blob.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    def generate():
        with blob.open("rb") as f:
            while chunk := f.read(65536):
                yield chunk

    return StreamingResponse(generate(), media_type="audio/webm")


@router.get("/records/{intake_id}", response_model=RecordDetail)
async def get_record_detail(
    intake_id: UUID,
    evaluator: Optional[str] = Query(default=None),
    reentry_session: AsyncSession = Depends(get_reentry_session),
    labeling_session: AsyncSession = Depends(get_labeling_session),
):
    """Get full record details for the labeling view."""
    # Intake data from reentry database
    intake = await get_intake_by_id(reentry_session, intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    messages = await get_intake_messages(reentry_session, intake_id)
    transcript_messages = [
        TranscriptMessage(
            role=msg.from_role,
            content=msg.content,
            section=msg.section,
            created_at=msg.created_at,
        )
        for msg in messages
    ]

    # For recorded intakes with no chat messages, fetch transcript from GCS
    if not transcript_messages and intake.intake_type == IntakeType.TRANSCRIPTION:
        try:
            gcs_turns = await get_recording_transcript(reentry_session, intake_id)
            transcript_messages = [
                TranscriptMessage(
                    role=turn["role"],
                    content=turn["content"],
                    section=None,
                    created_at=intake.created_at,
                )
                for turn in gcs_turns
            ]
        except Exception as e:
            print(f"Warning: Failed to fetch recording transcript from GCS: {e}")

    # Plan data from reentry database
    plan = await get_plan_by_intake_id(reentry_session, intake_id)
    plan_id = None
    summary_markdown = None
    action_plan_markdown = None

    if plan:
        plan_id = plan.id

        summary_asset = await get_plan_asset_by_filename(reentry_session, plan.id, "summary.md")
        if summary_asset and summary_asset.file_blob:
            summary_markdown = summary_asset.file_blob.decode("utf-8")

        gens = await get_plan_generations(reentry_session, plan.id)
        # Filter for generations that have finished (have a finished_at timestamp and markdown_result)
        completed_gens = [g for g in gens if g.finished_at and g.markdown_result]
        if completed_gens:
            completed_gens.sort(key=lambda x: x.finished_at or x.created_at, reverse=True)
            latest_gen = completed_gens[0]
            action_plan_markdown = latest_gen.markdown_result

    # Fetch state_code and code from assessment_config
    state_code = None
    assessment_config_code = None
    if intake.assessment_config_id:
        from app.models.intake import AssessmentConfig
        config_result = await reentry_session.execute(
            select(AssessmentConfig.state_code, AssessmentConfig.code)
            .where(AssessmentConfig.id == intake.assessment_config_id)
        )
        row = config_result.one_or_none()
        state_code = row.state_code if row else None
        assessment_config_code = row.code if row else None

    # Check if audio is available for transcription intakes
    has_audio = False
    if intake.intake_type == IntakeType.TRANSCRIPTION:
        recording = await get_recording_session_for_intake(reentry_session, intake_id)
        has_audio = recording is not None and bool(recording.gcs_bucket_name)

    # Feedback from labeling database
    existing_feedback = None
    if evaluator:
        feedback = await get_feedback_by_intake_and_evaluator(labeling_session, intake_id, evaluator)
        if feedback:
            existing_feedback = feedback_to_response(feedback)

    return RecordDetail(
        intake_id=intake.id,
        plan_id=plan_id,
        client_pseudo_id=intake.client_pseudo_id,
        intake_created_at=intake.created_at,
        completed_at=intake.completed_at,
        state_code=state_code,
        assessment_config_code=assessment_config_code,
        transcript_messages=transcript_messages,
        summary_markdown=summary_markdown,
        summary_sections=[],
        action_plan_markdown=action_plan_markdown,
        plan_sections=[],
        existing_feedback=existing_feedback,
        has_audio=has_audio,
    )


@router.post("/feedback", response_model=LabelingFeedbackResponse)
async def submit_feedback(
    submission: FeedbackSubmission,
    reentry_session: AsyncSession = Depends(get_reentry_session),
    labeling_session: AsyncSession = Depends(get_labeling_session),
):
    """Submit or update labeling feedback for a record."""
    # Verify intake exists in reentry database
    intake = await get_intake_by_id(reentry_session, submission.intake_id)
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    feedback_data: dict[str, Any] = {
        "plan_id": submission.plan_id,
        "transcript_needs_review": submission.transcript_needs_review,
        "transcript_severity": submission.transcript_severity,
        "transcript_notes": submission.transcript_notes,
        "summary_needs_review": submission.summary_needs_review,
        "summary_severity": submission.summary_severity,
        "summary_notes": submission.summary_notes,
        "plan_needs_review": submission.plan_needs_review,
        "plan_severity": submission.plan_severity,
        "plan_notes": submission.plan_notes,
        "overall_notes": submission.overall_notes,
    }

    if submission.transcript_feedback:
        feedback_data["transcript_detail_feedback"] = submission.transcript_feedback.model_dump()

    if submission.summary_feedback:
        feedback_data["summary_factual_severity"] = submission.summary_feedback.factual.severity
        feedback_data["summary_factual_notes"] = submission.summary_feedback.factual.notes
        feedback_data["summary_tone_severity"] = submission.summary_feedback.tone.severity
        feedback_data["summary_tone_notes"] = submission.summary_feedback.tone.notes
        feedback_data["summary_other_severity"] = submission.summary_feedback.other.severity
        feedback_data["summary_other_notes"] = submission.summary_feedback.other.notes

    if submission.plan_feedback:
        feedback_data["plan_factual_severity"] = submission.plan_feedback.factual.severity
        feedback_data["plan_factual_notes"] = submission.plan_feedback.factual.notes
        feedback_data["plan_tone_severity"] = submission.plan_feedback.tone.severity
        feedback_data["plan_tone_notes"] = submission.plan_feedback.tone.notes
        feedback_data["plan_other_severity"] = submission.plan_feedback.other.severity
        feedback_data["plan_other_notes"] = submission.plan_feedback.other.notes

    if submission.summary_detail_feedback:
        feedback_data["summary_detail_feedback"] = submission.summary_detail_feedback.model_dump()

    if submission.plan_detail_feedback:
        feedback_data["plan_detail_feedback"] = submission.plan_detail_feedback.model_dump()

    # Save feedback to labeling database
    feedback = await upsert_feedback(
        labeling_session,
        intake_id=submission.intake_id,
        evaluator=submission.evaluator,
        data=feedback_data,
    )

    await check_and_send_severe_alert(submission, intake)

    return feedback_to_response(feedback)


@router.post("/feedback/{feedback_id}/override", response_model=LabelingFeedbackResponse)
async def submit_override(
    feedback_id: UUID,
    submission: OverrideSubmission,
    labeling_session: AsyncSession = Depends(get_labeling_session),
):
    """Submit override feedback for an existing feedback record."""
    override_data = {
        "evaluator": submission.evaluator,
        "updated_at": datetime.utcnow().isoformat(),
    }
    if submission.notes is not None:
        override_data["notes"] = submission.notes
    if submission.transcript_detail_feedback is not None:
        override_data["transcript_detail_feedback"] = submission.transcript_detail_feedback
    if submission.summary_detail_feedback is not None:
        override_data["summary_detail_feedback"] = submission.summary_detail_feedback
    if submission.plan_detail_feedback is not None:
        override_data["plan_detail_feedback"] = submission.plan_detail_feedback
    if submission.summary_feedback is not None:
        override_data["summary_feedback"] = submission.summary_feedback
    if submission.plan_feedback is not None:
        override_data["plan_feedback"] = submission.plan_feedback

    feedback = await update_override_feedback(labeling_session, feedback_id, override_data)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback record not found")

    return feedback_to_response(feedback)


@router.get("/feedback/all", response_model=FeedbackListResponse)
async def list_all_feedback(
    labeling_session: AsyncSession = Depends(get_labeling_session),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    evaluator: Optional[str] = Query(default=None),
    has_issues: Optional[bool] = Query(default=None),
    intake_id: Optional[UUID] = Query(default=None),
):
    """List all feedback records with optional filtering."""
    feedback_list, total = await get_all_feedback(
        labeling_session,
        page=page,
        size=size,
        evaluator=evaluator,
        has_issues=has_issues,
        intake_id=intake_id,
    )

    items = []
    for fb in feedback_list:
        # Determine which components have issues
        components: list[str] = []

        # Check transcript from JSON column
        if fb.transcript_detail_feedback:
            td = fb.transcript_detail_feedback
            transcript_criteria = [
                "danger_indication", "toxic_language", "inappropriate_topic",
                "user_frustration", "major_output_error", "chatbot_misunderstanding",
                "looping_questions", "skipping_questions", "other",
                "audio_quality", "transcription_quality"
            ]
            for criterion in transcript_criteria:
                criterion_data = td.get(criterion, {})
                if isinstance(criterion_data, dict) and criterion_data.get("severity", "none") != "none":
                    components.append("transcript")
                    break

        # Check summary (still uses individual columns)
        if any(
            getattr(fb, f) != SeverityLevel.NONE.value
            for f in ["summary_factual_severity", "summary_tone_severity", "summary_other_severity"]
        ):
            components.append("summary")

        # Check plan (still uses individual columns for overall, but also check detail JSON)
        plan_has_issues = any(
            getattr(fb, f) != SeverityLevel.NONE.value
            for f in ["plan_factual_severity", "plan_tone_severity", "plan_other_severity"]
        )
        if not plan_has_issues and fb.plan_detail_feedback:
            # Check plan detail JSON with new field names
            for section_data in fb.plan_detail_feedback.get("sections", {}).values():
                for field in ["recommendation_groundedness", "unsound_recommendation", "obvious_incoherence", "missing_incomplete_sections"]:
                    field_data = section_data.get(field, {})
                    if isinstance(field_data, dict) and field_data.get("severity", "none") != "none":
                        plan_has_issues = True
                        break
                if plan_has_issues:
                    break
        if plan_has_issues:
            components.append("plan")

        items.append(
            FeedbackListItem(
                id=fb.id,
                intake_id=fb.intake_id,
                evaluator=fb.evaluator,
                created_at=fb.created_at,
                updated_at=fb.updated_at,
                highest_severity=_highest_severity_for_row(fb),
                components_with_issues=components,
                overall_notes=fb.overall_notes,
            )
        )

    pages = (total + size - 1) // size if total > 0 else 1
    return FeedbackListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/feedback/{intake_id}", response_model=list[LabelingFeedbackResponse])
async def get_feedback(
    intake_id: UUID,
    evaluator: Optional[str] = Query(default=None),
    labeling_session: AsyncSession = Depends(get_labeling_session),
):
    """Get all feedback for a specific intake."""
    # Feedback from labeling database
    if evaluator:
        feedback = await get_feedback_by_intake_and_evaluator(labeling_session, intake_id, evaluator)
        if not feedback:
            return []
        return [feedback_to_response(feedback)]

    feedback_list = await get_feedback_by_intake_id(labeling_session, intake_id)
    return [feedback_to_response(f) for f in feedback_list]


@router.get("/stats", response_model=LabelingStatsResponse)
async def get_stats(labeling_session: AsyncSession = Depends(get_labeling_session)):
    """Get labeling progress statistics."""
    # Stats from labeling database
    stats = await get_labeling_stats(labeling_session)
    return LabelingStatsResponse(**stats)


@router.get("/queue", response_model=QueueStatsResponse)
async def get_queue(
    reentry_session: AsyncSession = Depends(get_reentry_session),
    labeling_session: AsyncSession = Depends(get_labeling_session),
):
    """Get per-evaluator queue sizes, overdue counts, and historical snapshots."""
    result = await get_queue_stats(reentry_session, labeling_session, settings.evaluators_list)
    return QueueStatsResponse(**result)


@router.get("/queue/{evaluator:path}", response_model=list[QueueItem])
async def get_evaluator_queue_detail(
    evaluator: str,
    reentry_session: AsyncSession = Depends(get_reentry_session),
    labeling_session: AsyncSession = Depends(get_labeling_session),
):
    """Get the full unlabeled queue for a specific evaluator."""
    items = await get_evaluator_queue(reentry_session, labeling_session, evaluator)
    return [QueueItem(**item) for item in items]
