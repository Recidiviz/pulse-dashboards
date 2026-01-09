import pytest
from httpx import AsyncClient

from app.models.assessment_config import AssessmentConfig
from app.utils.string_utils import normalize_code

# =============================================================================
# Tests for GET /assessment-configs
# =============================================================================


@pytest.mark.asyncio
async def test_list_assessment_configs_success(
    async_session, client: AsyncClient, seed_configs
):
    """Test successfully listing active assessment configs for a state."""
    response = await client.get("/assessment-configs?state_code=US_UT")

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0

    # Verify structure of response
    first_config = data[0]
    assert "id" in first_config
    assert "code" in first_config
    assert "version" in first_config
    assert "display_name" in first_config
    assert "state_code" in first_config
    assert first_config["state_code"] == "US_UT"

    # Verify it includes the test config (codes are normalized to lowercase)
    codes = [config["code"] for config in data]
    assert "ccci" in codes


@pytest.mark.asyncio
async def test_list_assessment_configs_different_state(
    async_session, client: AsyncClient, seed_configs
):
    """Test listing configs for a different state."""
    response = await client.get("/assessment-configs?state_code=US_IX")

    assert response.status_code == 200
    data = response.json()

    # All configs should be for US_IX
    for config in data:
        assert config["state_code"] == "US_IX"


@pytest.mark.asyncio
async def test_list_assessment_configs_no_configs_for_state(
    async_session, client: AsyncClient, seed_configs
):
    """Test listing configs for a state with no configs."""
    response = await client.get("/assessment-configs?state_code=US_CA")

    assert response.status_code == 200
    data = response.json()

    # Should return empty list
    assert data == []


@pytest.mark.asyncio
async def test_list_assessment_configs_only_active(
    async_session, client: AsyncClient, seed_configs
):
    """Test that only active configs are returned."""
    # Create an inactive assessment config for US_UT
    inactive_config = AssessmentConfig(
        state_code="US_UT",
        code=normalize_code("INACTIVE_TEST"),
        version=1,
        display_name="Inactive Test Config",
        config_yaml="metadata:\n  code: INACTIVE_TEST\n  version: 1",
        is_active=False,
    )
    async_session.add(inactive_config)
    await async_session.commit()

    response = await client.get("/assessment-configs?state_code=US_UT")

    assert response.status_code == 200
    data = response.json()

    # Inactive config should not be in the results
    codes = [config["code"] for config in data]
    assert "inactivetest" not in codes

    # But active configs should be there
    assert "ccci" in codes


@pytest.mark.asyncio
async def test_list_assessment_configs_missing_state_code(
    async_session, client: AsyncClient
):
    """Test 422 error when state_code parameter is missing."""
    response = await client.get("/assessment-configs")

    assert response.status_code == 422  # Missing required query parameter


@pytest.mark.asyncio
async def test_list_assessment_configs_multiple_for_state(
    async_session, client: AsyncClient, seed_configs
):
    """Test that multiple configs for the same state are all returned."""
    # Add multiple configs for a state not in fixtures
    config_a = AssessmentConfig(
        state_code="US_CA",
        code=normalize_code("AAA"),
        version=1,
        display_name="A Config",
        config_yaml="metadata:\n  code: AAA\n  version: 1",
        is_active=True,
    )
    config_z = AssessmentConfig(
        state_code="US_CA",
        code=normalize_code("ZZZ"),
        version=1,
        display_name="Z Config",
        config_yaml="metadata:\n  code: ZZZ\n  version: 1",
        is_active=True,
    )
    config_m = AssessmentConfig(
        state_code="US_CA",
        code=normalize_code("MMM"),
        version=1,
        display_name="M Config",
        config_yaml="metadata:\n  code: MMM\n  version: 1",
        is_active=True,
    )

    async_session.add_all([config_z, config_a, config_m])
    await async_session.commit()

    response = await client.get("/assessment-configs?state_code=US_CA")

    assert response.status_code == 200
    data = response.json()

    # Verify all three configs are returned
    assert len(data) == 3
    codes = {config["code"] for config in data}
    assert codes == {"aaa", "zzz", "mmm"}
