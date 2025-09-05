from unittest.mock import AsyncMock, patch

import pytest
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.intake import (
    ClientIntakeSection,
    CompletionStatus,
    Intake,
    IntakeSection,
    IntakeStatus,
    IntakeType,
)
from app.tests.test_fixtures.intake_sections import (
    create_test_section,
    create_test_sections,
)
from app.utils.intake.constants import COMPLETION_SECTION


@pytest.mark.asyncio
async def test_update_status_basic(
    async_session: AsyncSession, seed_default_sections, mock_clientdata_service
):
    """Test basic status update functionality."""
    # Create a test intake with CREATED status using a client ID that exists in mock data
    conversation_intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.CREATED.value,
        intake_type=IntakeType.CONVERSATION.value,
    )
    async_session.add(conversation_intake)
    await async_session.commit()
    await async_session.refresh(conversation_intake)

    # Update the status to IN_PROGRESS
    updated_intake = await conversation_intake.update_status(
        async_session, IntakeStatus.IN_PROGRESS
    )

    # Verify the status was updated
    assert updated_intake.status == IntakeStatus.IN_PROGRESS.value

    # Check that client sections were created
    sections_count = await count_sections(async_session, conversation_intake)
    assert sections_count > 0

    # Transncription intake should not create sections
    transcription_intake = Intake(
        client_pseudo_id="client-002",
        status=IntakeStatus.CREATED.value,
        intake_type=IntakeType.TRANSCRIPTION.value,
    )
    async_session.add(transcription_intake)
    await async_session.commit()
    await async_session.refresh(transcription_intake)

    # Update the status to IN_PROGRESS
    updated_intake = await transcription_intake.update_status(
        async_session, IntakeStatus.IN_PROGRESS
    )

    # Verify the status was updated
    assert updated_intake.status == IntakeStatus.IN_PROGRESS.value

    # Check that client sections were not created
    sections_count = await count_sections(async_session, transcription_intake)
    assert sections_count == 0


@pytest.mark.asyncio
async def test_update_status_idempotent(async_session, mock_clientdata_service):
    """Test that updating to the same status does nothing."""
    # Create a test intake with IN_PROGRESS status
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.IN_PROGRESS.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Update to the same status
    updated_intake = await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)

    # Verify nothing changed
    assert updated_intake.id == intake.id
    assert updated_intake.status == IntakeStatus.IN_PROGRESS.value


@pytest.mark.asyncio
async def test_prevent_going_back_to_created(async_session, mock_clientdata_service):
    """Test that an intake cannot go back to CREATED state once it has moved beyond it."""
    # Create a test intake with IN_PROGRESS status
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.IN_PROGRESS.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Try to update back to CREATED
    with pytest.raises(ValueError) as excinfo:
        await intake.update_status(async_session, IntakeStatus.CREATED)

    # Verify the correct error message
    assert "Cannot change intake status from in_progress back to created" in str(
        excinfo.value
    )

    # Verify status didn't change
    await async_session.refresh(intake)
    assert intake.status == IntakeStatus.IN_PROGRESS.value


@pytest.mark.asyncio
async def test_completed_status_triggers_assessment(
    mock_clientdata_service, async_session
):
    """Test that updating to COMPLETED status triggers assessment creation."""
    # Create a test intake with IN_PROGRESS status
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.IN_PROGRESS.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Mock the schedule_assessment method to verify it's called
    with patch.object(
        Intake, "schedule_assessment", AsyncMock(return_value="mock_assessment_id")
    ) as mock_schedule:
        # Update to COMPLETED status
        await intake.update_status(async_session, IntakeStatus.COMPLETED)

        # Verify schedule_assessment was called
        mock_schedule.assert_called_once()


async def count_sections(session, intake):
    res = await session.exec(
        select(func.count())
        .select_from(ClientIntakeSection)
        .where(ClientIntakeSection.intake_id == intake.id)
    )
    return int(res.first())


