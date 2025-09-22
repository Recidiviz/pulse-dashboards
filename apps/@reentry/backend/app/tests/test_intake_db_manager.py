"""
Tests for DatabaseManager using the actual database session.
"""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.intake import (
    ClientIntakeSection,
    Intake,
    IntakeMessage,
    IntakeMessageRole,
    IntakeStatus,
)
from app.models.intake_sections import CompletionStatus
from app.tests.test_fixtures.intake_sections import (
    create_test_section,
    create_test_sections,
)
from app.utils.intake.db_manager import DatabaseManager


@pytest.fixture
def db_manager(async_session: AsyncSession):
    """Create a DatabaseManager instance with the test session."""
    return DatabaseManager(session=async_session)


# This test has been removed as check_db_connection is no longer present in DatabaseManager


@pytest.mark.asyncio
async def test_store_message(db_manager, async_session):
    """Test storing a message."""
    # Create a test intake
    intake = Intake(
        status=IntakeStatus.IN_PROGRESS,
        client_pseudo_id=str(uuid.uuid4()),
        current_section="Test Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

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
async def test_complete_section(db_manager, async_session):
    """Test completing a section."""
    # Create a test intake
    client_pseudo_id = str(uuid.uuid4())
    intake = Intake(
        status=IntakeStatus.IN_PROGRESS,
        client_pseudo_id=client_pseudo_id,
        current_section="Section 1",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create test sections
    sections = create_test_sections(2)
    sections[0].title = "Section 1"
    sections[1].title = "Section 2"
    async_session.add_all(sections)
    await async_session.commit()

    # Refresh to get IDs
    for section in sections:
        await async_session.refresh(section)

    # Create client sections
    client_sections = [
        ClientIntakeSection(
            intake_id=intake.id,
            intake_section_id=sections[0].id,
            is_active=True,
            order=0,
            completion_status=CompletionStatus.IN_PROGRESS,
        ),
        ClientIntakeSection(
            intake_id=intake.id,
            intake_section_id=sections[1].id,
            is_active=True,
            order=1,
            completion_status=CompletionStatus.NOT_STARTED,
        ),
    ]
    async_session.add_all(client_sections)
    await async_session.commit()

    # Complete section
    next_section = await db_manager.complete_section(client_pseudo_id=client_pseudo_id)

    # Verify next section is returned
    assert next_section == "Section 2"

    # Refresh from database
    await async_session.refresh(intake)
    assert intake.current_section == "Section 2"

    # Check client sections
    stmt = (
        select(ClientIntakeSection)
        .where(ClientIntakeSection.intake_id == intake.id)
        .order_by(ClientIntakeSection.order)
    )
    result = await async_session.execute(stmt)
    updated_client_sections = result.scalars().all()

    # First section should be completed
    assert updated_client_sections[0].completion_status == CompletionStatus.COMPLETED
    # Second section should be in progress
    assert updated_client_sections[1].completion_status == CompletionStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_complete_section_all_completed(db_manager, async_session):
    """Test completing the last section."""
    # Create a test intake
    client_pseudo_id = str(uuid.uuid4())
    intake = Intake(
        status=IntakeStatus.IN_PROGRESS,
        client_pseudo_id=client_pseudo_id,
        current_section="Last Section",
    )

    # Here we'll patch the Intake.next_section method at the class level
    with patch.object(Intake, "next_section", new=AsyncMock()) as mock_next_section:
        # Configure the mock to return the updated intake with no next section
        mock_next_section.return_value = Intake(
            id=uuid.uuid4(),
            status=IntakeStatus.COMPLETED,
            client_pseudo_id=client_pseudo_id,
            current_section=None,
        )

        async_session.add(intake)
        await async_session.commit()
        await async_session.refresh(intake)

        # Create test section
        section = create_test_section("Last Section")
        async_session.add(section)
        await async_session.commit()
        await async_session.refresh(section)

        # Create client section
        client_section = ClientIntakeSection(
            intake_id=intake.id,
            intake_section_id=section.id,
            is_active=True,
            order=0,
            completion_status=CompletionStatus.IN_PROGRESS,
        )
        async_session.add(client_section)
        await async_session.commit()

        # Complete the last section
        next_section = await db_manager.complete_section(
            client_pseudo_id=client_pseudo_id
        )

        # Verify no next section is returned
        assert next_section is None


@pytest.mark.asyncio
async def test_complete_section_nonexistent_client(db_manager):
    """Test completing a section for nonexistent client."""
    # Use a fake client ID
    client_pseudo_id = str(uuid.uuid4())

    # Complete section should return error
    result = await db_manager.complete_section(client_pseudo_id=client_pseudo_id)

    # Verify error is returned
    assert result == "error"


@pytest.mark.asyncio
async def test_get_section_messages(db_manager, async_session):
    """Test getting section messages."""
    # Create a test intake
    intake = Intake(
        status=IntakeStatus.IN_PROGRESS,
        client_pseudo_id=str(uuid.uuid4()),
        current_section="Test Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

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
async def test_get_section_messages_nonexistent_section(db_manager, async_session):
    """Test getting messages for nonexistent section."""
    # Create a test intake
    intake = Intake(
        status=IntakeStatus.IN_PROGRESS,
        client_pseudo_id=str(uuid.uuid4()),
        current_section="Test Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Get section messages for nonexistent section
    result = await db_manager.get_section_messages(
        intake_id=intake.id, section_title="Nonexistent Section"
    )

    # Verify result is empty
    assert result == []


# This test has been removed as get_intake_sections is no longer present in DatabaseManager


# This test has been removed as get_completed_sections is no longer present in DatabaseManager


@pytest.mark.asyncio
async def test_get_intake_id_by_client_pseudo_id(db_manager, async_session):
    """Test getting intake ID by client ID."""
    # Create a test client ID
    client_pseudo_id = str(uuid.uuid4())

    # Create a test intake
    intake = Intake(
        status=IntakeStatus.IN_PROGRESS,
        client_pseudo_id=client_pseudo_id,
        current_section="Test Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

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
async def test_get_talking_turn(db_manager, async_session):
    """Test getting talking turn."""
    # Create a test intake
    client_pseudo_id = str(uuid.uuid4())
    intake = Intake(
        status=IntakeStatus.IN_PROGRESS,
        client_pseudo_id=client_pseudo_id,
        current_section="Test Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

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
async def test_all_messages_by_time(db_manager, async_session):
    """Test getting all messages by time."""
    # Create a test intake
    client_pseudo_id = str(uuid.uuid4())
    intake = Intake(
        status=IntakeStatus.IN_PROGRESS,
        client_pseudo_id=client_pseudo_id,
        current_section="Test Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

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
async def test_get_intake(db_manager, async_session):
    """Test getting intake by client ID."""
    # Create a test intake
    client_pseudo_id = str(uuid.uuid4())
    intake = Intake(
        status=IntakeStatus.IN_PROGRESS,
        client_pseudo_id=client_pseudo_id,
        current_section="Test Section",
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Get intake
    result = await db_manager.get_intake(client_pseudo_id=client_pseudo_id)

    # Verify result
    assert result is not None
    assert result.id == intake.id
    assert result.client_pseudo_id == client_pseudo_id
