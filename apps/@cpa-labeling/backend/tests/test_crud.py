"""Tests for CRUD operations on the labeling database."""

import pytest
from uuid import uuid4

from app.models.labeling_feedback import LabelingFeedback, SeverityLevel
from app.crud.labeling import (
    get_feedback_by_intake_id,
    get_feedback_by_intake_and_evaluator,
    upsert_feedback,
    get_labeling_stats,
)


@pytest.mark.asyncio
async def test_upsert_feedback_create(test_session):
    """Test creating new feedback via upsert."""
    intake_id = uuid4()
    evaluator = "test_user"

    feedback = await upsert_feedback(
        test_session,
        intake_id=intake_id,
        evaluator=evaluator,
        data={
            "transcript_factual_severity": SeverityLevel.LOW.value,
            "transcript_factual_notes": "Minor issue found",
        },
    )

    assert feedback.id is not None
    assert feedback.intake_id == intake_id
    assert feedback.evaluator == evaluator
    assert feedback.transcript_factual_severity == SeverityLevel.LOW.value
    assert feedback.transcript_factual_notes == "Minor issue found"


@pytest.mark.asyncio
async def test_upsert_feedback_update(test_session):
    """Test updating existing feedback via upsert."""
    intake_id = uuid4()
    evaluator = "test_user"

    # Create initial feedback
    feedback1 = await upsert_feedback(
        test_session,
        intake_id=intake_id,
        evaluator=evaluator,
        data={"transcript_factual_severity": SeverityLevel.LOW.value},
    )
    original_id = feedback1.id

    # Update via upsert
    feedback2 = await upsert_feedback(
        test_session,
        intake_id=intake_id,
        evaluator=evaluator,
        data={"transcript_factual_severity": SeverityLevel.SEVERE.value},
    )

    # Should be the same record
    assert feedback2.id == original_id
    assert feedback2.transcript_factual_severity == SeverityLevel.SEVERE.value


@pytest.mark.asyncio
async def test_get_feedback_by_intake_id(test_session):
    """Test getting all feedback for an intake."""
    intake_id = uuid4()

    # Create feedback from multiple evaluators
    await upsert_feedback(
        test_session,
        intake_id=intake_id,
        evaluator="user1",
        data={},
    )
    await upsert_feedback(
        test_session,
        intake_id=intake_id,
        evaluator="user2",
        data={},
    )

    feedbacks = await get_feedback_by_intake_id(test_session, intake_id)
    assert len(feedbacks) == 2
    evaluators = {f.evaluator for f in feedbacks}
    assert evaluators == {"user1", "user2"}


@pytest.mark.asyncio
async def test_get_feedback_by_intake_and_evaluator(test_session):
    """Test getting feedback for specific intake and evaluator."""
    intake_id = uuid4()

    await upsert_feedback(
        test_session,
        intake_id=intake_id,
        evaluator="user1",
        data={"overall_notes": "Notes from user1"},
    )
    await upsert_feedback(
        test_session,
        intake_id=intake_id,
        evaluator="user2",
        data={"overall_notes": "Notes from user2"},
    )

    feedback = await get_feedback_by_intake_and_evaluator(test_session, intake_id, "user1")
    assert feedback is not None
    assert feedback.evaluator == "user1"
    assert feedback.overall_notes == "Notes from user1"

    # Non-existent evaluator
    no_feedback = await get_feedback_by_intake_and_evaluator(test_session, intake_id, "user3")
    assert no_feedback is None


@pytest.mark.asyncio
async def test_get_labeling_stats(test_session):
    """Test getting labeling statistics."""
    # Create some feedback records
    intake_id_1 = uuid4()
    intake_id_2 = uuid4()

    await upsert_feedback(
        test_session,
        intake_id=intake_id_1,
        evaluator="user1",
        data={"summary_severity": SeverityLevel.LOW.value},
    )
    await upsert_feedback(
        test_session,
        intake_id=intake_id_1,
        evaluator="user2",
        data={"summary_severity": SeverityLevel.SEVERE.value},
    )
    await upsert_feedback(
        test_session,
        intake_id=intake_id_2,
        evaluator="user1",
        data={"summary_severity": SeverityLevel.NONE.value},
    )

    stats = await get_labeling_stats(test_session)

    assert stats["total_feedback_records"] == 3
    assert stats["unique_intakes_labeled"] == 2
    assert stats["by_evaluator"]["user1"] == 2
    assert stats["by_evaluator"]["user2"] == 1


@pytest.mark.asyncio
async def test_feedback_with_json_fields(test_session):
    """Test feedback with JSON detail fields."""
    intake_id = uuid4()

    summary_detail = {
        "needs_risks_overview": {
            "housing": {
                "facts_incorrect": {"severity": "low", "notes": "Minor inaccuracy"},
            }
        }
    }

    plan_detail = {
        "sections": {
            "employment": {
                "facts_not_supported": {"severity": "none", "notes": None},
            }
        }
    }

    feedback = await upsert_feedback(
        test_session,
        intake_id=intake_id,
        evaluator="user1",
        data={
            "summary_detail_feedback": summary_detail,
            "plan_detail_feedback": plan_detail,
        },
    )

    assert feedback.summary_detail_feedback == summary_detail
    assert feedback.plan_detail_feedback == plan_detail
