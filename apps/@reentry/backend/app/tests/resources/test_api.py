"""test_api
Tests for app.services.resources.api module, which has the core responsibility
for calling the external Resource API and propagating errors appropriately.

Tests the discover_resources function, error handling, and model validation
for interacting with the external resources API.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import status
from pydantic import ValidationError

from app.services.resources.api import (
    BadResourceAPIRequest,
    DiscoveredResource,
    LatLon,
    ResourceAPIFailure,
    TravelMode,
    discover_resources,
    get_bad_response_detail,
)
from app.services.resources.resource_taxonomy import (
    ProviderOrigin,
    ResourceCategory,
    ResourceSubcategory,
)
from app.services.resources.types import GetResourcesRequest

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def valid_discover_request():
    """Valid GetResourcesRequest for testing."""
    return GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        address="123 Main St, New York, NY",
        distance_miles=50,
        travel_mode=TravelMode.DRIVE,
    )


@pytest.fixture
def valid_resource_data():
    """Valid resource data matching DiscoveredResource schema."""
    return {
        "google_place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
        "address": "123 Main St, New York, NY 10001",
        "location": {"latitude": 40.7128, "longitude": -74.0060},
        "category": "Basic Needs",
        "subcategory": "Food assistance",
        "name": "Main Street Food Bank",
        "email": "info@foodbank.org",
        "phone": "212-555-1234",
        "website": "https://foodbank.org",
        "description": "Community food bank serving the local area",
        "origin": "GOOGLE",
        "rating": 4.5,
        "rating_count": 127,
        "travel_mode": "DRIVE",
        "travel_duration_minutes": 15,
        "travel_distance_miles": 5.2,
    }


@pytest.fixture
def mock_async_client():
    """Mock httpx.AsyncClient for testing."""
    return AsyncMock(spec=httpx.AsyncClient)


@pytest.fixture(autouse=True)
def mock_settings():
    """Mock settings with valid configuration."""
    with patch("app.services.resources.api.settings") as mock:
        mock.RESOURCE_API_URL = "https://api.example.com"
        mock.RESOURCE_API_KEY = "test-api-key"
        yield mock


# ============================================================================
# Tests for discover_resources() - Success Scenarios
# ============================================================================


@pytest.mark.asyncio
async def test_discover_resources_success(
    mock_async_client, valid_discover_request, valid_resource_data
):
    """Test successful resource discovery with valid response."""
    # Setup mock response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [valid_resource_data]
    mock_async_client.post.return_value = mock_response

    result = await discover_resources(mock_async_client, valid_discover_request)

    assert len(result) == 1
    assert result[0] == DiscoveredResource(**valid_resource_data)

    mock_async_client.post.assert_called_once()


@pytest.mark.asyncio
async def test_discover_resources_no_content(mock_async_client, valid_discover_request):
    """Test handling of 204 No Content (no resources found)."""
    mock_response = MagicMock()
    mock_response.status_code = status.HTTP_204_NO_CONTENT
    mock_async_client.post.return_value = mock_response

    result = await discover_resources(mock_async_client, valid_discover_request)

    assert result == []


@pytest.mark.asyncio
async def test_discover_resources_multiple_results(
    mock_async_client, valid_discover_request, valid_resource_data
):
    """Test successful discovery handling with multiple resources."""
    # Create second resource
    resource_2 = valid_resource_data.copy()
    resource_2["name"] = "Second Food Bank"
    resource_2["google_place_id"] = "ChIJ_different_id"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [valid_resource_data, resource_2]
    mock_async_client.post.return_value = mock_response

    result = await discover_resources(mock_async_client, valid_discover_request)

    assert len(result) == 2
    assert result[0].name == "Main Street Food Bank"
    assert result[1].name == "Second Food Bank"


@pytest.mark.asyncio
async def test_discover_resources_without_travel_mode(
    mock_async_client, valid_resource_data
):
    """Test resource discovery without travel mode specified."""
    # Create resource without travel info
    resource_no_travel = valid_resource_data.copy()
    resource_no_travel["travel_mode"] = None
    resource_no_travel["travel_duration_minutes"] = None
    resource_no_travel["travel_distance_miles"] = None

    request = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        address="123 Main St, New York, NY",
    )

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [resource_no_travel]
    mock_async_client.post.return_value = mock_response

    result = await discover_resources(mock_async_client, request)

    assert len(result) == 1
    assert result[0].travel_mode is None
    assert result[0].travel_duration_minutes is None


# ============================================================================
# Tests for discover_resources() - Error Scenarios
# ============================================================================


@pytest.mark.parametrize("key", ["RESOURCE_API_KEY", "RESOURCE_API_URL"])
@pytest.mark.asyncio
async def test_discover_resources_missing_environment(
    key, mock_async_client, valid_discover_request
):
    """Test EnvironmentError raised when required settings are not configured."""
    with patch("app.services.resources.api.settings") as poor_settings:
        setattr(poor_settings, key, None)
        with pytest.raises(EnvironmentError, match=f"{key} is not configured"):
            await discover_resources(mock_async_client, valid_discover_request)


@pytest.mark.parametrize(
    "response_info",
    [
        (
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            BadResourceAPIRequest,
            "We sent an incorrect request to the Resource API",
        ),
        (status.HTTP_502_BAD_GATEWAY, ResourceAPIFailure, "The Resource API failed"),
        (
            status.HTTP_503_SERVICE_UNAVAILABLE,
            ResourceAPIFailure,
            "The Resource API failed",
        ),
        (status.HTTP_418_IM_A_TEAPOT, ResourceAPIFailure, "The Resource API failed"),
    ],
)
@pytest.mark.asyncio
async def test_discover_resources_non_success_handling(
    response_info, mock_async_client, valid_discover_request
):
    """Test BadResourceAPIRequest raised from various status codes."""
    mock_response = MagicMock()
    status_code, err_type, msg = response_info
    mock_response.status_code = status_code
    mock_response.json.return_value = {"detail": "detailed message"}
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        "error",
        request=MagicMock(),
        response=mock_response,
    )
    mock_async_client.post.return_value = mock_response

    with pytest.raises(err_type, match=f"{msg}: detailed message"):
        await discover_resources(mock_async_client, valid_discover_request)


@pytest.mark.asyncio
async def test_discover_resources_received_data_doesnt_parse(
    mock_async_client, valid_discover_request
):
    """Test ResourceAPIFailure raised when response data doesn't match schema."""
    # Response missing required fields
    invalid_resource = {
        "google_place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
        "address": "123 Main St",
        # Missing required fields like location, category, etc.
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [invalid_resource]
    mock_async_client.post.return_value = mock_response

    with pytest.raises(
        ResourceAPIFailure,
        match="Unable to parse Resource API data, does raw output match",
    ):
        await discover_resources(mock_async_client, valid_discover_request)


@pytest.mark.asyncio
async def test_discover_resources_unexpected_exception(
    mock_async_client, valid_discover_request
):
    """Test ResourceAPIFailure for unexpected exceptions during parsing."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.side_effect = Exception("Unexpected error")
    mock_async_client.post.return_value = mock_response

    with pytest.raises(
        ResourceAPIFailure, match="The Resource API failed: Unknown reason, see logs."
    ):
        await discover_resources(mock_async_client, valid_discover_request)


# ============================================================================
# Tests for get_bad_response_detail() Helper Function
# ============================================================================


def test_get_bad_response_detail_success():
    """Test extracting error detail from valid error response."""
    mock_response = MagicMock()
    mock_response.json.return_value = {"detail": "Invalid request parameters"}
    mock_response.status_code = 422

    result = get_bad_response_detail(mock_response)

    assert result == "Invalid request parameters"


def test_get_bad_response_detail_error_when_parsing():
    """Test handling of invalid JSON in error response."""
    mock_response = MagicMock()
    mock_response.json.side_effect = ValueError("Invalid JSON")
    mock_response.status_code = 500

    result = get_bad_response_detail(mock_response)

    assert result == "Unknown reason, see logs."


def test_get_bad_response_detail_missing_detail_key():
    """Test handling of response without 'detail' key."""
    mock_response = MagicMock()
    mock_response.json.return_value = {"error": "Something went wrong"}
    mock_response.status_code = 500

    result = get_bad_response_detail(mock_response)

    assert result == "Unknown reason, see logs."


# ============================================================================
# Model Validation Tests
# ============================================================================


def test_discover_resource_request_valid():
    """Test GetResourcesRequest with all valid fields."""
    _ = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        address="123 Main St, New York, NY",
        distance_miles=50,
        travel_mode=TravelMode.DRIVE,
    )

    w_defaults = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        address="123 Main St, New York, NY",
    )

    assert w_defaults.distance_miles == 100
    assert w_defaults.travel_mode is None


def test_discover_resource_request_missing_required_fields():
    """Test GetResourcesRequest validation with missing required fields."""
    with pytest.raises(ValidationError) as exc_info:
        GetResourcesRequest(  # type: ignore
            category=ResourceCategory.BASIC_NEEDS,
        )
    errors = exc_info.value.errors()
    assert len(errors) >= 2
    error_fields = {e["loc"][0] for e in errors}
    assert "subcategory" in error_fields
    assert "address" in error_fields


def test_discovered_resource_valid():
    """Test DiscoveredResource with all valid fields."""
    resource = DiscoveredResource(
        google_place_id="ChIJN1t_tDeuEmsRUsoyG83frY4",
        address="123 Main St, New York, NY 10001",
        location=LatLon(latitude=40.7128, longitude=-74.0060),
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        name="Main Street Food Bank",
        email="info@foodbank.org",
        phone="212-555-1234",
        website="https://foodbank.org",
        description="Community food bank",
        origin=ProviderOrigin.GOOGLE,
        rating=4.5,
        rating_count=127,
        travel_mode=TravelMode.DRIVE,
        travel_duration_minutes=15,
        travel_distance_miles=5.2,
    )
    # Check we can pass in a dict successfully
    resource.location = {"latitude": 1.234, "longitude": 4.567}


def test_discovered_resource_missing_required_fields():
    """Test DiscoveredResource validation with missing required fields."""
    with pytest.raises(ValidationError):
        DiscoveredResource(  # type: ignore
            google_place_id="ChIJN1t_tDeuEmsRUsoyG83frY4",
        )


def test_travel_mode_enum_invalid():
    """Test invalid TravelMode value raises error."""
    with pytest.raises(ValidationError):
        GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="123 Main St",
            travel_mode="FLYING",  # type: ignore
        )


def test_lat_lon_invalid():
    """Test LatLon validation with invalid data."""
    with pytest.raises(ValidationError):
        LatLon(latitude="invalid", longitude=-74.0060)  # type: ignore
