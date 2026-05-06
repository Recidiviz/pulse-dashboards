import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from app.models.models import ResourceAssociationType
from app.services.resources import (
    CATEGORY_SUBCATEGORY_MAP,
    ApiSearchResult,
    BatchGetResources,
    GetResourcesRequest,
    Location,
    Resource,
    ResourceCategory,
    ResourceCategoryLegacy,
    ResourceFailureReason,
    ResourceSubcategory,
    ResourceSubcategoryLegacy,
    TravelMode,
    is_category,
    is_subcategory,
    list_resources,
)
from app.services.resources.api import batch_get_resources
from app.utils.disallowed_resources import DISALLOWED_RESOURCE_NAMES

CHICAGO = "Chicago, IL"


def test_travel_mode_legacy_values():
    """Test that TravelMode enum handles legacy travel mode values and case normalization."""
    # Test legacy values (old format)
    assert TravelMode("DRIVING") == TravelMode.DRIVING
    assert TravelMode("WALKING") == TravelMode.WALKING
    assert TravelMode("BICYCLING") == TravelMode.BICYCLING
    assert TravelMode("TRANSIT") == TravelMode.TRANSIT

    # Test new values (API format)
    assert TravelMode("DRIVE") == TravelMode.DRIVING
    assert TravelMode("WALK") == TravelMode.WALKING
    assert TravelMode("BICYCLE") == TravelMode.BICYCLING

    # Test case insensitivity
    assert TravelMode("driving") == TravelMode.DRIVING
    assert TravelMode("walking") == TravelMode.WALKING
    assert TravelMode("bicycling") == TravelMode.BICYCLING
    assert TravelMode("transit") == TravelMode.TRANSIT
    assert TravelMode("drive") == TravelMode.DRIVING
    assert TravelMode("walk") == TravelMode.WALKING
    assert TravelMode("bicycle") == TravelMode.BICYCLING

    # Test that enum values are correct (Google API format)
    assert TravelMode.DRIVING.value == "DRIVE"
    assert TravelMode.WALKING.value == "WALK"
    assert TravelMode.BICYCLING.value == "BICYCLE"
    assert TravelMode.TRANSIT.value == "TRANSIT"

    with pytest.raises(ValueError):
        TravelMode("")

    with pytest.raises(ValueError):
        TravelMode("wrong")


def test_get_resources_request_with_legacy_travel_mode():
    """Test that GetResourcesRequest accepts legacy travel mode values."""
    request = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS.value,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE.value,
        address="123 Main St, Anytown, USA",
        travel_mode="DRIVING",  # Legacy format
    )
    assert request.travel_mode == TravelMode.DRIVING
    assert request.travel_mode.value == "DRIVE"

    # Test with new API value
    request = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS.value,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE.value,
        address="123 Main St, Anytown, USA",
        travel_mode="DRIVE",
    )
    assert request.travel_mode == TravelMode.DRIVING

    # Test with lowercase
    request = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS.value,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE.value,
        address="123 Main St, Anytown, USA",
        travel_mode="walking",
    )
    assert request.travel_mode == TravelMode.WALKING
    assert request.travel_mode.value == "WALK"

    with pytest.raises(ValueError):
        GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS.value,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE.value,
            address="123 Main St, Anytown, USA",
            travel_mode="FLYING",  # Invalid value
        )


def test_build_GetResourcesRequest__invalid_address():
    """Tests we don't build a GetResourcesRequest when the address is invalid."""
    for addr in [None, 42, [CHICAGO]]:
        with pytest.raises(
            ValueError, match=r"1 validation error for GetResourcesRequest\naddress"
        ):
            GetResourcesRequest(
                category=ResourceCategory.BASIC_NEEDS.value,
                subcategory=ResourceSubcategory.FOOD_ASSISTANCE.value,
                address=addr,  # type: ignore
                limit=10,
            )


@pytest.mark.parametrize("field_name", ["category", "subcategory", "address"])
def test_build_GetResourcesRequest__missing_required_fields(field_name):
    """Tests we don't build a GetResourcesRequest when we're missing required fields."""
    data = {
        "category": ResourceCategory.BASIC_NEEDS.value,
        "subcategory": ResourceSubcategory.FOOD_ASSISTANCE.value,
        "address": "123 Main St, Anytown, USA",
    }
    data.pop(field_name)
    with pytest.raises(ValueError, match="type=missing"):
        GetResourcesRequest(**data)


