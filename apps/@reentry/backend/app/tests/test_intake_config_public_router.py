import pytest
from httpx import AsyncClient

from app.core.db import AsyncSession


@pytest.mark.asyncio
async def test_get_conversation_state_codes(
    client: AsyncClient,
    async_session: AsyncSession,
    seed_configs,
    assert_response,
):
    """Test retrieving state codes with active conversation intake assessments"""
    # Call the public endpoint (no auth required)
    response = await client.get("/public/intake-config/conversation-states")

    # Verify response
    assert_response(response, 200)
    data = response.json()

    # Verify response structure
    assert "state_codes" in data
    assert isinstance(data["state_codes"], list)

    # Verify correct state codes are returned
    # From test fixtures: US_IX, US_TEST (testnooutput), and US_UT have conversation type
    # US_AZ has external type, US_TEST (tran) has transcription type
    expected_states = ["US_IX", "US_TEST", "US_UT"]  # Sorted alphabetically
    assert data["state_codes"] == expected_states


@pytest.mark.asyncio
async def test_get_conversation_state_codes_empty_database(
    client: AsyncClient,
    async_session: AsyncSession,
    assert_response,
):
    """Test endpoint returns empty list when no conversation configs exist"""
    # Don't use seed_configs fixture - database will be empty

    response = await client.get("/public/intake-config/conversation-states")

    assert_response(response, 200)
    data = response.json()

    # Should return empty list
    assert data["state_codes"] == []