@pytest.mark.asyncio
async def test_in_progress_populates_sections(
    async_session, seed_default_sections, mock_clientdata_service
):
    """Test that updating to IN_PROGRESS populates sections if needed."""
    # Create a test intake with CREATED status
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.CREATED,
        intake_type=IntakeType.CONVERSATION,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Update to IN_PROGRESS
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)

    # Query for client sections
    section_count = await count_sections(async_session, intake)
    # Verify sections were created
    assert section_count > 0

    # Verify at least one section exists with NOT_STARTED status
    result = await async_session.exec(
        select(ClientIntakeSection)
        .where(
            ClientIntakeSection.intake_id == intake.id,
            ClientIntakeSection.completion_status == CompletionStatus.NOT_STARTED.value,
        )
        .limit(1)
    )
    not_started_section = result.first()
    assert not_started_section is not None


@pytest.mark.asyncio
async def test_dont_duplicate_sections(
    async_session, seed_default_sections, mock_clientdata_service
):
    """Test that updating to IN_PROGRESS doesn't create duplicate sections."""

    # Create a test intake with CREATED status and update to IN_PROGRESS
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.CREATED.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)

    # Count sections
    initial_section_count = await count_sections(async_session, intake)

    # Update to IN_PROGRESS again
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)

    # Count sections again
    new_section_count = await count_sections(async_session, intake)

    # Verify no new sections were created
    assert new_section_count == initial_section_count


@pytest.mark.asyncio
async def test_valid_status_transitions(async_session, mock_clientdata_service):
    # Create test intake sections
    sections = create_test_sections(2)
    async_session.add_all(sections)
    await async_session.commit()

    # Create a test intake
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.CREATED,
    )
    async_session.add(intake)
    await async_session.commit()

    # Mock schedule_assessment for when we test COMPLETED status
    with patch.object(
        Intake, "schedule_assessment", new_callable=AsyncMock
    ) as mock_schedule:
        mock_schedule.return_value = "mock_assessment_id"

        # Update to new status
        updated_intake = await intake.update_status(
            async_session, IntakeStatus.IN_PROGRESS
        )

        # Verify the status was updated
        assert updated_intake.status == IntakeStatus.IN_PROGRESS.value

        # Check that schedule_assessment was not called for this status
        mock_schedule.assert_not_called()


@pytest.mark.asyncio
async def test_first_section_marked_in_progress(
    async_session, seed_default_sections, mock_clientdata_service
):
    """Test that the first section is marked as in-progress when status becomes IN_PROGRESS."""
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.CREATED,
        intake_type=IntakeType.CONVERSATION,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Update to IN_PROGRESS
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)

    # Refresh the intake to get updated relationships
    await async_session.refresh(intake)

    # Verify the first section is marked as in progress with joined query
    result = await async_session.exec(
        select(ClientIntakeSection)
        .join(IntakeSection)
        .where(
            ClientIntakeSection.intake_id == intake.id,
            ClientIntakeSection.completion_status == CompletionStatus.IN_PROGRESS.value,
        )
    )
    in_progress_section = result.first()
    assert in_progress_section is not None

    # Get the intake section title directly from the database
    section_result = await async_session.exec(
        select(IntakeSection).where(
            IntakeSection.id == in_progress_section.intake_section_id
        )
    )
    intake_section = section_result.first()
    assert intake_section is not None

    # Verify the first section is set as current_section in intake
    assert intake.current_section == intake_section.title


@pytest.mark.asyncio
async def test_completion_section_for_terminal_statuses(
    async_session, seed_default_sections, mock_clientdata_service
):
    """Test that terminal statuses set the current_section to COMPLETION_SECTION."""
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.IN_PROGRESS.value,
        intake_type=IntakeType.CONVERSATION.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Mock schedule_assessment to avoid database operations
    with patch.object(Intake, "schedule_assessment", AsyncMock(return_value=None)):
        # Test all terminal statuses
        for status in [
            IntakeStatus.COMPLETED,
            IntakeStatus.ERROR,
        ]:
            # Reset current_section to something else
            intake.current_section = "Test Section"
            async_session.add(intake)
            await async_session.commit()

            # Update to terminal status
            await intake.update_status(async_session, status)

            # Verify current_section is set to COMPLETION_SECTION
            assert intake.current_section == COMPLETION_SECTION


