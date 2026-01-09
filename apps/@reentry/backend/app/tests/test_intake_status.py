from unittest.mock import AsyncMock, patch

import pytest
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.assessment import get_assessments_by_intake_id
from app.models.assessment import Assessment
from app.models.intake import (
    COMPLETION_SECTION,
    Intake,
    IntakeStatus,
)
from app.models.intake_sections import ClientIntakeSection, CompletionStatus
from app.tests.test_fixtures.intake_sections import (
    create_test_section,
    create_test_sections,
)
from app.utils.config_loader import ConfigLoader


@pytest.mark.asyncio
async def test_update_status_idempotent(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that updating to the same status does nothing."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create a test intake and set to IN_PROGRESS
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)
    await async_session.refresh(intake)

    # Update to the same status
    updated_intake = await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)

    # Verify nothing changed
    assert updated_intake.id == intake.id
    assert updated_intake.status == IntakeStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_prevent_going_back_to_created(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that an intake cannot go back to CREATED state once it has moved beyond it."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create a test intake and set to IN_PROGRESS
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)
    await async_session.refresh(intake)

    # Try to update back to CREATED
    with pytest.raises(ValueError) as excinfo:
        await intake.update_status(async_session, IntakeStatus.CREATED)

    # Verify the correct error message
    assert "Cannot change intake status from in_progress back to created" in str(
        excinfo
    )

    # Verify status didn't change
    await async_session.refresh(intake)
    assert intake.status == IntakeStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_completed_status_triggers_assessment(
    mock_clientdata_service, async_session, seed_configs
):
    """Test that updating to COMPLETED status triggers assessment creation."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create a test intake and set to IN_PROGRESS
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)
    await async_session.refresh(intake)

    # Mock the schedule_assessment method to verify it's called
    with patch.object(
        Intake, "schedule_assessment", AsyncMock(return_value="mock_assessment_id")
    ) as mock_schedule:
        # Update to COMPLETED status
        await intake.update_status(async_session, IntakeStatus.COMPLETED)

        # Verify schedule_assessment was called
        mock_schedule.assert_called_once()


@pytest.mark.asyncio
async def test_valid_schedule_assessment(
    async_session, seed_configs, mock_clientdata_service
):
    ##
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    with patch.object(
        Assessment, "schedule_execution", AsyncMock(return_value="mock_assessment_id")
    ) as mock_schedule:
        from app.crud.intake import create_intake

        # Create a test intake and set to IN_PROGRESS
        intake = await create_intake(
            async_session,
            mock_clientdata_service["client_pseudo_id"],
            assessment_config_id,
        )
        await intake.update_status(async_session, IntakeStatus.COMPLETED)

        assessment = await get_assessments_by_intake_id(
            async_session, intake_id=intake.id
        )
        assert len(assessment) == 1

        # Default test client is jonh_doe, US_IX state
        # Get UUID for UT-CCCI-v0
        config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

        # Load the config
        loaded = await ConfigLoader.load_assessment_config(config_id, async_session)
        assert assessment[0].assessment_type == loaded.intake.scoring
        mock_schedule.assert_called_once()


@pytest.mark.asyncio
async def test_valid_status_transitions(
    async_session, seed_configs, mock_clientdata_service
):
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create a test intake
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )

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
        assert updated_intake.status == IntakeStatus.IN_PROGRESS

        # Check that schedule_assessment was not called for this status
        mock_schedule.assert_not_called()


# DEPRECATED: This test checked OLD behavior where ClientIntakeSections were created and marked IN_PROGRESS.
# New intakes set current_section directly from assessment_config without creating ClientIntakeSections.
# See test_new_intake_status_transition_sets_first_section for new behavior test.


@pytest.mark.asyncio
async def test_completion_section_for_terminal_statuses(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that terminal statuses set the current_section to COMPLETION_SECTION."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create intake using create_intake which sets assessment_config_id
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    # Set to IN_PROGRESS first
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)
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


# DEPRECATED: This test checked OLD behavior where error was raised if no IntakeSections existed.
# New intakes load sections from assessment_config, not from IntakeSections table.
# See test_create_intake_missing_config_error for new behavior test.


@pytest.mark.asyncio
async def test_update_status_with_no_messages(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that updating to COMPLETED with no messages raises an error with Intakes based-trancriptions"""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_TEST", "tran", 0)]

    # Create transcription intake
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )

    # Try to update to IN_PROGRESS with no sections defined
    with pytest.raises(ValueError) as excinfo:
        await intake.update_status(async_session, IntakeStatus.COMPLETED)

    # Verify the correct error message
    assert "cannot be marked as completed without transcription approved" in str(
        excinfo
    )