@pytest.mark.parametrize(
    "resource_type",
    list(CATEGORY_SUBCATEGORY_MAP.keys()),
)
@pytest.mark.asyncio
async def test_resource_type_get_result(resource_type: ResourceCategory):
    # Get the first subcategory from the list (if available)
    subcategories = CATEGORY_SUBCATEGORY_MAP[resource_type]
    subcategory = subcategories[0] if subcategories else None

    # Create a request with the category and first subcategory (as strings)
    request = GetResourcesRequest(
        category=resource_type.value,
        subcategory=subcategory.value,
        address="123 Anywhere St, UT 84057",
        limit=10,
    )
    response = await list_resources(request)

    assert response is not None
    assert response.resources is not None
    # Test new fields
    assert hasattr(response, "failure_reason")
    assert hasattr(response, "error_message")
    if response.resources:
        assert response.failure_reason == ResourceFailureReason.SUCCESS
    else:
        assert response.failure_reason in (
            ResourceFailureReason.NO_RESULTS_FOUND,
            ResourceFailureReason.API_ERROR,
        )


@pytest.mark.asyncio
async def test_get_resources_success_status():
    """Test that successful resource retrieval returns SUCCESS status"""

    # Mock the API call to return a resource
    mock_results = [
        ApiSearchResult(
            google_place_id="test_place_123",
            name="Test Housing Resource",
            category=ResourceCategory.HOUSING,
            subcategory=ResourceSubcategory.EMERGENCY,
            origin="TEST",
            resource_id=1,
            location=Location(latitude=40.2969, longitude=-111.6946),
            address="123 Test St, Orem, UT 84057",
            phone="555-1234",
            website="https://test-resource.example.com",
            rating=4.5,
            rating_count=100,
        )
    ]

    with patch(
        "app.services.resources.api._call_resource_api",
        new_callable=AsyncMock,
    ) as mock_api:
        mock_api.return_value = mock_results

        # Use a new category/subcategory that routes to new API
        request = GetResourcesRequest(
            category=ResourceCategory.HOUSING.value,
            subcategory=ResourceSubcategory.EMERGENCY.value,
            address="123 Anywhere St, UT 84057",
            limit=10,
        )
        response = await list_resources(request)

        # Should have resources and SUCCESS status
        assert response.resources
        assert len(response.resources) > 0
        assert response.failure_reason == ResourceFailureReason.SUCCESS
        assert response.error_message is None

        # Test with empty results
        mock_api.return_value = []
        response = await list_resources(request)

        # Should have no resources and NO_RESULTS_FOUND status
        assert len(response.resources) == 0
        assert response.failure_reason == ResourceFailureReason.NO_RESULTS_FOUND
        assert response.error_message is None


@pytest.mark.asyncio
async def test_fetch_resources_with_retry_success():
    """Returns resources immediately when the first API call succeeds."""
    from app.services.resources import GetResourcesResponse, Resource
    from app.utils.resources_utils import fetch_resources_with_retry

    resource = Resource(
        id="res-001",
        resource_id=1,
        category=ResourceCategory.HOUSING,
        name="Test Shelter",
    )
    response = GetResourcesResponse(
        resources=[resource], failure_reason=ResourceFailureReason.SUCCESS
    )

    with patch(
        "app.utils.resources_utils.list_resources",
        new_callable=AsyncMock,
        return_value=response,
    ) as mock_api:
        result = await fetch_resources_with_retry(
            GetResourcesRequest(
                category=ResourceCategory.HOUSING.value,
                subcategory=ResourceSubcategory.EMERGENCY.value,
                address="123 Main St, Chicago, IL",
            )
        )

    assert result == [resource]
    mock_api.assert_called_once()


@pytest.mark.asyncio
async def test_fetch_resources_with_retry_no_results_returns_immediately():
    """Returns an empty list on NO_RESULTS_FOUND without making additional attempts."""
    from app.services.resources import GetResourcesResponse
    from app.utils.resources_utils import fetch_resources_with_retry

    no_results_response = GetResourcesResponse(
        resources=[], failure_reason=ResourceFailureReason.NO_RESULTS_FOUND
    )

    with patch(
        "app.utils.resources_utils.list_resources",
        new_callable=AsyncMock,
        return_value=no_results_response,
    ) as mock_api:
        result = await fetch_resources_with_retry(
            GetResourcesRequest(
                category=ResourceCategory.HOUSING.value,
                subcategory=ResourceSubcategory.EMERGENCY.value,
                address="123 Main St, Chicago, IL",
            ),
            max_retries=2,
        )

    assert result == []
    # Called exactly once — no retry on NO_RESULTS_FOUND
    mock_api.assert_called_once()