@pytest.mark.asyncio
async def test_update_status_with_no_sections(async_session, mock_clientdata_service):
    """Test that updating to IN_PROGRESS with no sections raises an error."""
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.CREATED,
        intake_type=IntakeType.CONVERSATION,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Try to update to IN_PROGRESS with no sections defined
    with pytest.raises(ValueError) as excinfo:
        await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)

    # Verify the correct error message
    assert "No sections found for assessment type" in str(excinfo.value)


@pytest.mark.asyncio
async def test_update_status_with_no_messages(async_session, mock_clientdata_service):
    """Test that updating to COMPLETED with no messages raises an error with Intakes based-trancriptions"""
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.CREATED,
        intake_type=IntakeType.TRANSCRIPTION,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Try to update to IN_PROGRESS with no sections defined
    with pytest.raises(ValueError) as excinfo:
        await intake.update_status(async_session, IntakeStatus.COMPLETED)

    # Verify the correct error message
    assert "cannot be marked as completed without transcription approved" in str(
        excinfo.value
    )


@pytest.mark.asyncio
async def test_completed_status_idempotent(async_session, mock_clientdata_service):
    """Test that updating to COMPLETED status is idempotent."""
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.COMPLETED.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Mock schedule_assessment to verify it's not called again
    with patch.object(Intake, "schedule_assessment", AsyncMock()) as mock_schedule:
        # Update to COMPLETED again
        await intake.update_status(async_session, IntakeStatus.COMPLETED)

        # Verify schedule_assessment was not called
        mock_schedule.assert_not_called()


@pytest.mark.asyncio
async def test_db_manager_update_status(
    async_session, seed_default_sections, mock_clientdata_service
):
    """Test updating status through the DatabaseManager."""
    from app.utils.intake.db_manager import DatabaseManager

    # Create a test intake
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.CREATED,
        intake_type=IntakeType.CONVERSATION,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Initialize the DatabaseManager with the test session
    db_manager = DatabaseManager(session=async_session)

    # Update status through the manager
    updated_intake = await db_manager.update_intake_status(
        mock_clientdata_service["client_pseudo_id"], IntakeStatus.IN_PROGRESS
    )

    # Verify the update was successful
    assert updated_intake is not None
    assert updated_intake.status == IntakeStatus.IN_PROGRESS.value

    # Verify sections were created
    sections_count = await count_sections(async_session, intake)
    assert sections_count > 0


@pytest.mark.asyncio
async def test_db_manager_update_status_nonexistent_client(async_session):
    """Test updating status for a non-existent client."""
    from app.utils.intake.db_manager import DatabaseManager

    # Initialize the DatabaseManager with the test session
    db_manager = DatabaseManager(session=async_session)

    # Try to update a non-existent client
    updated_intake = await db_manager.update_intake_status(
        "nonexistent_client", IntakeStatus.IN_PROGRESS
    )

    # Verify the update failed and returned None
    assert updated_intake is None


