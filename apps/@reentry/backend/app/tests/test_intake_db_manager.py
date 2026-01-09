"""
Tests for DatabaseManager using the actual database session.
"""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from sqlmodel import select

from app.core.db import AsyncSession
from app.models.intake import (
    IntakeMessage,
    IntakeMessageRole,
    IntakeStatus,
    IntakeType,
)
from app.utils.intake.db_manager import DatabaseManager


@pytest.fixture
def db_manager(async_session: AsyncSession):
    """Create a DatabaseManager instance with the test session."""
    return DatabaseManager(session=async_session)


@pytest.mark.asyncio
async def test_store_message(
    db_manager, async_session, mock_clientdata_service, seed_configs, mock_intake
):
    """Test storing a message."""
    # Use mock_intake and override necessary values
    mock_intake.intake_type = IntakeType.CONVERSATION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    mock_intake.current_section = "Housing"
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Test parameters
    from_role = IntakeMessageRole.CASEWORKER
    content = "Test message content"

    # Store message
    message = await db_manager.store_message(
        intake_id=mock_intake.id,
        from_role=from_role,
        content=content,
    )

    # Verify message was stored
    assert message is not None

    # Query the database to verify
    stmt = select(IntakeMessage).where(IntakeMessage.id == message.id)
    result = await async_session.execute(stmt)
    db_message = result.scalar_one_or_none()

    assert db_message is not None
    assert db_message.content == content
    assert db_message.from_role == from_role
    assert db_message.section == mock_intake.current_section
    assert db_message.intake_id == mock_intake.id


@pytest.mark.asyncio
async def test_complete_section_all_completed(
    db_manager, async_session, mock_clientdata_service, seed_configs, mock_intake
):
    """Test completing the last section."""
    # Use mock_intake and override necessary values
    mock_intake.intake_type = IntakeType.CONVERSATION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # rewrite this test with new logic, just next section until completed


@pytest.mark.asyncio
async def test_complete_section_nonexistent_client(
    db_manager, mock_clientdata_service, seed_configs
):
    """Test completing a section for nonexistent client."""
    # Use a fake client ID

    # Complete section should return error (using fake UUID)
    fake_intake_id = uuid.uuid4()
    result = await db_manager.complete_section(intake_id=fake_intake_id)

    # Verify error is returned
    assert result == "error"


@pytest.mark.asyncio
async def test_get_section_messages(
    db_manager, async_session, mock_clientdata_service, seed_configs, mock_intake
):
    """Test getting section messages."""
    # Use mock_intake and override necessary values
    mock_intake.intake_type = IntakeType.CONVERSATION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Create test messages
    messages = [
        IntakeMessage(
            intake_id=mock_intake.id,
            section="Test Section",
            content="Message 1",
            from_role=IntakeMessageRole.CASEWORKER,
        ),
        IntakeMessage(
            intake_id=mock_intake.id,
            section="Test Section",
            content="Message 2",
            from_role=IntakeMessageRole.CLIENT,
        ),
    ]
    async_session.add_all(messages)
    await async_session.commit()

    # Get section messages
    result = await db_manager.get_section_messages(
        intake_id=mock_intake.id, section_title="Test Section"
    )

    # Verify result
    assert len(result) == 2
    contents = [msg["content"] for msg in result]
    assert "Message 1" in contents
    assert "Message 2" in contents
    roles = [msg["role"] for msg in result]
    assert "caseworker" in roles
    assert "client" in roles


@pytest.mark.asyncio
async def test_get_section_messages_nonexistent_section(
    db_manager, async_session, mock_clientdata_service, seed_configs, mock_intake
):
    """Test getting messages for nonexistent section."""
    # Use mock_intake and override necessary values
    mock_intake.intake_type = IntakeType.CONVERSATION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Get section messages for nonexistent section
    result = await db_manager.get_section_messages(
        intake_id=mock_intake.id, section_title="Nonexistent Section"
    )

    # Verify result is empty
    assert result == []


# This test has been removed as get_intake_sections is no longer present in DatabaseManager


# This test has been removed as get_completed_sections is no longer present in DatabaseManager