@pytest.mark.asyncio
async def test_completed_status_idempotent(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that updating to COMPLETED status is idempotent."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create intake and set to COMPLETED
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)
    with patch.object(
        Intake, "schedule_assessment", AsyncMock(return_value="mock_assessment_id")
    ):
        await intake.update_status(async_session, IntakeStatus.COMPLETED)
    await async_session.refresh(intake)

    # Mock schedule_assessment to verify it's not called again
    with patch.object(Intake, "schedule_assessment", AsyncMock()) as mock_schedule:
        # Update to COMPLETED again
        await intake.update_status(async_session, IntakeStatus.COMPLETED)

        # Verify schedule_assessment was not called
        mock_schedule.assert_not_called()


@pytest.mark.asyncio
async def test_db_manager_update_status(
    async_session, seed_configs, mock_clientdata_service
):
    """Test updating status through the DatabaseManager."""
    from app.crud.intake import create_intake
    from app.utils.intake.db_manager import DatabaseManager

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create a test intake using create_intake which sets assessment_config_id
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )

    # Initialize the DatabaseManager with the test session
    db_manager = DatabaseManager(session=async_session)

    # Update status through the manager
    updated_intake = await db_manager.update_intake_status(
        intake.id, IntakeStatus.IN_PROGRESS
    )

    # Verify the update was successful
    assert updated_intake is not None
    assert updated_intake.status == IntakeStatus.IN_PROGRESS
    # Verify current_section was set from assessment config
    assert updated_intake.current_section is not None


@pytest.mark.asyncio
async def test_db_manager_update_status_nonexistent_client(async_session):
    """Test updating status for a non-existent client."""
    from app.utils.intake.db_manager import DatabaseManager

    # Initialize the DatabaseManager with the test session
    db_manager = DatabaseManager(session=async_session)

    # Try to update with a non-existent intake_id
    from uuid import uuid4

    fake_intake_id = uuid4()
    updated_intake = await db_manager.update_intake_status(
        fake_intake_id, IntakeStatus.IN_PROGRESS
    )

    # Verify the update failed and returned None
    assert updated_intake is None


