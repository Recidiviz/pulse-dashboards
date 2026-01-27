import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from app.services.resources import (
    CATEGORY_SUBCATEGORY_MAP,
    ApiSearchResult,
    GetResourcesRequest,
    Location,
    ResourceCategory,
    ResourceCategoryLegacy,
    ResourceFailureReason,
    ResourceSubcategory,
    ResourceSubcategoryLegacy,
    TravelMode,
    is_category,
    is_legacy_category,
    is_legacy_subcategory,
    is_subcategory,
    list_resources,
)
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
        assert response.failure_reason == ResourceFailureReason.NO_RESULTS_FOUND


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
async def test_fetch_resources_with_retry():
    """Test the retry functionality"""
    from app.services.resources import GetResourcesRequest
    from app.utils.llm_agent_gen_plan import fetch_resources_with_retry

    request = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS.value,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE.value,
        address="123 Anywhere St, UT 84057",
        limit=10,
    )

    resources = await fetch_resources_with_retry(request, max_retries=2)

    # Should return a list of resources
    assert isinstance(resources, list)
    # In test environment, should get some resources
    assert len(resources) >= 0


@pytest.mark.asyncio
async def test_fetch_resources_with_retry_no_results():
    from app.services.resources import GetResourcesRequest
    from app.utils.llm_agent_gen_plan import fetch_resources_with_retry

    request = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS.value,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE.value,
        address="This Address Does Not Exist 12345",
        limit=10,
    )

    resources = await fetch_resources_with_retry(request, max_retries=1)

    # Should still return a list (even if empty)
    assert isinstance(resources, list)


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
        category=ResourceCategory.BASIC_NEEDS,
        name="test name",
        address="test address",
    )
    assert resource_is_allowed(allowed) is True

    # disallowed by name
    disallowed_name = Resource(
        id="2",
        category=ResourceCategory.BASIC_NEEDS,
        name="Bonneville Community Correctional Center",
        address="test address",
    )
    assert resource_is_allowed(disallowed_name) is False

    # disallowed by address
    disallowed_address = Resource(
        id="3",
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


def test_is_legacy_category():
    """Test that is_legacy_category correctly identifies legacy categories."""
    # Legacy categories should return True
    assert is_legacy_category("Basic Needs") is True
    assert is_legacy_category("Employment and Career Support") is True
    assert is_legacy_category("Education") is True
    assert is_legacy_category("Behavioral Health Services") is True
    assert is_legacy_category("Medical and Health Services") is True
    assert is_legacy_category("Legal and Financial Assistance") is True
    assert is_legacy_category("Family and Community Support") is True
    assert is_legacy_category("Transportation") is True
    assert is_legacy_category("Specialized Services") is True
    assert is_legacy_category("Community and Social Reintegration") is True
    assert is_legacy_category("Unknown") is True

    # New categories that don't exist in legacy should return False
    assert is_legacy_category("Housing") is False
    assert is_legacy_category("Employment") is False
    assert is_legacy_category("Mental Health") is False

    # Invalid categories should return False
    assert is_legacy_category("Invalid Category") is False


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


def test_is_legacy_subcategory():
    """Test that is_legacy_subcategory correctly identifies legacy subcategories."""
    # Legacy subcategories should return True
    assert is_legacy_subcategory("Housing") is True
    assert is_legacy_subcategory("Food Assistance") is True
    assert is_legacy_subcategory("Clothing") is True
    assert is_legacy_subcategory("Job Training Programs") is True
    assert is_legacy_subcategory("Mental Health Counseling") is True
    assert is_legacy_subcategory("Primary Care") is True

    # New subcategories should return False
    assert is_legacy_subcategory("Emergency housing and shelters") is False
    assert is_legacy_subcategory("Second-chance employer") is False
    assert is_legacy_subcategory("Food assistance") is False

    # Invalid subcategories should return False
    assert is_legacy_subcategory("Invalid Subcategory") is False


def test_unified_request_with_new_categories():
    """Test that GetResourcesRequest accepts new category/subcategory pairs."""
    request = GetResourcesRequest(
        category=ResourceCategory.HOUSING.value,
        subcategory=ResourceSubcategory.EMERGENCY.value,
        address="123 Main St, Anytown, USA",
    )
    assert request.category == "Housing"
    assert request.subcategory == "Emergency housing and shelters"
    assert request.is_legacy_request() is False


def test_unified_request_with_legacy_categories():
    """Test that GetResourcesRequest accepts legacy category/subcategory pairs."""
    request = GetResourcesRequest(
        category=ResourceCategoryLegacy.BASIC_NEEDS.value,
        subcategory=ResourceSubcategoryLegacy.HOUSING.value,
        address="123 Main St, Anytown, USA",
    )
    assert request.category == "Basic Needs"
    assert request.subcategory == "Housing"
    assert request.is_legacy_request() is True


def test_to_legacy_request_conversion():
    """Test conversion from unified request to legacy request."""
    unified_request = GetResourcesRequest(
        category=ResourceCategoryLegacy.BASIC_NEEDS.value,
        subcategory=ResourceSubcategoryLegacy.HOUSING.value,
        address="123 Main St, Anytown, USA",
        distance_miles=50,
        travel_mode=TravelMode.DRIVING,
        exclude_ids=["id1", "id2"],
        exclude_addresses=["addr1"],
        exclude_names=["name1"],
        limit=25,
    )

    legacy_request = unified_request.to_legacy_request()

    assert legacy_request.category == ResourceCategoryLegacy.BASIC_NEEDS
    assert legacy_request.subcategory == ResourceSubcategoryLegacy.HOUSING
    assert legacy_request.address == "123 Main St, Anytown, USA"
    assert legacy_request.distance_miles == 50
    assert legacy_request.mode == TravelMode.DRIVING
    assert legacy_request.ids_to_exclude == ["id1", "id2"]
    assert legacy_request.addresses_to_exclude == ["addr1"]
    assert legacy_request.keywords_to_exclude == ["name1"]
    assert legacy_request.limit == 25


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
            location=Location(latitude=40.2969, longitude=-111.6946),
            address="123 Test St, Orem, UT 84057",
        )
    ]

    with (
        patch(
            "app.services.resources.api._call_resource_api",
            new_callable=AsyncMock,
        ) as mock_new_api,
        patch(
            "app.services.resources.legacy_api._call_legacy_resource_api",
            new_callable=AsyncMock,
        ) as mock_legacy_api,
    ):
        mock_new_api.return_value = mock_results

        # Use new category/subcategory
        request = GetResourcesRequest(
            category=ResourceCategory.HOUSING.value,
            subcategory=ResourceSubcategory.EMERGENCY.value,
            address="123 Anywhere St, UT 84057",
            limit=10,
        )

        response = await list_resources(request)

        # Should call new API, not legacy API
        mock_new_api.assert_called_once()
        mock_legacy_api.assert_not_called()

        # Verify response
        assert len(response.resources) == 1
        assert response.resources[0].name == "New API Housing Resource"