@pytest.mark.asyncio
async def test_all_transition_combinations(
    async_session, seed_default_sections, mock_clientdata_service
):
    """Test various status transitions between all possible statuses."""
    # Setup - create intake with CREATED status
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.CREATED,
        intake_type=IntakeType.CONVERSATION,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # These are the transitions we'll test - each tuple represents (from_status, to_status, should_succeed)
    with patch.object(
        Intake, "schedule_assessment", AsyncMock(return_value="mock-id")
    ) as mock_schedule:
        # Define all valid state transitions
        transitions = [
            # From CREATED
            (IntakeStatus.CREATED, IntakeStatus.IN_PROGRESS, True),
            (IntakeStatus.CREATED, IntakeStatus.ERROR, True),
            # From IN_PROGRESS
            (IntakeStatus.IN_PROGRESS, IntakeStatus.COMPLETED, True),
            (IntakeStatus.IN_PROGRESS, IntakeStatus.ERROR, True),
            (IntakeStatus.IN_PROGRESS, IntakeStatus.CREATED, False),  # Should fail
            # From terminal states to others - all valid except back to CREATED
            (IntakeStatus.COMPLETED, IntakeStatus.ERROR, True),
            (IntakeStatus.COMPLETED, IntakeStatus.CREATED, False),  # Should fail
        ]

        for from_status, to_status, should_succeed in transitions:
            # Reset intake to the from_status
            intake.status = from_status
            async_session.add(intake)
            await async_session.commit()
            await async_session.refresh(intake)

            # For IN_PROGRESS status, ensure sections exist
            if from_status == IntakeStatus.IN_PROGRESS:
                # Only seed sections if they don't exist
                section_count = await count_sections(async_session, intake)
                if section_count == 0:
                    # Add first section as IN_PROGRESS
                    section = ClientIntakeSection(
                        intake_id=intake.id,
                        intake_section_id=seed_default_sections[0].id,
                        completion_status=CompletionStatus.IN_PROGRESS.value,
                        is_active=True,
                        order=0,
                    )
                    async_session.add(section)
                    await async_session.commit()

            # Try the transition
            if should_succeed:
                # Should succeed
                await intake.update_status(async_session, to_status)
                await async_session.refresh(intake)
                assert intake.status == to_status.value

                # For COMPLETED status, verify assessment scheduling
                if to_status == IntakeStatus.COMPLETED:
                    mock_schedule.assert_called()
                    mock_schedule.reset_mock()
            else:
                # Should fail
                with pytest.raises(ValueError):
                    await intake.update_status(async_session, to_status)
                await async_session.refresh(intake)
                assert intake.status == from_status.value


# Tests for the next_section method


@pytest.mark.asyncio
async def test_next_section_basic(async_session, mock_clientdata_service):
    """Test the basic functionality of next_section - moving to the next section."""
    # Create some intake sections first
    sections = create_test_sections(3)
    section1, section2, section3 = sections
    section1.title = "Section 1"
    section2.title = "Section 2"
    section3.title = "Section 3"
    async_session.add_all([section1, section2, section3])
    await async_session.commit()

    # Get the sections with their IDs
    for section in [section1, section2, section3]:
        await async_session.refresh(section)

    # Create intake with multiple sections
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.IN_PROGRESS.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create client intake sections
    sections = []
    for i, section_model in enumerate([section1, section2, section3]):
        client_section = ClientIntakeSection(
            intake_id=intake.id,
            intake_section_id=section_model.id,
            is_active=True,
            order=i,
            completion_status=CompletionStatus.NOT_STARTED.value
            if i > 0
            else CompletionStatus.IN_PROGRESS.value,
        )
        sections.append(client_section)

    async_session.add_all(sections)
    await async_session.commit()

    # Set current section to the first section
    intake.current_section = section1.title
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Move to the next section
    updated_intake = await intake.next_section(async_session)

    # Verify the first section is now marked as completed
    result = await async_session.exec(
        select(ClientIntakeSection).where(
            ClientIntakeSection.intake_id == intake.id,
            ClientIntakeSection.intake_section_id == section1.id,
        )
    )
    first_section = result.first()
    assert first_section.completion_status == CompletionStatus.COMPLETED.value

    # Verify the second section is now in progress
    result = await async_session.exec(
        select(ClientIntakeSection).where(
            ClientIntakeSection.intake_id == intake.id,
            ClientIntakeSection.intake_section_id == section2.id,
        )
    )
    second_section = result.first()
    assert second_section.completion_status == CompletionStatus.IN_PROGRESS.value

    # Verify the current section has been updated to the second section
    assert updated_intake.current_section == section2.title
    assert updated_intake.status == IntakeStatus.IN_PROGRESS.value


