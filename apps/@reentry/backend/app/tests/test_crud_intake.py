"""Tests for intake CRUD operations."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.address import get_collected_address_for_intake, update_intake_address
from app.crud.intake import (
    create_intake,
    get_active_intake_by_client_pseudo_id,
    get_all_intakes_by_client_pseudo_id,
    get_intake_by_id,
    get_intake_by_token,
    get_intake_messages,
    get_intake_section_messages,
    get_intake_token,
    get_latest_active_conversation_intake,
    get_latest_message,
    get_latest_not_welcome_message,
    get_or_create_token,
    update_internal_access_by_intake_id,
)
from app.models.base import IntakeStatus, IntakeType
from app.models.intake import ClientAddress, Intake, IntakeMessage
from app.routes.shared_models import AddressSubmission, IntakeMessageRole


@pytest.mark.asyncio
async def test_get_intake_by_id(async_session: AsyncSession, mock_intake):
    """Test retrieving an intake by ID."""
    result = await get_intake_by_id(async_session, mock_intake.id)

    assert result is not None
    assert result.id == mock_intake.id
    assert result.client_pseudo_id == mock_intake.client_pseudo_id


@pytest.mark.asyncio
async def test_get_intake_by_id_not_found(async_session: AsyncSession, seed_configs):
    """Test retrieving a non-existent intake returns None."""
    result = await get_intake_by_id(async_session, uuid4())
    assert result is None


@pytest.mark.asyncio
async def test_get_active_intake_by_client_pseudo_id_created(
    async_session: AsyncSession, seed_configs
):
    """Test retrieving a CREATED intake for a client."""
    client_id = "client-002"
    assessment_config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

    intake = Intake(
        client_pseudo_id=client_id,
        status=IntakeStatus.CREATED,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    result = await get_active_intake_by_client_pseudo_id(async_session, client_id)

    assert result is not None
    assert result.id == intake.id
    assert result.status == IntakeStatus.CREATED


@pytest.mark.asyncio
async def test_get_active_intake_by_client_pseudo_id_in_progress(
    async_session: AsyncSession, seed_configs
):
    """Test retrieving an IN_PROGRESS intake for a client."""
    client_id = "client-003"
    assessment_config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

    intake = Intake(
        client_pseudo_id=client_id,
        status=IntakeStatus.IN_PROGRESS,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    result = await get_active_intake_by_client_pseudo_id(async_session, client_id)

    assert result is not None
    assert result.id == intake.id
    assert result.status == IntakeStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_get_active_intake_excludes_completed(
    async_session: AsyncSession, mock_intake
):
    """Test that completed intakes are not returned as active."""
    # mock_intake is already completed
    result = await get_active_intake_by_client_pseudo_id(
        async_session, mock_intake.client_pseudo_id
    )

    assert result is None


@pytest.mark.asyncio
async def test_get_active_intake_returns_most_recent(
    async_session: AsyncSession, seed_configs
):
    """Test that the most recent active intake is returned when multiple exist."""
    client_id = "client-005"
    assessment_config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

    # Create older intake
    intake1 = Intake(
        client_pseudo_id=client_id,
        status=IntakeStatus.CREATED,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake1)
    await async_session.commit()

    # Create newer intake
    intake2 = Intake(
        client_pseudo_id=client_id,
        status=IntakeStatus.IN_PROGRESS,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake2)
    await async_session.commit()
    await async_session.refresh(intake2)

    result = await get_active_intake_by_client_pseudo_id(async_session, client_id)

    assert result is not None
    assert result.id == intake2.id


@pytest.mark.asyncio
async def test_get_latest_active_conversation_intake(
    async_session: AsyncSession, seed_configs
):
    """Test retrieving the latest active conversation intake."""
    client_id = "client-006"
    assessment_config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

    # Create an intake (should be ignored)
    intake1 = Intake(
        client_pseudo_id=client_id,
        status=IntakeStatus.CREATED,
        intake_type=IntakeType.TRANSCRIPTION,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake1)
    await async_session.commit()

    # Create a conversation intake
    intake2 = Intake(
        client_pseudo_id=client_id,
        status=IntakeStatus.CREATED,
        intake_type=IntakeType.CONVERSATION,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake2)
    await async_session.commit()
    await async_session.refresh(intake2)

    result = await get_latest_active_conversation_intake(async_session, client_id)

    assert result is not None
    assert result.id == intake2.id
    assert result.intake_type == IntakeType.CONVERSATION


@pytest.mark.asyncio
async def test_get_all_intakes_by_client_pseudo_id(
    async_session: AsyncSession, seed_configs
):
    """Test retrieving all intakes for a client."""
    client_id = "client-008"
    assessment_config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

    intake1 = Intake(
        client_pseudo_id=client_id,
        status=IntakeStatus.CREATED,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake1)
    await async_session.commit()
    await async_session.refresh(intake1)

    intake2 = Intake(
        client_pseudo_id=client_id,
        status=IntakeStatus.COMPLETED,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake2)
    await async_session.commit()
    await async_session.refresh(intake2)

    intake3 = Intake(
        client_pseudo_id=client_id,
        status=IntakeStatus.IN_PROGRESS,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake3)
    await async_session.commit()
    await async_session.refresh(intake3)

    result = await get_all_intakes_by_client_pseudo_id(async_session, client_id)

    assert len(result) == 3
    # Should be ordered by created_at DESC (newest first)
    assert result[0].id == intake3.id
    assert result[1].id == intake2.id
    assert result[2].id == intake1.id


@pytest.mark.asyncio
async def test_get_all_intakes_empty(async_session: AsyncSession, seed_configs):
    """Test retrieving all intakes when none exist."""
    result = await get_all_intakes_by_client_pseudo_id(
        async_session, "nonexistent-client"
    )
    assert result == []


@pytest.mark.asyncio
async def test_create_intake_with_mocks(
    async_session: AsyncSession, seed_configs, mock_clientdata_service
):
    """Test creating an intake with mocked dependencies."""
    client_pseudo_id = "client-001ps"
    config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

    # Mock ConfigLoader
    mock_config = MagicMock()
    mock_config.intake.intake_type = "conversation"

    with patch(
        "app.crud.intake.ConfigLoader.load_assessment_config",
        new_callable=AsyncMock,
    ) as mock_load_config:
        mock_load_config.return_value = mock_config

        intake = await create_intake(
            async_session,
            client_pseudo_id,
            config_id,
            status=IntakeStatus.CREATED,
        )

        assert intake.client_pseudo_id == client_pseudo_id
        assert intake.status == IntakeStatus.CREATED
        assert intake.assessment_config_id == config_id
        assert intake.internal_access is True


@pytest.mark.asyncio
async def test_create_intake_no_client_record(
    async_session: AsyncSession, seed_configs
):
    """Test creating an intake when client record doesn't exist."""
    with patch(
        "app.crud.intake.Queries.get_client_by_pseudonymized_id_unsafe"
    ) as mock_get_client:
        mock_get_client.return_value = None

        with pytest.raises(ValueError, match="No client record found"):
            await create_intake(
                async_session,
                "nonexistent-client",
                uuid4(),
            )