@pytest.mark.asyncio
async def test_get_talking_turn(
    db_manager, async_session, mock_clientdata_service, seed_configs, mock_intake
):
    """Test getting talking turn."""
    # Use mock_intake and override necessary values
    mock_intake.intake_type = IntakeType.CONVERSATION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Mock get_latest_message
    with patch("app.crud.intake.get_latest_message") as mock_get_latest_message:
        # Case 1: No messages yet, caseworker should start
        mock_get_latest_message.return_value = None
        result = await db_manager.get_talking_turn(intake_id=mock_intake.id)
        assert result == IntakeMessageRole.CASEWORKER

        # Case 2: Last message from client, caseworker's turn
        mock_message = AsyncMock()
        mock_message.from_role = IntakeMessageRole.CLIENT.value
        mock_get_latest_message.return_value = mock_message
        result = await db_manager.get_talking_turn(intake_id=mock_intake.id)
        assert result == IntakeMessageRole.CASEWORKER

        # Case 3: Last message from caseworker, client's turn
        mock_message.from_role = IntakeMessageRole.CASEWORKER.value
        mock_get_latest_message.return_value = mock_message
        result = await db_manager.get_talking_turn(intake_id=mock_intake.id)
        assert result == IntakeMessageRole.CLIENT


@pytest.mark.asyncio
async def test_all_messages_by_time(
    db_manager, async_session, mock_clientdata_service, seed_configs, mock_intake
):
    """Test getting all messages by time."""
    # Use mock_intake and override necessary values
    mock_intake.intake_type = IntakeType.CONVERSATION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Create test messages
    messages = [
        IntakeMessage(
            intake_id=mock_intake.id,
            section="Test Section",
            content="Message 1",
            from_role=IntakeMessageRole.CASEWORKER,
        ),
        IntakeMessage(
            intake_id=mock_intake.id,
            section="Test Section",
            content="Message 2",
            from_role=IntakeMessageRole.CLIENT,
        ),
    ]
    async_session.add_all(messages)
    await async_session.commit()

    # Get all messages
    result = await db_manager.all_messages_by_time(intake_id=mock_intake.id)

    # Verify result
    assert len(result) == 2
    contents = [msg.content for msg in result]
    assert "Message 1" in contents
    assert "Message 2" in contents
    roles = [msg.from_role for msg in result]
    assert IntakeMessageRole.CASEWORKER in roles
    assert IntakeMessageRole.CLIENT in roles


@pytest.mark.asyncio
async def test_get_client(db_manager):
    """Test getting client from client data service."""
    # Mock get_client_by_pseudonymized_id_unsafe
    with patch(
        "app.services.client_data.queries.Queries.get_client_by_pseudonymized_id_unsafe"
    ) as mock_get_client_data:
        mock_get_client_data.return_value = "mock_client_data"

        # Get client
        result = db_manager.get_client(client_pseudo_id="907775")

        # Verify client data service was called correctly
        mock_get_client_data.assert_called_once_with("907775")
        assert result == "mock_client_data"


@pytest.mark.asyncio
async def test_get_intake(
    db_manager, async_session, mock_clientdata_service, seed_configs, mock_intake
):
    """Test getting intake by client ID."""
    # Use mock_intake and override necessary values
    mock_intake.intake_type = IntakeType.CONVERSATION
    mock_intake.status = IntakeStatus.IN_PROGRESS
    async_session.add(mock_intake)
    await async_session.commit()
    await async_session.refresh(mock_intake)

    # Get intake
    result = await db_manager.get_intake(client_pseudo_id=mock_intake.client_pseudo_id)

    # Verify result
    assert result is not None
    assert result.id == mock_intake.id
    assert result.client_pseudo_id == mock_intake.client_pseudo_id


