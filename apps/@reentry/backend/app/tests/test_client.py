import pytest
from httpx import AsyncClient
from sqlmodel import select

from app.core.db import AsyncSession
from app.crud.intake import create_intake
from app.models.base import IntakeType
from app.models.intake import Intake, IntakeMessage, IntakeStatus


@pytest.mark.asyncio
async def test_list_clients_empty(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    monkeypatch,
):
    """Test the /clients endpoint returns an empty page when there are no clients."""
    # Mock the client data service to return empty list
    from app.services.client_data.queries import Queries

    def mock_get_clients_by_pseudonymized_staff_id(pseudonymized_staff_id: str):
        return []

    monkeypatch.setattr(
        Queries,
        "get_clients_by_pseudonymized_staff_id",
        mock_get_clients_by_pseudonymized_staff_id,
    )

    response = await client.get("/clients/")

    # Verify response
    assert_response(response, 200)
    data = response.json()

    # Verify content
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["items"] == []


@pytest.mark.asyncio
async def test_list_clients(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_intake,
):
    """Test the /clients endpoint returns all clients."""
    # Create test data - use client ID from our mock data
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    mock_intake.status = IntakeStatus.IN_PROGRESS.value
    await async_session.commit()
    await async_session.refresh(mock_intake)
    # Call the endpoint - auth headers already set in client fixture
    response = await client.get("/clients/")

    assert_response(response, 200)
    data = response.json()

    # Verify content

    assert data["total"] == 4  # Now have 4 clients in mock
    assert data["page"] == 1
    # Find the client with our intake
    client_item = next(
        (
            item
            for item in data["items"]
            if item["client_pseudo_id"] == client_pseudo_id
        ),
        None,
    )
    assert client_item is not None
    # Verify full_name structure
    assert "full_name" in client_item["client"]
    assert isinstance(client_item["client"]["full_name"], dict)
    assert client_item["client"]["full_name"]["given_names"] == "John"
    assert client_item["client"]["full_name"]["surname"] == "Doe"


# @pytest.mark.asyncio
# async def test_list_clients_filter_by_status(
#     mock_clientdata_service,
#     client: AsyncClient,
#     async_session: AsyncSession,
#     assert_response,
#     seed_configs,
# ):
#     # Add multiple clients with various statuses
#     target_status = IntakeStatus.IN_PROGRESS
#     other_status = IntakeStatus.COMPLETED
#     client_pseudo_ids = ["client-001ps", "client-002ps", "client-003ps"]
#     config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

#     for i, cid in enumerate(client_pseudo_ids):
#         status = target_status if i % 2 == 0 else other_status
#         intake = await create_intake(
#             async_session, cid, config_id, status
#         )
#         async_session.add(intake)
#     await async_session.commit()

#     response = await client.get(f"/clients/?status_filter={target_status.value}")
#     assert_response(response, 200)
#     data = response.json()

#     # Verify that all returned clients have the correct intake status
#     for item in data["items"]:
#         if item["intake"] is not None:
#             assert item["intake"]["status"] == target_status.value


@pytest.mark.asyncio
async def test_list_clients_sort_by_status(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    seed_configs,
):
    """Test the /clients endpoint supports pagination."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

    for _ in range(5):
        intake = await create_intake(
            session=async_session,
            client_pseudo_id=client_pseudo_id,
            assessment_config_id=config_id,
            status=IntakeStatus.IN_PROGRESS,
        )
        async_session.add(intake)
    await async_session.commit()

    response = await client.get("/clients/?page=1&size=2")
    assert_response(response, 200)
    data = response.json()

    assert data["total"] > 0
    assert data["page"] == 1
    assert data["size"] == 2
    assert len(data["items"]) == 2
    assert any(
        item["client"]["pseudonymized_client_id"] == client_pseudo_id
        for item in data["items"]
    )


@pytest.mark.asyncio
async def test_list_clients_pagination_edge_cases(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    seed_configs,
):
    """Test pagination edge cases including invalid page numbers and boundary conditions."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]
    # Create some test data
    for i in range(3):
        intake = await create_intake(
            session=async_session,
            client_pseudo_id=client_pseudo_id,
            assessment_config_id=config_id,
        )
        async_session.add(intake)
    await async_session.commit()

    # Test page=0 (should return validation error)
    response = await client.get("/clients/?page=0&size=2")
    assert_response(response, 422)

    # Test negative page (should return validation error)
    response = await client.get("/clients/?page=-1&size=2")
    assert_response(response, 422)

    # Test page beyond available pages (should return valid response with empty items)
    response = await client.get("/clients/?page=999&size=2")
    assert_response(response, 200)
    data = response.json()
    assert data["page"] == 999
    assert len(data["items"]) >= 0

    # Test size=0 (should return validation error)
    response = await client.get("/clients/?page=1&size=0")
    assert_response(response, 422)

    # Test very large page size (should return validation error due to max limit)
    response = await client.get("/clients/?page=1&size=1000")
    assert_response(response, 422)

    # Test maximum allowed page size (should work)
    response = await client.get("/clients/?page=1&size=100")
    assert_response(response, 200)
    data = response.json()
    assert data["size"] == 100