@pytest.mark.asyncio
async def test_get_or_create_token_creates_new(
    async_session: AsyncSession, mock_intake
):
    """Test get_or_create_token creates a new token when none exists."""
    token_entry, raw_token = await get_or_create_token(async_session, mock_intake.id)

    assert token_entry is not None
    assert token_entry.intake_id == mock_intake.id
    assert raw_token is not None
    assert len(raw_token) > 0


@pytest.mark.asyncio
async def test_get_or_create_token_returns_existing(
    async_session: AsyncSession, mock_intake
):
    """Test get_or_create_token returns existing token."""
    # Create first token
    token_entry1, raw_token1 = await get_or_create_token(async_session, mock_intake.id)

    # Call again
    token_entry2, raw_token2 = await get_or_create_token(async_session, mock_intake.id)

    assert token_entry1.id == token_entry2.id
    assert raw_token1 == raw_token2


@pytest.mark.asyncio
async def test_get_intake_token(async_session: AsyncSession, mock_intake):
    """Test retrieving intake token by token string."""
    token_entry, raw_token = await get_or_create_token(async_session, mock_intake.id)

    result = await get_intake_token(async_session, raw_token)

    assert result is not None
    assert result.id == token_entry.id
    assert result.intake_id == mock_intake.id


@pytest.mark.asyncio
async def test_get_intake_token_not_found(async_session: AsyncSession, seed_configs):
    """Test retrieving non-existent token returns None."""
    result = await get_intake_token(async_session, "invalid-token")
    assert result is None


