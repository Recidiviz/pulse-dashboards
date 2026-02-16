# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2025 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================

"""
Test cascade deletes for all top-level database entities.

This module tests that top-level entities (Intake, Plan, IntakeSection)
can be deleted without foreign key constraint errors, ensuring that CASCADE
or SET NULL is properly configured for all relationships.
"""

import pytest
from sqlalchemy import text

from app.core.db import AsyncSession
from app.models.assessment import Assessment
from app.models.base import IntakeType
from app.models.intake import (
    ClientAddress,
    Intake,
    IntakeMessage,
    IntakeStatus,
    IntakeSurvey,
    IntakeToken,
)
from app.models.intake_sections import (
    ClientIntakeSection,
    IntakeSection,
    IntakeSectionRevision,
)
from app.models.models import Plan, PlanAsset, PlanGeneration
from app.models.plan_decision_tree import PlanDecisionTree
from app.models.recording import RecordingChunk, RecordingSession, RecordingStatus


@pytest.mark.asyncio
async def test_conversation_intake_delete(
    async_session: AsyncSession, seed_configs, mock_client_data
):
    """
    Test that deleting a CONVERSATION Intake with all conversation-specific
    relationships succeeds without foreign key errors.

    Creates an Intake with:
    - IntakeMessage
    - IntakeToken
    - ClientAddress
    - IntakeSurvey
    - Assessment
    - Plan
    - ClientIntakeSection
    """
    # Get a valid assessment config
    assessment_config_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]

    # Create an Intake
    intake = Intake(
        client_pseudo_id=mock_client_data["client_pseudo_id"],
        status=IntakeStatus.COMPLETED,
        assessment_config_id=assessment_config_id,
        intake_type=IntakeType.CONVERSATION,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create IntakeMessage
    intake_message = IntakeMessage(
        intake_id=intake.id,
        from_role="client",
        content="Test message",
        section="Test Section",
    )
    async_session.add(intake_message)

    # Create IntakeToken
    intake_token, _ = IntakeToken.generate_token(intake.id)
    async_session.add(intake_token)

    # Create ClientAddress
    client_address = ClientAddress(
        intake_id=intake.id,
        street_address="123 Main St",
        city="Test City",
        state="TS",
    )
    async_session.add(client_address)

    # Create IntakeSurvey
    intake_survey = IntakeSurvey(
        intake_id=intake.id,
        difficulty_rating=3,
    )
    async_session.add(intake_survey)

    # Create Assessment
    assessment = Assessment(
        client_pseudo_id=mock_client_data["client_pseudo_id"],
        intake_id=intake.id,
        assessment_type="test",
    )
    async_session.add(assessment)

    # Create Plan
    plan = Plan(
        client_pseudo_id=mock_client_data["client_pseudo_id"],
        intake_id=intake.id,
    )
    async_session.add(plan)

    # Create ClientIntakeSection (deprecated but still in schema)
    intake_section = IntakeSection(
        title="Test Section",
        description="Test Description",
        required_information="Test Info",
        intake_name="test_intake",
    )
    async_session.add(intake_section)
    await async_session.commit()
    await async_session.refresh(intake_section)

    client_intake_section = ClientIntakeSection(
        intake_id=intake.id,
        intake_section_id=intake_section.id,
        order=1,
    )
    async_session.add(client_intake_section)

    await async_session.commit()

    # Store ID for verification
    intake_id = intake.id

    # Delete the Intake using raw SQL - this should succeed without foreign key errors
    await async_session.execute(
        text("DELETE FROM intake WHERE id = :id"), {"id": intake_id}
    )
    await async_session.commit()

    # Clear session cache to ensure we're reading from DB
    async_session.expire_all()

    # Verify the Intake was deleted
    assert await async_session.get(Intake, intake_id) is None


@pytest.mark.asyncio
async def test_transcription_intake_delete(
    async_session: AsyncSession, seed_configs, mock_client_data
):
    """
    Test that deleting a TRANSCRIPTION Intake with recording-specific
    relationships succeeds without foreign key errors.

    Creates an Intake with:
    - RecordingSession
    - RecordingChunks
    """
    # Get a valid assessment config
    assessment_config_id = seed_configs["assessments"][("US_UT", "CCCI", 0)]

    # Create an Intake
    intake = Intake(
        client_pseudo_id=mock_client_data["client_pseudo_id"],
        status=IntakeStatus.IN_PROGRESS,
        assessment_config_id=assessment_config_id,
        intake_type=IntakeType.TRANSCRIPTION,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create RecordingSession
    recording_session = RecordingSession(
        client_pseudo_id=mock_client_data["client_pseudo_id"],
        intake_id=intake.id,
        status=RecordingStatus.RECORDING,
        last_chunk_timestamp=0,
    )
    async_session.add(recording_session)
    await async_session.commit()
    await async_session.refresh(recording_session)

    # Create RecordingChunks
    chunk1 = RecordingChunk(
        session_id=recording_session.id,
        chunk_index=0,
        timestamp=1000,
    )
    chunk2 = RecordingChunk(
        session_id=recording_session.id,
        chunk_index=1,
        timestamp=2000,
    )
    async_session.add_all([chunk1, chunk2])
    await async_session.commit()

    # Store ID for verification
    intake_id = intake.id

    # Delete the Intake using raw SQL - this should succeed without foreign key errors
    await async_session.execute(
        text("DELETE FROM intake WHERE id = :id"), {"id": intake_id}
    )
    await async_session.commit()

    # Clear session cache to ensure we're reading from DB
    async_session.expire_all()

    # Verify the Intake was deleted
    assert await async_session.get(Intake, intake_id) is None


@pytest.mark.asyncio
async def test_plan_delete(async_session: AsyncSession, mock_client_data):
    """
    Test that deleting a Plan with all related entities
    succeeds without foreign key errors.

    Creates a Plan with:
    - PlanAsset
    - PlanGeneration
    - PlanDecisionTree
    """
    # Create a Plan
    plan = Plan(client_pseudo_id=mock_client_data["client_pseudo_id"])
    async_session.add(plan)
    await async_session.commit()
    await async_session.refresh(plan)

    # Create PlanAsset
    plan_asset = PlanAsset(
        plan_id=plan.id,
        filename="test.pdf",
        file_blob=b"test content",
        mimetype="application/pdf",
    )
    async_session.add(plan_asset)

    # Create PlanGeneration
    plan_generation = PlanGeneration(
        plan_id=plan.id,
        prompt="Test prompt",
        markdown_result="Test result",
    )
    async_session.add(plan_generation)

    # Create PlanDecisionTree (without decision_tree reference to avoid complexity)
    plan_decision_tree = PlanDecisionTree(
        plan_id=plan.id,
        decision_tree_id=None,
    )
    async_session.add(plan_decision_tree)

    await async_session.commit()

    # Store ID for verification
    plan_id = plan.id

    # Delete the Plan using raw SQL - this should succeed without foreign key errors
    await async_session.execute(
        text("DELETE FROM plan WHERE id = :id"), {"id": plan_id}
    )
    await async_session.commit()

    # Clear session cache to ensure we're reading from DB
    async_session.expire_all()

    # Verify the Plan was deleted
    assert await async_session.get(Plan, plan_id) is None


@pytest.mark.asyncio
async def test_intake_section_delete(async_session: AsyncSession):
    """
    Test that deleting an IntakeSection with revisions
    succeeds without foreign key errors.

    Creates an IntakeSection with:
    - IntakeSectionRevision (multiple)
    """
    # Create IntakeSection
    intake_section = IntakeSection(
        title="Test Section",
        description="Test Description",
        required_information="Test Info",
        intake_name="test_intake",
        order=1,
    )
    async_session.add(intake_section)
    await async_session.commit()
    await async_session.refresh(intake_section)

    # Create IntakeSectionRevisions
    revision1 = IntakeSectionRevision(
        intake_section_id=intake_section.id,
        title="Test Section",
        description="Revision 1",
        required_information="Info 1",
        content_hash="hash1",
    )
    revision2 = IntakeSectionRevision(
        intake_section_id=intake_section.id,
        title="Test Section",
        description="Revision 2",
        required_information="Info 2",
        content_hash="hash2",
    )
    async_session.add_all([revision1, revision2])
    await async_session.commit()

    # Store ID for verification
    section_id = intake_section.id

    # Delete the IntakeSection using raw SQL - this should succeed without foreign key errors
    await async_session.execute(
        text("DELETE FROM intakesection WHERE id = :id"), {"id": section_id}
    )
    await async_session.commit()

    # Clear session cache to ensure we're reading from DB
    async_session.expire_all()

    # Verify the IntakeSection was deleted
    assert await async_session.get(IntakeSection, section_id) is None