@pytest.mark.asyncio
async def test_fetch_resources_with_retry_retries_on_api_error():
    """Retries on API_ERROR and returns resources when a subsequent attempt succeeds."""
    from app.services.resources import GetResourcesResponse, Resource
    from app.utils.resources_utils import fetch_resources_with_retry

    resource = Resource(
        id="res-002",
        resource_id=2,
        category=ResourceCategory.HOUSING,
        name="Test Shelter",
    )
    error_response = GetResourcesResponse(
        resources=[],
        failure_reason=ResourceFailureReason.API_ERROR,
        error_message="500",
    )
    success_response = GetResourcesResponse(
        resources=[resource], failure_reason=ResourceFailureReason.SUCCESS
    )

    with patch(
        "app.utils.resources_utils.list_resources",
        new_callable=AsyncMock,
        side_effect=[error_response, success_response],
    ) as mock_api:
        with patch("asyncio.sleep", new_callable=AsyncMock):
            result = await fetch_resources_with_retry(
                GetResourcesRequest(
                    category=ResourceCategory.HOUSING.value,
                    subcategory=ResourceSubcategory.EMERGENCY.value,
                    address="123 Main St, Chicago, IL",
                ),
                max_retries=2,
            )

    assert result == [resource]
    assert mock_api.call_count == 2


@pytest.mark.asyncio
async def test_fetch_resources_with_retry_exhausted_returns_empty():
    """Returns an empty list after all retry attempts fail with API_ERROR."""
    from app.services.resources import GetResourcesResponse
    from app.utils.resources_utils import fetch_resources_with_retry

    error_response = GetResourcesResponse(
        resources=[],
        failure_reason=ResourceFailureReason.API_ERROR,
        error_message="503",
    )

    with patch(
        "app.utils.resources_utils.list_resources",
        new_callable=AsyncMock,
        return_value=error_response,
    ) as mock_api:
        with patch("asyncio.sleep", new_callable=AsyncMock):
            result = await fetch_resources_with_retry(
                GetResourcesRequest(
                    category=ResourceCategory.HOUSING.value,
                    subcategory=ResourceSubcategory.EMERGENCY.value,
                    address="123 Main St, Chicago, IL",
                ),
                max_retries=2,
            )

    assert result == []
    # 1 initial attempt + 2 retries = 3 total
    assert mock_api.call_count == 3


async def test_get_resources_with_exclusion_api(client):
    # Using food assistance resource type, exclude a resource
    category = ResourceCategory.BASIC_NEEDS.value
    subcategory = ResourceSubcategory.FOOD_ASSISTANCE.value

    # First check if there are resources available
    response = await client.post(
        "/resources",
        json={
            "category": category,
            "subcategory": subcategory,
            "address": "123 Anywhere St, UT 84057",
        },
    )
    assert response.status_code == 200
    response_json = response.json()
    assert response_json is not None

    # Test new fields
    assert "failure_reason" in response_json
    assert "error_message" in response_json

    # Skip detailed testing if no resources are available
    if len(response_json["resources"]) > 0:
        # Get the name of the first resource to exclude
        resource_name = response_json["resources"][0]["name"]

        # Now exclude it
        response = await client.post(
            "/resources",
            json={
                "category": category,
                "subcategory": subcategory,
                "address": "123 Anywhere St, UT 84057",
                "exclude_names": [resource_name],
            },
        )
        assert response.status_code == 200
        response_json = response.json()
        assert response_json is not None

        # The excluded resource should not be in the results
        names_after_exclusion = [r["name"].lower() for r in response_json["resources"]]
        assert resource_name.lower() not in names_after_exclusion