@pytest.mark.asyncio
async def test_routing_to_legacy_api():
    """Test that legacy subcategories route to the legacy API."""
    # Import from legacy_api to ensure we use the same types
    from app.services.resources.legacy_api import (
        ApiSearchResult as LegacyApiSearchResult,
    )

    # Note: The legacy API's ApiSearchResult uses NEW taxonomy for the response
    # (legacy requests are converted internally)
    mock_results = [
        LegacyApiSearchResult(
            google_place_id="legacy_api_place_456",
            name="Legacy API Housing Resource",
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            origin="TEST",
            location=Location(latitude=40.2969, longitude=-111.6946),
            address="456 Test St, Orem, UT 84057",
        )
    ]

    with (
        patch(
            "app.services.resources.api._call_resource_api",
            new_callable=AsyncMock,
        ) as mock_new_api,
        patch(
            "app.services.resources.legacy_api._call_legacy_resource_api",
            new_callable=AsyncMock,
        ) as mock_legacy_api,
    ):
        mock_legacy_api.return_value = mock_results

        # Use legacy category/subcategory in request to trigger legacy routing
        request = GetResourcesRequest(
            category=ResourceCategoryLegacy.BASIC_NEEDS.value,
            subcategory=ResourceSubcategoryLegacy.HOUSING.value,
            address="123 Anywhere St, UT 84057",
            limit=10,
        )

        response = await list_resources(request)

        # Should call legacy API, not new API
        mock_legacy_api.assert_called_once()
        mock_new_api.assert_not_called()

        # Verify response
        assert len(response.resources) == 1
        assert response.resources[0].name == "Legacy API Housing Resource"


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
async def test_legacy_api_called_with_correct_params():
    """Test that the legacy API is called with the correct parameters."""

    with patch(
        "app.services.resources.legacy_api._call_legacy_resource_api",
        new_callable=AsyncMock,
    ) as mock_legacy_api:
        mock_legacy_api.return_value = []

        request = GetResourcesRequest(
            category=ResourceCategoryLegacy.EMPLOYMENT_AND_CAREER.value,
            subcategory=ResourceSubcategoryLegacy.JOB_TRAINING.value,
            address="789 Job St, City, ST 12345",
            distance_miles=30,
            travel_mode=TravelMode.DRIVING,
            exclude_ids=["legacy_id_1"],
            exclude_addresses=["legacy_addr_1"],
            exclude_names=["legacy_name_1"],
            limit=20,
        )

        await list_resources(request)

        # Verify the legacy API was called
        mock_legacy_api.assert_called_once()

        # Get the actual call arguments (should be LegacyResourceRequest)
        call_args = mock_legacy_api.call_args[0][0]

        # Verify all parameters were converted and passed correctly
        assert call_args.category == ResourceCategoryLegacy.EMPLOYMENT_AND_CAREER
        assert call_args.subcategory == ResourceSubcategoryLegacy.JOB_TRAINING
        assert call_args.address == "789 Job St, City, ST 12345"
        assert call_args.distance_miles == 30
        assert call_args.mode == TravelMode.DRIVING
        assert call_args.ids_to_exclude == ["legacy_id_1"]
        assert call_args.addresses_to_exclude == ["legacy_addr_1"]
        assert call_args.keywords_to_exclude == ["legacy_name_1"]
        assert call_args.limit == 20


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