@pytest.mark.asyncio
async def test_list_clients_pagination_metadata(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    seed_configs,
):
    """Test that pagination metadata is correctly calculated."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]
    # Create some test data
    for i in range(5):
        intake = await create_intake(
            session=async_session,
            client_pseudo_id=client_pseudo_id,
            assessment_config_id=config_id,
        )
        async_session.add(intake)
    await async_session.commit()

    # Test with page size that creates multiple pages
    response = await client.get("/clients/?page=1&size=2")
    assert_response(response, 200)
    data = response.json()

    # Verify pagination metadata structure
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert "pages" in data
    assert "items" in data

    # Verify metadata types
    assert isinstance(data["total"], int)
    assert isinstance(data["page"], int)
    assert isinstance(data["size"], int)
    assert isinstance(data["pages"], int)
    assert isinstance(data["items"], list)

    # Verify logical relationships
    assert data["page"] >= 1
    assert data["size"] >= 1
    assert data["total"] >= 0
    if data["total"] > 0:
        expected_pages = (data["total"] + data["size"] - 1) // data["size"]
        assert data["pages"] == expected_pages
    else:
        assert data["pages"] == 0


@pytest.mark.asyncio
async def test_list_clients_pagination_with_filters(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    seed_configs,
):
    """Test that pagination works correctly with status filters."""
    # Create test data with different statuses
    client_pseudo_ids = ["client-001ps", "client-002ps", "client-003ps", "client-004ps"]
    config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

    statuses = [
        IntakeStatus.IN_PROGRESS,
        IntakeStatus.COMPLETED,
        IntakeStatus.IN_PROGRESS,
        IntakeStatus.COMPLETED,
    ]

    for client_pseudo_id, status in zip(client_pseudo_ids, statuses):
        intake = await create_intake(async_session, client_pseudo_id, config_id, status)
        async_session.add(intake)
    await async_session.commit()

    # Test pagination with status filter
    response = await client.get("/clients/?status=in_progress&page=1&size=2")
    assert_response(response, 200)
    data = response.json()

    # Verify pagination metadata with filtering
    assert data["page"] == 1
    assert data["size"] == 2


@pytest.mark.asyncio
async def test_list_clients_pagination_empty_results(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
):
    """Test pagination behavior when no results match the criteria."""
    # Don't create any test data, and use search filter that won't match mock data

    # Test pagination with search filter that returns no results
    response = await client.get(
        "/clients/?search=nonexistent_client_name&page=1&size=10"
    )
    assert_response(response, 200)
    data = response.json()

    # Verify empty pagination response structure
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["size"] == 10
    assert data["pages"] >= 0
    assert isinstance(data["items"], list)


# =============================================================================
# Tests for GET /clients/{client_pseudo_id}/intakes
# =============================================================================


@pytest.mark.asyncio
async def test_get_client_intakes_success(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test successfully retrieving intake history for a client."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create multiple intakes for the client
    intake1 = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        assessment_config_id=assessment_config_id,
        status=IntakeStatus.COMPLETED,
    )

    intake2 = await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        assessment_config_id=assessment_config_id,
        status=IntakeStatus.IN_PROGRESS,
    )

    response = await client.get(f"/clients/{client_pseudo_id}/intakes")

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 2

    # Verify structure
    first_intake = data[0]
    assert "id" in first_intake
    assert "created_at" in first_intake
    assert "status" in first_intake
    assert "intake_type" in first_intake
    assert "assessment_config_code" in first_intake
    assert "assessment_config_display_name" in first_intake

    # Verify they're ordered by created_at DESC (newest first)
    # intake2 was created after intake1, so it should be first
    assert str(data[0]["id"]) == str(intake2.id)
    assert str(data[1]["id"]) == str(intake1.id)

    # Verify assessment config info is included (codes are normalized to lowercase)
    assert data[0]["assessment_config_code"] == "facr"
    assert data[0]["assessment_config_display_name"] is not None


@pytest.mark.asyncio
async def test_get_client_intakes_empty(
    async_session, client: AsyncClient, mock_clientdata_service
):
    """Test retrieving intake history for a client with no intakes."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    response = await client.get(f"/clients/{client_pseudo_id}/intakes")

    assert response.status_code == 200
    data = response.json()

    assert data == []


