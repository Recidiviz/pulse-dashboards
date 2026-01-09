import uuid

import pytest
from httpx import AsyncClient

from app.core.db import AsyncSession
from app.models.assessment import Assessment


@pytest.mark.asyncio
async def test_get_assessment_by_id(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
    mock_clientdata_service,
    mock_intake,
):
    """Test retrieving an assessment by ID."""
    # Create test data
    client_pseudo_id = mock_clientdata_service[
        "client_pseudo_id"
    ]  # Using mock client ID from fixture

    assessment = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=mock_intake.id,
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
    assert data["client_pseudo_id"] == client_pseudo_id
    assert str(data["intake_id"]) == str(
        mock_intake.id
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
    mock_clientdata_service,
    mock_intake,
):
    """Test retrieving all assessments for an intake."""
    # Create test data with multiple assessments for an intake
    client_pseudo_id = mock_clientdata_service[
        "client_pseudo_id"
    ]  # Using mock client ID from fixture

    # Create two assessments for the same intake
    assessment1 = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=mock_intake.id,
    )
    assessment2 = Assessment(
        client_pseudo_id=client_pseudo_id,
        intake_id=mock_intake.id,
    )

    async_session.add(assessment1)
    async_session.add(assessment2)
    await async_session.commit()

    # Call the endpoint
    response = await client.get(f"/assessments/intakes/{mock_intake.id}")

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
    """Test retrieving assessments for a non-existent intake returns empty list."""
    import uuid

    # Use a non-existent intake ID
    non_existent_intake_id = uuid.uuid4()

    # Call the endpoint
    response = await client.get(f"/assessments/intakes/{non_existent_intake_id}")

    # Should return empty list
    assert_response(response, 200)
    data = response.json()
    assert len(data) == 0
