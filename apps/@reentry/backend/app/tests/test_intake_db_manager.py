"""
Tests for DatabaseManager using the actual database session.
"""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from sqlmodel import select

from app.core.db import AsyncSession
from app.crud.intake import create_intake
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
    db_manager, async_session, mock_clientdata_service, seed_configs
):
    """Test storing a message."""
    # Create a test intake
    # Create a test client ID
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create a test intake
    intake = await create_intake(
        async_session,
        client_pseudo_id,
        IntakeType.CONVERSATION,
        IntakeStatus.IN_PROGRESS,
    )
    intake.current_section = "Housing"

    # Test parameters
    from_role = IntakeMessageRole.CASEWORKER
    content = "Test message content"

    # Store message
    message = await db_manager.store_message(
        from_role=from_role,
        content=content,
        client_pseudo_id=intake.client_pseudo_id,
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
    assert db_message.section == intake.current_section
    assert db_message.intake_id == intake.id


@pytest.mark.asyncio
async def test_complete_section_all_completed(
    db_manager, async_session, mock_clientdata_service, seed_configs
):
    """Test completing the last section."""
    # Create a test client ID
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create a test intake
    await create_intake(
        async_session,
        client_pseudo_id,
        IntakeType.CONVERSATION,
        IntakeStatus.IN_PROGRESS,
    )

    # rewrite this test with new logic, just next section until completed


@pytest.mark.asyncio
async def test_complete_section_nonexistent_client(
    db_manager, mock_clientdata_service, seed_configs
):
    """Test completing a section for nonexistent client."""
    # Use a fake client ID
    client_pseudo_id = str(uuid.uuid4())

    # Complete section should return error
    result = await db_manager.complete_section(client_pseudo_id=client_pseudo_id)

    # Verify error is returned
    assert result == "error"


@pytest.mark.asyncio
async def test_get_section_messages(
    db_manager, async_session, mock_clientdata_service, seed_configs
):
    """Test getting section messages."""
    # Create a test intake
    # Create a test client ID
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create a test intake
    intake = await create_intake(
        async_session,
        client_pseudo_id,
        IntakeType.CONVERSATION,
        IntakeStatus.IN_PROGRESS,
    )

    # Create test messages
    messages = [
        IntakeMessage(
            intake_id=intake.id,
            section="Test Section",
            content="Message 1",
            from_role=IntakeMessageRole.CASEWORKER,
        ),
        IntakeMessage(
            intake_id=intake.id,
            section="Test Section",
            content="Message 2",
            from_role=IntakeMessageRole.CLIENT,
        ),
    ]
    async_session.add_all(messages)
    await async_session.commit()

    # Get section messages
    result = await db_manager.get_section_messages(
        intake_id=intake.id, section_title="Test Section"
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
    db_manager, async_session, mock_clientdata_service, seed_configs
):
    """Test getting messages for nonexistent section."""
    # Create a test client ID
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create a test intake
    intake = await create_intake(
        async_session,
        client_pseudo_id,
        IntakeType.CONVERSATION,
        IntakeStatus.IN_PROGRESS,
    )

    # Get section messages for nonexistent section
    result = await db_manager.get_section_messages(
        intake_id=intake.id, section_title="Nonexistent Section"
    )

    # Verify result is empty
    assert result == []


# This test has been removed as get_intake_sections is no longer present in DatabaseManager


# This test has been removed as get_completed_sections is no longer present in DatabaseManager


@pytest.mark.asyncio
async def test_get_intake_id_by_client_pseudo_id(
    db_manager, async_session, mock_clientdata_service, seed_configs
):
    """Test getting intake ID by client ID."""
    # Create a test client ID
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create a test intake
    intake = await create_intake(
        async_session,
        client_pseudo_id,
        IntakeType.CONVERSATION,
        IntakeStatus.IN_PROGRESS,
    )

    # Get intake ID
    result = await db_manager.get_intake_id_by_client_pseudo_id(
        client_pseudo_id=client_pseudo_id
    )

    # Verify result
    assert result is not None
    assert result == intake.id


@pytest.mark.asyncio
async def test_get_intake_id_by_client_pseudo_id_nonexistent(db_manager):
    """Test getting intake ID for nonexistent client."""
    # Use a fake client ID
    client_pseudo_id = str(uuid.uuid4())

    # Get intake ID should return None
    result = await db_manager.get_intake_id_by_client_pseudo_id(
        client_pseudo_id=client_pseudo_id
    )

    # Verify result is None
    assert result is None


@pytest.mark.asyncio
async def test_get_talking_turn(
    db_manager, async_session, mock_clientdata_service, seed_configs
):
    """Test getting talking turn."""
    # Create a test intake
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create a test intake
    await create_intake(
        async_session,
        client_pseudo_id,
        IntakeType.CONVERSATION,
        IntakeStatus.IN_PROGRESS,
    )

    # Mock get_latest_message
    with patch("app.crud.intake.get_latest_message") as mock_get_latest_message:
        # Case 1: No messages yet, caseworker should start
        mock_get_latest_message.return_value = None
        result = await db_manager.get_talking_turn(client_pseudo_id=client_pseudo_id)
        assert result == IntakeMessageRole.CASEWORKER

        # Case 2: Last message from client, caseworker's turn
        mock_message = AsyncMock()
        mock_message.from_role = IntakeMessageRole.CLIENT.value
        mock_get_latest_message.return_value = mock_message
        result = await db_manager.get_talking_turn(client_pseudo_id=client_pseudo_id)
        assert result == IntakeMessageRole.CASEWORKER

        # Case 3: Last message from caseworker, client's turn
        mock_message.from_role = IntakeMessageRole.CASEWORKER.value
        mock_get_latest_message.return_value = mock_message
        result = await db_manager.get_talking_turn(client_pseudo_id=client_pseudo_id)
        assert result == IntakeMessageRole.CLIENT


@pytest.mark.asyncio
async def test_all_messages_by_time(
    db_manager, async_session, mock_clientdata_service, seed_configs
):
    """Test getting all messages by time."""
    # Create a test intake
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create a test intake
    intake = await create_intake(
        async_session,
        client_pseudo_id,
        IntakeType.CONVERSATION,
        IntakeStatus.IN_PROGRESS,
    )

    # Create test messages
    messages = [
        IntakeMessage(
            intake_id=intake.id,
            section="Test Section",
            content="Message 1",
            from_role=IntakeMessageRole.CASEWORKER,
        ),
        IntakeMessage(
            intake_id=intake.id,
            section="Test Section",
            content="Message 2",
            from_role=IntakeMessageRole.CLIENT,
        ),
    ]
    async_session.add_all(messages)
    await async_session.commit()

    # Get all messages
    result = await db_manager.all_messages_by_time(client_pseudo_id=client_pseudo_id)

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
    db_manager, async_session, mock_clientdata_service, seed_configs
):
    """Test getting intake by client ID."""
    # Create a test intake
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Create a test intake
    intake = await create_intake(
        async_session,
        client_pseudo_id,
        IntakeType.CONVERSATION,
        IntakeStatus.IN_PROGRESS,
    )

    # Get intake
    result = await db_manager.get_intake(client_pseudo_id=client_pseudo_id)

    # Verify result
    assert result is not None
    assert result.id == intake.id
    assert result.client_pseudo_id == client_pseudo_id