@pytest.mark.asyncio
async def test_get_intake_by_token(async_session: AsyncSession, mock_intake):
    """Test retrieving intake by token string."""
    token_entry, raw_token = await get_or_create_token(async_session, mock_intake.id)

    result_token, result_intake = await get_intake_by_token(async_session, raw_token)

    assert result_token is not None
    assert result_token.id == token_entry.id
    assert result_intake is not None
    assert result_intake.id == mock_intake.id


@pytest.mark.asyncio
async def test_get_intake_by_token_not_found(async_session: AsyncSession, seed_configs):
    """Test retrieving intake with invalid token returns None."""
    result_token, result_intake = await get_intake_by_token(
        async_session, "invalid-token"
    )
    assert result_token is None
    assert result_intake is None


@pytest.mark.asyncio
async def test_update_internal_access_by_intake_id(
    async_session: AsyncSession, mock_intake
):
    """Test updating internal access field for an intake."""
    assert mock_intake.internal_access is True

    result = await update_internal_access_by_intake_id(
        async_session, mock_intake.id, internal_access=False
    )

    assert result is not None
    assert result.internal_access is False

    # Verify it persisted
    refreshed = await get_intake_by_id(async_session, mock_intake.id)
    assert refreshed.internal_access is False


@pytest.mark.asyncio
async def test_update_internal_access_intake_not_found(
    async_session: AsyncSession, seed_configs
):
    """Test updating internal access for non-existent intake returns None."""
    result = await update_internal_access_by_intake_id(
        async_session, uuid4(), internal_access=False
    )
    assert result is None


@pytest.mark.asyncio
async def test_get_intake_messages(async_session: AsyncSession, mock_intake):
    """Test retrieving all messages for an intake."""
    # Create messages
    msg1 = IntakeMessage(
        intake_id=mock_intake.id,
        content="Hello",
        from_role=IntakeMessageRole.CLIENT,
        section="intro",
    )
    msg2 = IntakeMessage(
        intake_id=mock_intake.id,
        content="Hi there",
        from_role=IntakeMessageRole.CASEWORKER,
        section="intro",
    )
    async_session.add_all([msg1, msg2])
    await async_session.commit()

    messages = await get_intake_messages(async_session, mock_intake.id)

    assert len(messages) == 2
    assert messages[0].content == "Hello"
    assert messages[1].content == "Hi there"


@pytest.mark.asyncio
async def test_get_intake_section_messages(async_session: AsyncSession, mock_intake):
    """Test retrieving messages for a specific section."""
    # Create messages in different sections
    msg1 = IntakeMessage(
        intake_id=mock_intake.id,
        content="Intro message",
        from_role=IntakeMessageRole.CLIENT,
        section="intro",
    )
    msg2 = IntakeMessage(
        intake_id=mock_intake.id,
        content="Background message",
        from_role=IntakeMessageRole.CLIENT,
        section="background",
    )
    async_session.add_all([msg1, msg2])
    await async_session.commit()

    messages = await get_intake_section_messages(async_session, mock_intake.id, "intro")

    assert len(messages) == 1
    assert messages[0].content == "Intro message"
    assert messages[0].section == "intro"


