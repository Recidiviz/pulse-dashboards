"""Model for labeling feedback."""

from datetime import datetime
from enum import StrEnum
from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlmodel import JSON, Field, SQLModel


class SeverityLevel(StrEnum):
    """Severity levels for feedback."""

    NONE = "none"
    MILD = "mild"
    LOW = "low"
    MED = "med"
    SEVERE = "severe"


class LabelingFeedback(SQLModel, table=True):
    """Model for storing labeling feedback."""

    __tablename__ = "labeling_feedback"
    __table_args__ = (
        UniqueConstraint("intake_id", "evaluator", name="uq_labeling_feedback_intake_evaluator"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Note: No foreign key constraints since intake/plan are in a separate database
    intake_id: UUID = Field(index=True)
    plan_id: Optional[UUID] = Field(index=True, default=None)
    evaluator: str = Field(index=True)

    # Overall feedback - Transcript
    transcript_factual_severity: str = Field(default=SeverityLevel.NONE.value)
    transcript_factual_notes: Optional[str] = None
    transcript_tone_severity: str = Field(default=SeverityLevel.NONE.value)
    transcript_tone_notes: Optional[str] = None
    transcript_other_severity: str = Field(default=SeverityLevel.NONE.value)
    transcript_other_notes: Optional[str] = None

    # Overall feedback - Summary
    summary_factual_severity: str = Field(default=SeverityLevel.NONE.value)
    summary_factual_notes: Optional[str] = None
    summary_tone_severity: str = Field(default=SeverityLevel.NONE.value)
    summary_tone_notes: Optional[str] = None
    summary_other_severity: str = Field(default=SeverityLevel.NONE.value)
    summary_other_notes: Optional[str] = None

    # Overall feedback - Plan
    plan_factual_severity: str = Field(default=SeverityLevel.NONE.value)
    plan_factual_notes: Optional[str] = None
    plan_tone_severity: str = Field(default=SeverityLevel.NONE.value)
    plan_tone_notes: Optional[str] = None
    plan_other_severity: str = Field(default=SeverityLevel.NONE.value)
    plan_other_notes: Optional[str] = None

    # Detailed feedback stored as JSON
    transcript_detail_feedback: Optional[dict[str, Any]] = Field(sa_type=JSON, default=None)
    summary_detail_feedback: Optional[dict[str, Any]] = Field(sa_type=JSON, default=None)
    plan_detail_feedback: Optional[dict[str, Any]] = Field(sa_type=JSON, default=None)

    # Legacy fields (for backwards compatibility)
    transcript_needs_review: bool = Field(default=False)
    transcript_severity: str = Field(default=SeverityLevel.NONE.value)
    transcript_notes: Optional[str] = None
    summary_needs_review: bool = Field(default=False)
    summary_severity: str = Field(default=SeverityLevel.NONE.value)
    summary_notes: Optional[str] = None
    plan_needs_review: bool = Field(default=False)
    plan_severity: str = Field(default=SeverityLevel.NONE.value)
    plan_notes: Optional[str] = None
    overall_notes: Optional[str] = None

    # Override feedback (JSONB) - stores reviewer overrides of original labels
    override_feedback: Optional[dict[str, Any]] = Field(sa_type=JSON, default=None)