@pytest.mark.asyncio
async def test_all_transition_combinations(
    async_session, seed_configs, mock_clientdata_service
):
    """Test various status transitions between all possible statuses."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Setup - create intake with CREATED status using create_intake which sets assessment_config_id
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )

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

            # For IN_PROGRESS status, ensure current_section is set (happens automatically via assessment_config)
            if from_status == IntakeStatus.IN_PROGRESS and not intake.current_section:
                # Set current_section if needed (usually set by update_status)
                intake.current_section = "Housing"  # First section from IX-FACR config (mock client is US_IX)
                async_session.add(intake)
                await async_session.commit()

            # Try the transition
            if should_succeed:
                # Should succeed
                await intake.update_status(async_session, to_status)
                await async_session.refresh(intake)
                assert intake.status == to_status

                # For COMPLETED status, verify assessment scheduling
                if to_status == IntakeStatus.COMPLETED:
                    mock_schedule.assert_called()
                    mock_schedule.reset_mock()
            else:
                # Should fail
                with pytest.raises(ValueError):
                    await intake.update_status(async_session, to_status)
                await async_session.refresh(intake)
                assert intake.status == from_status


# Tests for the next_section method


@pytest.mark.asyncio
async def test_next_section_basic(async_session, seed_configs, mock_clientdata_service):
    """Test the basic functionality of next_section - moving to the next section."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

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

    # Create intake with assessment_config_id
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.current_section = section1.title
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
            completion_status=CompletionStatus.NOT_STARTED
            if i > 0
            else CompletionStatus.IN_PROGRESS,
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
    assert first_section.completion_status == CompletionStatus.COMPLETED

    # Verify the second section is now in progress
    result = await async_session.exec(
        select(ClientIntakeSection).where(
            ClientIntakeSection.intake_id == intake.id,
            ClientIntakeSection.intake_section_id == section2.id,
        )
    )
    second_section = result.first()
    assert second_section.completion_status == CompletionStatus.IN_PROGRESS

    # Verify the current section has been updated to the second section
    assert updated_intake.current_section == section2.title
    assert updated_intake.status == IntakeStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_next_section_moves_to_completion_section(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that next_section moves to completion section but stays in progress until address is provided."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create a single section
    section = create_test_section("Only Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake with assessment_config_id
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.current_section = section.title
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create a single client intake section
    client_section = ClientIntakeSection(
        intake_id=intake.id,
        intake_section_id=section.id,
        is_active=True,
        order=0,
        completion_status=CompletionStatus.IN_PROGRESS,
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
    assert updated_intake.status == IntakeStatus.IN_PROGRESS
    assert updated_intake.current_section == COMPLETION_SECTION


@pytest.mark.asyncio
async def test_next_section_no_current_section(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that next_section raises an error when there is no current section."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create intake
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.current_section = None  # Explicitly set to None
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Try to move to the next section with no current section
    with pytest.raises(ValueError) as excinfo:
        await intake.next_section(async_session)

    # Verify the error message
    assert "No current section to advance from" in str(excinfo)


@pytest.mark.asyncio
async def test_next_section_invalid_current_section(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that next_section raises error when current section doesn't exist in config."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create intake
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.current_section = "Non-existent Section"
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Try to move to next section - should raise error for invalid section
    with pytest.raises(ValueError) as excinfo:
        await intake.next_section(async_session)

    # Verify the error message mentions the section not being found
    assert "not found in conversation config" in str(excinfo.value)


@pytest.mark.asyncio
async def test_next_section_skip_incomplete(
    async_session, seed_configs, mock_clientdata_service
):
    """Test next_section correctly skips to the next section even if some are incomplete."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

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

    # Create intake with assessment_config_id
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.current_section = section1.title
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
            completion_status=CompletionStatus.NOT_STARTED
            if i > 0
            else CompletionStatus.IN_PROGRESS,
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
    assert section_with_order_2.completion_status == CompletionStatus.IN_PROGRESS


# =============================================================================
# Legacy Path Tests: Backward Compatibility with ClientIntakeSections
# =============================================================================
# These tests ensure that OLD intakes (created before migration) that have
# ClientIntakeSections continue to work properly with the dual-path logic.


@pytest.mark.asyncio
async def test_legacy_intake_next_section_with_client_sections(
    async_session: AsyncSession, seed_configs, mock_clientdata_service
):
    """Test that legacy intakes with ClientIntakeSections can navigate sections."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create sections to simulate legacy data
    sections = create_test_sections(3)
    section1, section2, section3 = sections
    section1.title = "Legacy Section 1"
    section2.title = "Legacy Section 2"
    section3.title = "Legacy Section 3"
    async_session.add_all([section1, section2, section3])
    await async_session.commit()

    # Refresh to get IDs
    for section in [section1, section2, section3]:
        await async_session.refresh(section)

    # Create intake with assessment_config_id (simulating migrated intake)
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.current_section = section1.title
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create ClientIntakeSections (simulating legacy data)
    client_sections = []
    for i, section_model in enumerate([section1, section2, section3]):
        client_section = ClientIntakeSection(
            intake_id=intake.id,
            intake_section_id=section_model.id,
            is_active=True,
            order=i,
            completion_status=CompletionStatus.IN_PROGRESS
            if i == 0
            else CompletionStatus.NOT_STARTED,
        )
        client_sections.append(client_section)

    async_session.add_all(client_sections)
    await async_session.commit()

    # Refresh intake to load client_intake_sections relationship
    await async_session.refresh(intake, ["client_intake_sections"])

    # Test: Call next_section() - should use LEGACY path
    updated_intake = await intake.next_section(async_session)

    # Verify the first section is now marked as completed
    await async_session.refresh(client_sections[0])
    assert client_sections[0].completion_status == CompletionStatus.COMPLETED

    # Verify the second section is now in progress
    await async_session.refresh(client_sections[1])
    assert client_sections[1].completion_status == CompletionStatus.IN_PROGRESS

    # Verify current_section was updated
    assert updated_intake.current_section == section2.title


@pytest.mark.asyncio
async def test_legacy_intake_completion_with_client_sections(
    async_session: AsyncSession, seed_configs, mock_clientdata_service
):
    """Test that legacy intakes with ClientIntakeSections can reach completion."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create a single section
    section = create_test_section("Legacy Final Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake with assessment_config_id
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.current_section = section.title
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create single ClientIntakeSection (simulating legacy data)
    client_section = ClientIntakeSection(
        intake_id=intake.id,
        intake_section_id=section.id,
        is_active=True,
        order=0,
        completion_status=CompletionStatus.IN_PROGRESS,
    )
    async_session.add(client_section)
    await async_session.commit()

    # Refresh intake to load client_intake_sections relationship
    await async_session.refresh(intake, ["client_intake_sections"])

    # Move to next section (should move to completion section)
    updated_intake = await intake.next_section(async_session)

    # Verify moved to completion section
    assert updated_intake.current_section == COMPLETION_SECTION
    assert updated_intake.status == IntakeStatus.IN_PROGRESS

    # Verify the section is marked as completed
    await async_session.refresh(client_section)
    assert client_section.completion_status == CompletionStatus.COMPLETED


@pytest.mark.asyncio
async def test_legacy_intake_status_transitions_with_client_sections(
    async_session: AsyncSession, seed_configs, mock_clientdata_service
):
    """Test that legacy intakes with ClientIntakeSections can transition statuses."""
    from app.crud.intake import create_intake

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create section
    section = create_test_section("Legacy Status Test Section")
    async_session.add(section)
    await async_session.commit()
    await async_session.refresh(section)

    # Create intake
    intake = await create_intake(
        async_session,
        mock_clientdata_service["client_pseudo_id"],
        assessment_config_id,
    )
    intake.status = IntakeStatus.IN_PROGRESS
    intake.current_section = section.title
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create ClientIntakeSection
    client_section = ClientIntakeSection(
        intake_id=intake.id,
        intake_section_id=section.id,
        is_active=True,
        order=0,
        completion_status=CompletionStatus.COMPLETED,
    )
    async_session.add(client_section)
    await async_session.commit()

    # Mock schedule_assessment
    with patch.object(Intake, "schedule_assessment", AsyncMock(return_value="mock-id")):
        # Transition to COMPLETED
        await intake.update_status(async_session, IntakeStatus.COMPLETED)
        await async_session.refresh(intake)

        # Verify status changed
        assert intake.status == IntakeStatus.COMPLETED
        assert intake.current_section == COMPLETION_SECTION


# =============================================================================
# Migration Tests: IntakeSections to AssessmentConfigs
# =============================================================================


@pytest.mark.asyncio
async def test_create_intake_sets_assessment_config_id(
    async_session: AsyncSession,
    seed_configs,
    mock_clientdata_service,
):
    """Test that create_intake() sets assessment_config_id from state"""
    from app.crud.intake import create_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    intake = await create_intake(async_session, client_pseudo_id, assessment_config_id)

    assert intake.assessment_config_id is not None
    # Mock client is US_IX (Idaho), so should get IX config
    assert (
        intake.assessment_config_id == seed_configs["assessments_by_state"]["US_IX"].id
    )
    assert intake.status == IntakeStatus.CREATED


@pytest.mark.asyncio
async def test_create_intake_different_states(
    async_session: AsyncSession,
    seed_configs,
    mock_clientdata_service,
):
    """Test that create_intake() uses correct config for different states"""
    from app.crud.intake import create_intake

    # Mock different states for different clients
    ut_client = mock_clientdata_service["clients_by_pseudo_id"]["client-001ps"]
    ut_client.state_code = "US_UT"

    ix_client = mock_clientdata_service["clients_by_pseudo_id"]["client-002ps"]
    ix_client.state_code = "US_IX"

    # Get config IDs for each state
    ut_config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]
    ix_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create intake for UT client
    ut_intake = await create_intake(async_session, "client-001ps", ut_config_id)
    assert ut_intake.assessment_config_id == ut_config_id

    # Create intake for IX client
    ix_intake = await create_intake(async_session, "client-002ps", ix_config_id)
    assert ix_intake.assessment_config_id == ix_config_id


@pytest.mark.asyncio
async def test_new_intake_no_client_sections_created(
    async_session: AsyncSession,
    seed_configs,
    mock_clientdata_service,
):
    """Test that new intakes do not create ClientIntakeSection records"""
    from app.crud.intake import create_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    intake = await create_intake(async_session, client_pseudo_id, assessment_config_id)

    # Verify no ClientIntakeSections created
    sections_query = select(ClientIntakeSection).where(
        ClientIntakeSection.intake_id == intake.id
    )
    result = await async_session.exec(sections_query)
    sections = result.all()

    assert len(sections) == 0


@pytest.mark.asyncio
async def test_new_intake_status_transition_sets_first_section(
    async_session: AsyncSession,
    seed_configs,
    mock_clientdata_service,
):
    """Test that new intake transitioning to IN_PROGRESS sets first section from config"""
    from app.crud.intake import create_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    intake = await create_intake(async_session, client_pseudo_id, assessment_config_id)
    assert intake.current_section is None

    # Transition to IN_PROGRESS
    updated_intake = await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)

    # Should set first section from config (mock client is US_IX which uses "Housing")
    assert updated_intake.current_section == "Employment"
    assert updated_intake.status == IntakeStatus.IN_PROGRESS

    # Still no ClientIntakeSections
    sections_query = select(ClientIntakeSection).where(
        ClientIntakeSection.intake_id == intake.id
    )
    result = await async_session.exec(sections_query)
    assert len(result.all()) == 0


@pytest.mark.asyncio
async def test_new_intake_next_section_uses_config(
    async_session: AsyncSession,
    seed_configs,
    mock_clientdata_service,
):
    """Test that new intake next_section() uses assessment config for navigation"""
    from app.crud.intake import create_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create and start intake
    intake = await create_intake(async_session, client_pseudo_id, assessment_config_id)
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)
    await async_session.refresh(intake)

    # Should start at "Employment" (first section in IX-FACR - mock client is US_IX)
    assert intake.current_section == "Employment"

    # Move to next section - but IX-FACR only has one section,
    # so it should move to COMPLETION_SECTION
    await intake.next_section(async_session)
    await async_session.refresh(intake)

    # Should have moved to completion section since IX-FACR only has one section
    assert intake.current_section == COMPLETION_SECTION


@pytest.mark.asyncio
async def test_new_intake_completion_flow(
    async_session: AsyncSession,
    seed_configs,
    mock_clientdata_service,
):
    """Test complete flow from creation to completion for new intake"""
    from app.crud.intake import create_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create intake
    intake = await create_intake(async_session, client_pseudo_id, assessment_config_id)
    assert intake.status == IntakeStatus.CREATED

    # Start intake
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)
    await async_session.refresh(intake)
    assert intake.status == IntakeStatus.IN_PROGRESS
    assert intake.current_section is not None

    # Navigate through sections until completion
    max_iterations = 20  # Safety limit
    for _ in range(max_iterations):
        if intake.current_section == COMPLETION_SECTION:
            break
        await intake.next_section(async_session)
        await async_session.refresh(intake)

    # Should reach completion
    assert intake.current_section == COMPLETION_SECTION

    # Complete intake
    await intake.update_status(async_session, IntakeStatus.COMPLETED)
    await async_session.refresh(intake)
    assert intake.status == IntakeStatus.COMPLETED


@pytest.mark.asyncio
async def test_transcription_intake_no_sections(
    async_session: AsyncSession,
    seed_configs,
    mock_clientdata_service,
):
    """Test that TRANSCRIPTION intake type does not set sections"""
    from app.crud.intake import create_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_TEST", "tran", 0)]

    # Create transcription intake
    intake = await create_intake(async_session, client_pseudo_id, assessment_config_id)

    # Transition to IN_PROGRESS
    await intake.update_status(async_session, IntakeStatus.IN_PROGRESS)
    await async_session.refresh(intake)

    # Should not set current_section for transcription
    assert intake.current_section is None

    # Verify no ClientIntakeSections created
    sections_query = select(ClientIntakeSection).where(
        ClientIntakeSection.intake_id == intake.id
    )
    result = await async_session.exec(sections_query)
    assert len(result.all()) == 0


@pytest.mark.asyncio
async def test_create_intake_missing_client_error(
    async_session: AsyncSession, seed_configs, monkeypatch
):
    """Test that create_intake() raises ValueError for missing client"""
    from app.crud.intake import create_intake
    from app.services.client_data.queries import Queries

    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Mock the client data service to return None for non-existent client
    def mock_get_client_by_pseudonymized_id_unsafe(pseudonymized_id: str):
        return None

    monkeypatch.setattr(
        Queries,
        "get_client_by_pseudonymized_id_unsafe",
        mock_get_client_by_pseudonymized_id_unsafe,
    )

    with pytest.raises(ValueError, match="No client record found"):
        await create_intake(
            async_session,
            "nonexistent-client",
            assessment_config_id,
        )


@pytest.mark.asyncio
async def test_create_intake_missing_config_error(
    async_session: AsyncSession, mock_clientdata_service
):
    """Test that create_intake() raises ValueError when config doesn't exist"""
    from uuid import UUID

    from app.crud.intake import create_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    # Use a non-existent config UUID
    fake_config_id = UUID("00000000-0000-0000-0000-000000000000")

    # Should fail because config doesn't exist
    with pytest.raises(ValueError, match="Assessment config not found"):
        await create_intake(async_session, client_pseudo_id, fake_config_id)