@pytest.mark.asyncio
async def test_get_latest_message(async_session: AsyncSession, mock_intake):
    """Test retrieving the latest message for an intake."""
    msg1 = IntakeMessage(
        intake_id=mock_intake.id,
        content="First",
        from_role=IntakeMessageRole.CLIENT,
        section="intro",
    )
    async_session.add(msg1)
    await async_session.commit()

    msg2 = IntakeMessage(
        intake_id=mock_intake.id,
        content="Second",
        from_role=IntakeMessageRole.CASEWORKER,
        section="intro",
    )
    async_session.add(msg2)
    await async_session.commit()

    latest = await get_latest_message(async_session, mock_intake.id)

    assert latest is not None
    assert latest.content == "Second"


@pytest.mark.asyncio
async def test_get_latest_not_welcome_message(async_session: AsyncSession, mock_intake):
    """Test retrieving latest message excluding welcome messages."""
    msg1 = IntakeMessage(
        intake_id=mock_intake.id,
        content="Regular message",
        from_role=IntakeMessageRole.CLIENT,
        section="intro",
    )
    async_session.add(msg1)
    await async_session.commit()

    msg2 = IntakeMessage(
        intake_id=mock_intake.id,
        content="thanks for joining again",  # Welcome message
        from_role=IntakeMessageRole.CASEWORKER,
        section="intro",
    )
    async_session.add(msg2)
    await async_session.commit()

    latest = await get_latest_not_welcome_message(async_session, mock_intake.id)

    assert latest is not None
    assert latest.content == "Regular message"


@pytest.mark.asyncio
async def test_update_intake_address_creates_new(
    async_session: AsyncSession, mock_intake
):
    """Test updating address creates a new address when none exists."""
    address_data = AddressSubmission(
        street_address="123 Main St", city="San Francisco", state="CA"
    )

    result = await update_intake_address(async_session, mock_intake.id, address_data)

    assert result is not None
    assert result.street_address == "123 Main St"
    assert result.city == "San Francisco"
    assert result.state == "CA"
    assert result.intake_id == mock_intake.id


@pytest.mark.asyncio
async def test_update_intake_address_updates_existing(
    async_session: AsyncSession, mock_intake
):
    """Test updating address modifies existing address."""
    # Create initial address
    address = ClientAddress(
        intake_id=mock_intake.id,
        street_address="123 Main St",
        city="San Francisco",
        state="CA",
    )
    async_session.add(address)
    await async_session.commit()
    await async_session.refresh(address)

    # Update address
    new_address_data = AddressSubmission(
        street_address="456 Oak Ave", city="Los Angeles", state="CA"
    )

    result = await update_intake_address(
        async_session, mock_intake.id, new_address_data
    )

    assert result is not None
    assert result.id == address.id  # Same address object
    assert result.street_address == "456 Oak Ave"
    assert result.city == "Los Angeles"


@pytest.mark.asyncio
async def test_get_collected_address_for_intake(
    async_session: AsyncSession, mock_intake
):
    """Test retrieving address for an intake."""
    address = ClientAddress(
        intake_id=mock_intake.id,
        street_address="123 Main St",
        city="San Francisco",
        state="CA",
    )
    async_session.add(address)
    await async_session.commit()

    result = await get_collected_address_for_intake(async_session, mock_intake.id)

    assert result is not None
    assert result.street_address == "123 Main St"
    assert result.city == "San Francisco"


@pytest.mark.asyncio
async def test_get_collected_address_for_intake_not_found(
    async_session: AsyncSession, seed_configs
):
    """Test retrieving address for non-existent intake returns None."""
    result = await get_collected_address_for_intake(async_session, uuid4())
    assert result is None