@pytest.mark.asyncio
async def test_next_section_moves_to_completion_section(
    async_session, mock_clientdata_service
):
    """Test that next_section moves to completion section but stays in progress until address is provided."""
    # Create a single section
    section = create_test_section("Only Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake with a single section
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.IN_PROGRESS.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create a single client intake section
    client_section = ClientIntakeSection(
        intake_id=intake.id,
        intake_section_id=section.id,
        is_active=True,
        order=0,
        completion_status=CompletionStatus.IN_PROGRESS.value,
    )
    async_session.add(client_section)
    await async_session.commit()

    # Set current section to the only section
    intake.current_section = section.title
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Move to the next section (which doesn't exist, so should move to completion section)
    updated_intake = await intake.next_section(async_session)

    # Verify the intake moved to completion section but stays in progress
    assert updated_intake.status == IntakeStatus.IN_PROGRESS.value
    assert updated_intake.current_section == COMPLETION_SECTION


@pytest.mark.asyncio
async def test_next_section_no_current_section(async_session, mock_clientdata_service):
    """Test that next_section raises an error when there is no current section."""
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.IN_PROGRESS.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Try to move to the next section with no current section
    with pytest.raises(ValueError) as excinfo:
        await intake.next_section(async_session)

    # Verify the error message
    assert "No current section to advance from" in str(excinfo.value)


@pytest.mark.asyncio
async def test_next_section_invalid_current_section(
    async_session, seed_default_sections, mock_clientdata_service
):
    """Test that next_section raises an error when the current section doesn't exist."""
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.IN_PROGRESS.value,
    )
    intake.current_section = "Non-existent Section"
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Try to move to the next section with an invalid current section
    with pytest.raises(ValueError) as excinfo:
        await intake.next_section(async_session)

    # Verify the error message
    assert "Could not find section" in str(excinfo.value)


@pytest.mark.asyncio
async def test_next_section_skip_incomplete(async_session, mock_clientdata_service):
    """Test next_section correctly skips to the next section even if some are incomplete."""
    # Create sections first
    sections = create_test_sections(3)
    section1, section2, section3 = sections
    section1.title = "Skip Section 1"
    section2.title = "Skip Section 2"
    section3.title = "Skip Section 3"
    async_session.add_all([section1, section2, section3])
    await async_session.commit()

    # Get the sections with their IDs
    for section in [section1, section2, section3]:
        await async_session.refresh(section)

    # Create intake with multiple sections in non-sequential order
    intake = Intake(
        client_pseudo_id=mock_clientdata_service["client_pseudo_id"],
        status=IntakeStatus.IN_PROGRESS.value,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create client intake sections with gaps in order (0, 2, 4)
    sections = []
    for i, section_model in enumerate([section1, section2, section3]):
        client_section = ClientIntakeSection(
            intake_id=intake.id,
            intake_section_id=section_model.id,
            is_active=True,
            order=i * 2,  # Use 0, 2, 4 as order
            completion_status=CompletionStatus.NOT_STARTED.value
            if i > 0
            else CompletionStatus.IN_PROGRESS.value,
        )
        sections.append(client_section)

    async_session.add_all(sections)
    await async_session.commit()

    # Set current section to the first section
    intake.current_section = section1.title
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Move to the next section
    updated_intake = await intake.next_section(async_session)

    # Verify we've moved to the second section (with order value 2)
    assert updated_intake.current_section == section2.title

    # Verify the section with order=2 is now in progress
    result = await async_session.exec(
        select(ClientIntakeSection).where(
            ClientIntakeSection.intake_id == intake.id, ClientIntakeSection.order == 2
        )
    )
    section_with_order_2 = result.first()
    assert section_with_order_2.completion_status == CompletionStatus.IN_PROGRESS.value