async def test_get_resources_invalid_resource_type_api(client):
    response = await client.post(
        "/resources",
        json={
            "category": "INVALID_CATEGORY",
            "address": "123 Anywhere St, UT 84057",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.integration
async def test_call_list_resources():
    request = GetResourcesRequest(
        category=ResourceCategory.EMPLOYMENT.value,
        subcategory=ResourceSubcategory.SECOND_CHANCE.value,
        address="748 N 1340 W Orem, UT 84057",
        limit=50,
    )
    response = await list_resources(request)
    print(f"Request: {request}")
    print(f"Response: {response}")
    assert response.resources, "Expected resources but got None or empty list"


def test_resource_is_allowed():
    from app.services.resources import Resource, resource_is_allowed

    allowed = Resource(
        id="1",
        resource_id=1,
        category=ResourceCategory.BASIC_NEEDS,
        name="test name",
        address="test address",
    )
    assert resource_is_allowed(allowed) is True

    # disallowed by name
    disallowed_name = Resource(
        id="2",
        resource_id=2,
        category=ResourceCategory.BASIC_NEEDS,
        name="Bonneville Community Correctional Center",
        address="test address",
    )
    assert resource_is_allowed(disallowed_name) is False

    # disallowed by address
    disallowed_address = Resource(
        id="3",
        resource_id=3,
        category=ResourceCategory.BASIC_NEEDS,
        name="test name",
        address="80 South Orange Street, Salt Lake City, UT",
    )
    assert resource_is_allowed(disallowed_address) is False

    # check null values are handled
    assert resource_is_allowed(None) is False

    # default to allow if resource only has partial data.
    incomplete_resource = Resource(
        id="4",
        resource_id=4,
        category=ResourceCategory.BASIC_NEEDS,
        name="test name",
        address=None,
    )
    assert resource_is_allowed(incomplete_resource) is True


@pytest.mark.asyncio
@pytest.mark.integration
async def test_disallowed_resources():
    correctional_centers_address = {
        "80 South Orange Street, Salt Lake City, UT",
        "748 North 1340 W, Orem, UT",
        "1141 South 2475 West, Salt Lake City, UT",
        "1747 South 900 West, Salt Lake City, UT",
        "2445 South Water Tower Way, Ogden, UT",
        "2588 West 2365 South, West Valley City, UT",
    }
    # Test with a sample of category/subcategory pairs (new taxonomy)
    requests = [
        GetResourcesRequest(
            category=resource_category.value,
            subcategory=subcategories[0].value,
            address=current_address,
            limit=50,
        )
        for current_address in correctional_centers_address
        for resource_category, subcategories in CATEGORY_SUBCATEGORY_MAP.items()
        if subcategories  # Only test categories that have subcategories
    ]
    responses = await asyncio.gather(*map(list_resources, requests))
    all_found_resource_names: set[str] = {
        resource.name for response in responses for resource in response.resources
    }
    assert not all_found_resource_names.intersection((DISALLOWED_RESOURCE_NAMES))


# ============================================================================
# Tests for New Taxonomy and Routing Logic
# ============================================================================


def test_is_category():
    """Test that is_category correctly identifies new categories."""
    # New categories should return True
    assert is_category("Housing") is True
    assert is_category("Employment") is True
    assert is_category("Basic Needs") is True
    assert is_category("Mental Health") is True
    assert is_category("Substance Use") is True
    assert is_category("Physical Health") is True
    assert is_category("Legal Aid & Rights Restoration") is True
    assert is_category("Education & Vocational Training") is True
    assert is_category("Family Reconnection & Parenting") is True
    assert is_category("Peer Support & Community Integration") is True

    # Legacy categories should return False
    assert is_category("Employment and Career Support") is False
    assert is_category("Behavioral Health Services") is False
    assert is_category("Medical and Health Services") is False

    # Invalid categories should return False
    assert is_category("Invalid Category") is False
    assert is_category("") is False


def test_is_subcategory():
    """Test that is_subcategory correctly identifies new subcategories."""
    # New subcategories should return True
    assert is_subcategory("Emergency housing and shelters") is True
    assert is_subcategory("Second-chance employer") is True
    assert is_subcategory("Food assistance") is True
    assert is_subcategory("Therapy and counseling") is True
    assert is_subcategory("Detoxification centers") is True
    assert is_subcategory("Primary care") is True

    # Legacy subcategories should return False
    assert is_subcategory("Housing") is False  # This is legacy subcategory
    assert is_subcategory("Job Training Programs") is False
    assert is_subcategory("Mental Health Counseling") is False

    # Invalid subcategories should return False
    assert is_subcategory("Invalid Subcategory") is False
    assert is_subcategory("") is False


def test_unified_request_with_new_categories():
    """Test that GetResourcesRequest accepts new category/subcategory pairs."""
    request = GetResourcesRequest(
        category=ResourceCategory.HOUSING.value,
        subcategory=ResourceSubcategory.EMERGENCY.value,
        address="123 Main St, Anytown, USA",
    )
    assert request.category == "Housing"
    assert request.subcategory == "Emergency housing and shelters"


def test_resource_model_accepts_legacy_categories():
    """Legacy category/subcategory values can still be used to instantiate Resource."""
    resource = Resource(
        id="place_123",
        name="Old Resource",
        category=ResourceCategoryLegacy.BASIC_NEEDS,
        subcategory=ResourceSubcategoryLegacy.HOUSING,
    )
    assert resource.category == ResourceCategoryLegacy.BASIC_NEEDS
    assert resource.subcategory == ResourceSubcategoryLegacy.HOUSING


@pytest.mark.asyncio
async def test_routing_to_new_api():
    """Test that new subcategories route to the new API."""
    mock_results = [
        ApiSearchResult(
            google_place_id="new_api_place_123",
            name="New API Housing Resource",
            category=ResourceCategory.HOUSING,
            subcategory=ResourceSubcategory.EMERGENCY,
            origin="TEST",
            resource_id=1,
            location=Location(latitude=40.2969, longitude=-111.6946),
            address="123 Test St, Orem, UT 84057",
        )
    ]

    with patch(
        "app.services.resources.api._call_resource_api",
        new_callable=AsyncMock,
    ) as mock_new_api:
        mock_new_api.return_value = mock_results

        request = GetResourcesRequest(
            category=ResourceCategory.HOUSING.value,
            subcategory=ResourceSubcategory.EMERGENCY.value,
            address="123 Anywhere St, UT 84057",
            limit=10,
        )

        response = await list_resources(request)

        mock_new_api.assert_called_once()
        assert len(response.resources) == 1
        assert response.resources[0].name == "New API Housing Resource"


@pytest.mark.asyncio
async def test_new_api_called_with_correct_params():
    """Test that the new API is called with the correct parameters."""

    with patch(
        "app.services.resources.api._call_resource_api",
        new_callable=AsyncMock,
    ) as mock_new_api:
        mock_new_api.return_value = []

        request = GetResourcesRequest(
            category=ResourceCategory.EMPLOYMENT.value,
            subcategory=ResourceSubcategory.SECOND_CHANCE.value,
            address="789 Job St, City, ST 12345",
            distance_miles=25,
            travel_mode=TravelMode.TRANSIT,
            exclude_ids=["exclude_id_1"],
            exclude_addresses=["exclude_addr_1"],
            exclude_names=["exclude_name_1"],
            limit=50,
        )

        await list_resources(request)

        # Verify the new API was called
        mock_new_api.assert_called_once()

        # Get the actual call arguments
        call_args = mock_new_api.call_args[0][0]

        # Verify all parameters were passed correctly
        assert call_args.category == "Employment"
        assert call_args.subcategory == "Second-chance employer"
        assert call_args.address == "789 Job St, City, ST 12345"
        assert call_args.distance_miles == 25
        assert call_args.travel_mode == TravelMode.TRANSIT
        assert call_args.exclude_ids == ["exclude_id_1"]
        assert call_args.exclude_addresses == ["exclude_addr_1"]
        assert call_args.exclude_names == ["exclude_name_1"]
        assert call_args.limit == 50


@pytest.mark.asyncio
@pytest.mark.integration
@patch("httpx.AsyncClient")
async def test_use_search_parameter(mock_httpx):
    """Test that use_search parameter controls which endpoint URL is called.

    This test uses the integration marker to bypass the conftest mock,
    allowing us to test the actual _call_resource_api function with mocked HTTP calls.
    """
    from unittest.mock import MagicMock

    mock_response_data = [
        {
            "google_place_id": "test_place_123",
            "name": "Test Resource",
            "category": "Housing",
            "subcategory": "Emergency housing and shelters",
            "origin": "TEST",
            "resource_id": 1,
            "location": {"latitude": 40.2969, "longitude": -111.6946},
            "address": "123 Test St, Orem, UT 84057",
        }
    ]

    # Track which URLs are called
    captured_urls = []

    async def mock_post(url, **kwargs):
        captured_urls.append(url)
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_response_data
        return mock_response

    mock_httpx.return_value.__aenter__.return_value.post = mock_post

    # Test with use_search=False (default) - should call /discover endpoint
    request = GetResourcesRequest(
        category=ResourceCategory.HOUSING.value,
        subcategory=ResourceSubcategory.EMERGENCY.value,
        address="123 Anywhere St, UT 84057",
        limit=10,
        use_search=False,
    )

    response = await list_resources(request)

    # Verify /discover endpoint was called
    assert len(captured_urls) == 1
    assert "/api/v0/discover" in captured_urls[0]
    assert response.resources
    assert len(response.resources) == 1

    # Clear for second test
    captured_urls.clear()

    # Test with use_search=True - should call /search endpoint
    request = GetResourcesRequest(
        category=ResourceCategory.HOUSING.value,
        subcategory=ResourceSubcategory.EMERGENCY.value,
        address="123 Anywhere St, UT 84057",
        limit=10,
        use_search=True,
    )

    response = await list_resources(request)

    # Verify /search endpoint was called
    assert len(captured_urls) == 1
    assert "/api/v0/search" in captured_urls[0]
    assert response.resources
    assert len(response.resources) == 1


# ============================================================================
# Tests for BatchGetResources model and batch_get_resources function
# ============================================================================


def test_batch_get_resources_default_travel_mode():
    request = BatchGetResources(address="123 Main St, Portland, OR", ids=[1, 2])
    assert request.travel_mode == TravelMode.DRIVING


def test_batch_get_resources_explicit_travel_mode():
    request = BatchGetResources(
        address="123 Main St, Portland, OR",
        ids=[1, 2],
        travel_mode=TravelMode.TRANSIT,
    )
    assert request.travel_mode == TravelMode.TRANSIT


def test_batch_get_resources_allows_none_travel_mode():
    request = BatchGetResources(
        address="123 Main St, Portland, OR",
        ids=[1],
        travel_mode=None,
    )
    assert request.travel_mode is None


@pytest.mark.asyncio
@pytest.mark.integration
@patch("httpx.AsyncClient")
async def test_batch_get_resources_success(mock_httpx):
    """Returns a list of Resource objects on a 200 response."""
    from unittest.mock import MagicMock

    mock_response_data = [
        {
            "google_place_id": "place_42",
            "name": "Portland Housing Resource",
            "category": "Housing",
            "subcategory": "Emergency housing and shelters",
            "origin": "TEST",
            "location": {"latitude": 45.5051, "longitude": -122.6750},
            "address": "100 NW 1st Ave, Portland, OR 97209",
            "phone": "503-555-0100",
            "travel_mode": "DRIVE",
            "travel_duration_minutes": 12,
        }
    ]

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_response_data
    mock_httpx.return_value.__aenter__.return_value.post = AsyncMock(
        return_value=mock_response
    )

    request = BatchGetResources(
        address="123 Main St, Portland, OR",
        ids=[42],
        travel_mode=TravelMode.DRIVING,
    )
    result = await batch_get_resources(request)

    assert len(result) == 1
    assert result[0].id == "place_42"
    assert result[0].name == "Portland Housing Resource"
    assert result[0].transport_minutes == 12
    assert result[0].transport_mode == TravelMode.DRIVING


@pytest.mark.asyncio
@pytest.mark.integration
@patch("httpx.AsyncClient")
async def test_batch_get_resources_no_content_returns_empty(mock_httpx):
    """204 No Content response returns an empty list without raising."""
    from unittest.mock import MagicMock

    mock_response = MagicMock()
    mock_response.status_code = 204
    mock_httpx.return_value.__aenter__.return_value.post = AsyncMock(
        return_value=mock_response
    )

    result = await batch_get_resources(
        BatchGetResources(address="123 Main St, Portland, OR", ids=[1])
    )
    assert result == []


@pytest.mark.asyncio
@pytest.mark.integration
@patch("httpx.AsyncClient")
async def test_batch_get_resources_api_error_raises(mock_httpx):
    """Non-200/204 response raises an Exception."""
    from unittest.mock import MagicMock

    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"
    mock_httpx.return_value.__aenter__.return_value.post = AsyncMock(
        return_value=mock_response
    )

    with pytest.raises(Exception, match="API request failed with status 500"):
        await batch_get_resources(
            BatchGetResources(address="123 Main St, Portland, OR", ids=[1])
        )


@pytest.mark.asyncio
@pytest.mark.integration
@patch("httpx.AsyncClient")
async def test_batch_get_resources_calls_correct_endpoint(mock_httpx):
    """Verifies the POST is sent to /api/v0/resources with the right payload."""
    from unittest.mock import MagicMock

    captured_calls: list[dict] = []

    async def mock_post(url, **kwargs):
        captured_calls.append({"url": url, "json": kwargs.get("json")})
        mock_response = MagicMock()
        mock_response.status_code = 204
        return mock_response

    mock_httpx.return_value.__aenter__.return_value.post = mock_post

    request = BatchGetResources(
        address="123 Main St, Portland, OR",
        ids=[10, 20],
        travel_mode=TravelMode.WALKING,
    )
    await batch_get_resources(request)

    assert len(captured_calls) == 1
    assert "/api/v0/resources" in captured_calls[0]["url"]
    payload = captured_calls[0]["json"]
    assert payload["address"] == "123 Main St, Portland, OR"
    assert payload["ids"] == [10, 20]
    assert payload["travel_mode"] == TravelMode.WALKING


@pytest.mark.asyncio
@pytest.mark.integration
async def test_call_discover_digital_resources():
    from app.services.resources.digital_resource_api import discover_digital_resources

    request = GetResourcesRequest(
        category=ResourceCategory.EMPLOYMENT.value,
        subcategory=ResourceSubcategory.JOB_READINESS.value,
        address="748 N 1340 W Orem, UT 84057",
        distance_miles=10,
        limit=10,
        include_digital_resources=True,
    )
    response = await discover_digital_resources(request)
    print(f"\nPartner resources found: {len(response.resources)}")
    for r in response.resources:
        print(f"  - {r.name} | {r.url} | {r.blurb}")
    print(f"failure_reason: {response.failure_reason}")
    assert response.resources


# ============================================================================
# Tests for batch_get_active_resources
# ============================================================================

_COMMUNITY_PATCH = "app.utils.resources_utils.batch_get_resources"
_DIGITAL_PATCH = "app.utils.resources_utils.batch_get_digital_resources"


def _make_community_resource(resource_id: int, name: str = "Community Resource") -> Resource:
    return Resource(
        id=f"place_{resource_id}",
        resource_id=resource_id,
        category=ResourceCategory.HOUSING,
        name=name,
        resource_type=ResourceAssociationType.COMMUNITY,
    )


def _make_digital_resource(resource_id: int, name: str = "Digital Resource") -> Resource:
    return Resource(
        id=f"digital_{resource_id}",
        resource_id=resource_id,
        category=ResourceCategory.EMPLOYMENT,
        name=name,
        resource_type=ResourceAssociationType.DIGITAL,
    )


@pytest.mark.asyncio
async def test_batch_get_active_resources_same_id_different_types():
    """Community and digital resources with the same ID must both be returned."""
    from app.utils.resources_utils import batch_get_active_resources

    community = _make_community_resource(42, "Community Shelter")
    digital = _make_digital_resource(42, "Digital Job Board")

    with patch(_COMMUNITY_PATCH, new_callable=AsyncMock, return_value=[community]):
        with patch(_DIGITAL_PATCH, new_callable=AsyncMock, return_value=[digital]):
            result = await batch_get_active_resources(
                community_ids=[42],
                digital_ids=[42],
                address="123 Main St, Chicago, IL",
                travel_mode=TravelMode.DRIVING,
            )

    assert len(result) == 2
    assert result[(42, ResourceAssociationType.COMMUNITY)] is community
    assert result[(42, ResourceAssociationType.DIGITAL)] is digital


@pytest.mark.asyncio
async def test_batch_get_active_resources_community_only():
    """When only community IDs are given, only the community API is called."""
    from app.utils.resources_utils import batch_get_active_resources

    community = _make_community_resource(1)

    with patch(_COMMUNITY_PATCH, new_callable=AsyncMock, return_value=[community]) as mock_comm:
        with patch(_DIGITAL_PATCH, new_callable=AsyncMock) as mock_dig:
            result = await batch_get_active_resources(
                community_ids=[1],
                digital_ids=[],
                address="123 Main St, Chicago, IL",
                travel_mode=None,
            )

    mock_comm.assert_called_once()
    mock_dig.assert_not_called()
    assert result == {(1, ResourceAssociationType.COMMUNITY): community}


@pytest.mark.asyncio
async def test_batch_get_active_resources_digital_only():
    """When only digital IDs are given, only the digital API is called."""
    from app.utils.resources_utils import batch_get_active_resources

    digital = _make_digital_resource(7)

    with patch(_COMMUNITY_PATCH, new_callable=AsyncMock) as mock_comm:
        with patch(_DIGITAL_PATCH, new_callable=AsyncMock, return_value=[digital]) as mock_dig:
            result = await batch_get_active_resources(
                community_ids=[],
                digital_ids=[7],
                address="123 Main St, Chicago, IL",
                travel_mode=TravelMode.WALKING,
            )

    mock_comm.assert_not_called()
    mock_dig.assert_called_once()
    assert result == {(7, ResourceAssociationType.DIGITAL): digital}


@pytest.mark.asyncio
async def test_batch_get_active_resources_no_ids():
    """Empty inputs return an empty dict without calling either API."""
    from app.utils.resources_utils import batch_get_active_resources

    with patch(_COMMUNITY_PATCH, new_callable=AsyncMock) as mock_comm:
        with patch(_DIGITAL_PATCH, new_callable=AsyncMock) as mock_dig:
            result = await batch_get_active_resources(
                community_ids=[],
                digital_ids=[],
                address="123 Main St, Chicago, IL",
                travel_mode=None,
            )

    mock_comm.assert_not_called()
    mock_dig.assert_not_called()
    assert result == {}


@pytest.mark.asyncio
async def test_batch_get_active_resources_community_error_digital_succeeds():
    """When the community fetch raises, digital resources are still returned."""
    from app.utils.resources_utils import batch_get_active_resources

    digital = _make_digital_resource(5)

    with patch(_COMMUNITY_PATCH, new_callable=AsyncMock, side_effect=RuntimeError("API down")):
        with patch(_DIGITAL_PATCH, new_callable=AsyncMock, return_value=[digital]):
            result = await batch_get_active_resources(
                community_ids=[99],
                digital_ids=[5],
                address="123 Main St, Chicago, IL",
                travel_mode=None,
            )

    assert (99, ResourceAssociationType.COMMUNITY) not in result
    assert result == {(5, ResourceAssociationType.DIGITAL): digital}


@pytest.mark.asyncio
async def test_batch_get_active_resources_digital_error_community_succeeds():
    """When the digital fetch raises, community resources are still returned."""
    from app.utils.resources_utils import batch_get_active_resources

    community = _make_community_resource(3)

    with patch(_COMMUNITY_PATCH, new_callable=AsyncMock, return_value=[community]):
        with patch(_DIGITAL_PATCH, new_callable=AsyncMock, side_effect=RuntimeError("API down")):
            result = await batch_get_active_resources(
                community_ids=[3],
                digital_ids=[99],
                address="123 Main St, Chicago, IL",
                travel_mode=None,
            )

    assert (99, ResourceAssociationType.DIGITAL) not in result
    assert result == {(3, ResourceAssociationType.COMMUNITY): community}


@pytest.mark.asyncio
async def test_batch_get_active_resources_resource_id_none_skipped():
    """Resources with resource_id=None are excluded from the result map."""
    from app.utils.resources_utils import batch_get_active_resources

    no_id = Resource(
        id="place_no_id",
        resource_id=None,
        category=ResourceCategory.HOUSING,
        name="No ID Resource",
        resource_type=ResourceAssociationType.COMMUNITY,
    )
    with_id = _make_community_resource(10)

    with patch(_COMMUNITY_PATCH, new_callable=AsyncMock, return_value=[no_id, with_id]):
        with patch(_DIGITAL_PATCH, new_callable=AsyncMock):
            result = await batch_get_active_resources(
                community_ids=[10],
                digital_ids=[],
                address="123 Main St, Chicago, IL",
                travel_mode=None,
            )

    assert len(result) == 1
    assert result[(10, ResourceAssociationType.COMMUNITY)] is with_id


@pytest.mark.asyncio
async def test_batch_get_active_resources_distinct_ids_all_returned():
    """All four resources are returned when community and digital have distinct IDs."""
    from app.utils.resources_utils import batch_get_active_resources

    c1 = _make_community_resource(1, "Shelter A")
    c2 = _make_community_resource(2, "Shelter B")
    d3 = _make_digital_resource(3, "Job Board A")
    d4 = _make_digital_resource(4, "Job Board B")

    with patch(_COMMUNITY_PATCH, new_callable=AsyncMock, return_value=[c1, c2]):
        with patch(_DIGITAL_PATCH, new_callable=AsyncMock, return_value=[d3, d4]):
            result = await batch_get_active_resources(
                community_ids=[1, 2],
                digital_ids=[3, 4],
                address="123 Main St, Chicago, IL",
                travel_mode=TravelMode.TRANSIT,
            )

    assert len(result) == 4
    assert result[(1, ResourceAssociationType.COMMUNITY)] is c1
    assert result[(2, ResourceAssociationType.COMMUNITY)] is c2
    assert result[(3, ResourceAssociationType.DIGITAL)] is d3
    assert result[(4, ResourceAssociationType.DIGITAL)] is d4