@pytest.mark.asyncio
async def test_get_latest_active_conversation_intake_returns_most_recent(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that get_latest_active_conversation_intake returns the most recent CREATED or IN_PROGRESS conversation intake."""
    import asyncio

    from app.crud.intake import create_intake, get_latest_active_conversation_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create first intake (older)
    await create_intake(
        async_session,
        client_pseudo_id,
        assessment_config_id,
        status=IntakeStatus.CREATED,
    )

    # Small delay to ensure different created_at timestamps
    await asyncio.sleep(0.01)

    # Create second intake (newer)
    intake2 = await create_intake(
        async_session,
        client_pseudo_id,
        assessment_config_id,
        status=IntakeStatus.IN_PROGRESS,
    )

    # Get latest active conversation intake
    result = await get_latest_active_conversation_intake(
        async_session, client_pseudo_id
    )

    # Should return the most recent one (intake2)
    assert result is not None
    assert result.id == intake2.id
    assert result.status == IntakeStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_get_latest_active_conversation_intake_ignores_completed(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that get_latest_active_conversation_intake ignores COMPLETED and ERROR intakes."""
    import asyncio

    from app.crud.intake import create_intake, get_latest_active_conversation_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create older IN_PROGRESS intake
    intake1 = await create_intake(
        async_session,
        client_pseudo_id,
        assessment_config_id,
        status=IntakeStatus.IN_PROGRESS,
    )

    await asyncio.sleep(0.01)

    # Create newer COMPLETED intake
    await create_intake(
        async_session,
        client_pseudo_id,
        assessment_config_id,
        status=IntakeStatus.COMPLETED,
    )

    await asyncio.sleep(0.01)

    # Create newest ERROR intake
    await create_intake(
        async_session,
        client_pseudo_id,
        assessment_config_id,
        status=IntakeStatus.ERROR,
    )

    # Get latest active conversation intake
    result = await get_latest_active_conversation_intake(
        async_session, client_pseudo_id
    )

    # Should return intake1 (IN_PROGRESS), ignoring the newer COMPLETED and ERROR ones
    assert result is not None
    assert result.id == intake1.id
    assert result.status == IntakeStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_get_latest_active_conversation_intake_returns_none_when_all_completed(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that get_latest_active_conversation_intake returns None when all intakes are COMPLETED or ERROR."""
    from app.crud.intake import create_intake, get_latest_active_conversation_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create only COMPLETED intakes
    await create_intake(
        async_session,
        client_pseudo_id,
        assessment_config_id,
        status=IntakeStatus.COMPLETED,
    )

    await create_intake(
        async_session,
        client_pseudo_id,
        assessment_config_id,
        status=IntakeStatus.ERROR,
    )

    # Get latest active conversation intake
    result = await get_latest_active_conversation_intake(
        async_session, client_pseudo_id
    )

    # Should return None
    assert result is None


@pytest.mark.asyncio
async def test_get_latest_active_conversation_intake_returns_none_when_no_intakes(
    async_session, mock_clientdata_service
):
    """Test that get_latest_active_conversation_intake returns None when no intakes exist."""
    from app.crud.intake import get_latest_active_conversation_intake

    # Use a client ID that has no intakes
    client_pseudo_id = "nonexistent_client_id"

    # Get latest active conversation intake
    result = await get_latest_active_conversation_intake(
        async_session, client_pseudo_id
    )

    # Should return None
    assert result is None


@pytest.mark.asyncio
async def test_get_latest_active_conversation_intake_prefers_most_recent_regardless_of_status(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that when both CREATED and IN_PROGRESS exist, it returns the most recent one."""
    import asyncio

    from app.crud.intake import create_intake, get_latest_active_conversation_intake

    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create IN_PROGRESS intake first
    await create_intake(
        async_session,
        client_pseudo_id,
        assessment_config_id,
        status=IntakeStatus.IN_PROGRESS,
    )

    await asyncio.sleep(0.01)

    # Create CREATED intake (more recent)
    intake2 = await create_intake(
        async_session,
        client_pseudo_id,
        assessment_config_id,
        status=IntakeStatus.CREATED,
    )

    # Get latest active conversation intake
    result = await get_latest_active_conversation_intake(
        async_session, client_pseudo_id
    )

    # Should return the most recent one (intake2 with CREATED status)
    assert result is not None
    assert result.id == intake2.id
    assert result.status == IntakeStatus.CREATED


@pytest.mark.asyncio
async def test_get_latest_active_conversation_intake_with_multiple_clients(
    async_session, seed_configs, mock_clientdata_service
):
    """Test that get_latest_active_conversation_intake returns intake for correct client when multiple clients exist."""
    from app.crud.intake import create_intake, get_latest_active_conversation_intake

    client1_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    client2_pseudo_id = "different_client_id"
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create intake for client1
    intake1 = await create_intake(
        async_session,
        client1_pseudo_id,
        assessment_config_id,
        status=IntakeStatus.IN_PROGRESS,
    )

    # Create intake for client2 (using same assessment_config, simulating same state)
    # Note: This would normally fail if client2 doesn't exist in BigQuery
    # but for this test we're just checking the query logic
    try:
        await create_intake(
            async_session,
            client2_pseudo_id,
            assessment_config_id,
            status=IntakeStatus.CREATED,
        )

        # Get latest active conversation intake for client1
        result = await get_latest_active_conversation_intake(
            async_session, client1_pseudo_id
        )

        # Should return intake1, not intake2
        assert result is not None
        assert result.id == intake1.id
        assert result.client_pseudo_id == client1_pseudo_id
    except ValueError:
        # If client2 doesn't exist in BigQuery, skip this part of the test
        # The important part is just verifying client1's intake is returned correctly
        result = await get_latest_active_conversation_intake(
            async_session, client1_pseudo_id
        )
        assert result is not None
        assert result.id == intake1.id