@pytest.mark.asyncio
async def test_get_client_intakes_multiple_statuses(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test that all intakes are returned regardless of status."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    assessment_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]

    # Create intakes with different statuses
    await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        assessment_config_id=assessment_config_id,
        status=IntakeStatus.CREATED,
    )

    await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        assessment_config_id=assessment_config_id,
        status=IntakeStatus.IN_PROGRESS,
    )

    await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        assessment_config_id=assessment_config_id,
        status=IntakeStatus.COMPLETED,
    )

    response = await client.get(f"/clients/{client_pseudo_id}/intakes")

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 3

    # Verify all statuses are present
    statuses = {intake["status"] for intake in data}
    assert IntakeStatus.CREATED.value in statuses
    assert IntakeStatus.IN_PROGRESS.value in statuses
    assert IntakeStatus.COMPLETED.value in statuses


@pytest.mark.asyncio
async def test_get_client_intakes_multiple_types(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test that all intake types are returned."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]
    conversation_config_id = seed_configs["assessments"][("US_IX", "facr", 0)]
    transcription_config_id = seed_configs["assessments"][("US_TEST", "tran", 0)]

    # Create intakes with different types
    await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        assessment_config_id=conversation_config_id,
        status=IntakeStatus.COMPLETED,
    )

    await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        assessment_config_id=transcription_config_id,
        status=IntakeStatus.COMPLETED,
    )

    response = await client.get(f"/clients/{client_pseudo_id}/intakes")

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 2

    # Verify all types are present
    types = {intake["intake_type"] for intake in data}
    assert IntakeType.CONVERSATION.value in types
    assert IntakeType.TRANSCRIPTION.value in types


@pytest.mark.asyncio
async def test_get_client_intakes_different_assessment_configs(
    async_session, client: AsyncClient, mock_clientdata_service, seed_configs
):
    """Test intakes with different assessment configs show correct config info."""
    client_pseudo_id = mock_clientdata_service["client_pseudo_id"]

    # Use two different configs (both conversation type for same client state US_IX)
    config_id_1 = seed_configs["assessments"][("US_IX", "facr", 0)]
    config_id_2 = seed_configs["assessments"][("US_TEST", "tran", 0)]

    await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        assessment_config_id=config_id_1,
        status=IntakeStatus.COMPLETED,
    )

    await create_intake(
        session=async_session,
        client_pseudo_id=client_pseudo_id,
        assessment_config_id=config_id_2,
        status=IntakeStatus.COMPLETED,
    )

    response = await client.get(f"/clients/{client_pseudo_id}/intakes")

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 2

    # Verify both configs are represented correctly (codes are normalized to lowercase)
    codes = {intake["assessment_config_code"] for intake in data}
    assert "facr" in codes
    assert "tran" in codes


@pytest.mark.asyncio
async def test_reset_client_data(
    mock_clientdata_service,
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    seed_configs,
):
    client_pseudo_id = "client-001ps"
    assessment_config_id = seed_configs["assessments"][("US_UT", "ccci", 0)]

    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.COMPLETED,
        assessment_config_id=assessment_config_id,
    )
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    message = IntakeMessage(
        intake_id=intake.id, from_role="client", content="Test", section="Test"
    )
    async_session.add(message)
    await async_session.commit()

    response = await client.delete(f"/clients/{client_pseudo_id}/reset")

    assert_response(response, 200)
    data = response.json()

    assert data["total_deleted"] == 2

    result = await async_session.exec(
        select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
    )
    assert len(result.all()) == 0
