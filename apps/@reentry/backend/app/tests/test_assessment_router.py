import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment
from app.models.intake import Intake


@pytest.mark.asyncio
async def test_get_assessment_by_id(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
):
    """Test retrieving an assessment by ID."""
    # Create test data
    client_id = "client-001"  # Using mock client ID from fixture
    intake = Intake(client_id=client_id)
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    assessment = Assessment(
        client_id=client_id,
        intake_id=intake.id,
    )
    async_session.add(assessment)
    await async_session.commit()
    await async_session.refresh(assessment)

    # Call the endpoint
    response = await client.get(f"/assessments/{assessment.id}")

    # Verify response
    assert_response(response, 200)
    data = response.json()

    # Verify content
    assert data["id"] == str(assessment.id)
    assert data["client_id"] == client_id
    assert str(data["intake_id"]) == str(
        intake.id
    )  # Compare as strings since it's a UUID
    assert "status" in data


@pytest.mark.asyncio
async def test_get_assessment_by_nonexistent_id(
    client: AsyncClient, async_session, assert_response
):
    """Test retrieving a non-existent assessment returns 404."""
    # Use a non-existent ID
    non_existent_id = str(uuid.uuid4())

    # Call the endpoint
    response = await client.get(f"/assessments/{non_existent_id}")

    # Verify response is 404
    assert_response(response, 404)


@pytest.mark.asyncio
async def test_get_client_assessments(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
):
    """Test retrieving all assessments for a client."""
    # Create test data with multiple assessments for a client
    client_id = "client-001"  # Using mock client ID from fixture
    intake = Intake(client_id=client_id)
    async_session.add(intake)
    await async_session.commit()
    await async_session.refresh(intake)

    # Create two assessments for the same client
    assessment1 = Assessment(
        client_id=client_id,
        intake_id=intake.id,
    )
    assessment2 = Assessment(
        client_id=client_id,
        intake_id=intake.id,
    )

    async_session.add(assessment1)
    async_session.add(assessment2)
    await async_session.commit()

    # Call the endpoint
    response = await client.get(f"/assessments/clients/{client_id}")

    # Verify response
    assert_response(response, 200)
    data = response.json()

    # Verify content - should have both assessments
    assert len(data) == 2
    assessment_ids = {assessment["id"] for assessment in data}
    assert str(assessment1.id) in assessment_ids
    assert str(assessment2.id) in assessment_ids


@pytest.mark.asyncio
async def test_get_assessments_for_nonexistent_client(
    client: AsyncClient, async_session, assert_response
):
    """Test retrieving assessments for a non-existent client returns empty list."""
    # Use a non-existent client ID
    non_existent_client_id = "non-existent-client"

    # Call the endpoint
    response = await client.get(f"/assessments/clients/{non_existent_client_id}")

    # Should return empty list
    assert_response(response, 200)
    data = response.json()
    assert len(data) == 0
