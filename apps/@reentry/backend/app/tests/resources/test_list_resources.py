"""
Tests app.services.resources.list_resources, which filters discovered resources appropriately and
converts them into the CPA's internal Resource model.
"""

from unittest.mock import AsyncMock, patch

import pytest

from app.services.resources.api import (
    BadResourceAPIRequest,
    DiscoveredResource,
    ResourceAPIFailure,
    TravelMode,
)
from app.services.resources.list_resources import (
    list_resources,
)
from app.services.resources.resource_taxonomy import (
    ResourceCategory,
    ResourceSubcategory,
)
from app.services.resources.types import (
    GetResourcesRequest,
    ResourceAPIResultType,
)
from app.utils.disallowed_resources import (
    DISALLOWED_RESOURCE_NAMES,
)


def create_discovered_resource(
    name: str = "Test Resource",
    address: str = "123 Test St, Test City, TS 12345",
    google_place_id: str = "ChIJTest123",
    category: ResourceCategory = ResourceCategory.BASIC_NEEDS,
    subcategory: ResourceSubcategory = ResourceSubcategory.FOOD_ASSISTANCE,
    **kwargs,
) -> DiscoveredResource:
    """Helper factory to create DiscoveredResource objects for testing."""
    defaults = {
        "google_place_id": google_place_id,
        "address": address,
        "location": {"latitude": 40.7128, "longitude": -74.0060},
        "category": category,
        "subcategory": subcategory,
        "name": name,
        "email": None,
        "phone": None,
        "website": None,
        "description": None,
        "origin": "GOOGLE",
        "rating": None,
        "rating_count": None,
        "travel_mode": None,
        "travel_duration_minutes": None,
        "travel_distance_miles": None,
    }
    defaults.update(kwargs)
    return DiscoveredResource(**defaults)


class TestListResources:
    """Tests for the list_resources async function."""

    @pytest.fixture
    def mock_discover(self):
        """Fixture that patches discover_resources and returns the mock."""
        with patch(
            "app.services.resources.list_resources.discover_resources", new=AsyncMock()
        ) as mock:
            yield mock

    @pytest.mark.asyncio
    async def test_successful_resource_listing(self, mock_discover):
        """Test successful resource discovery and conversion."""
        request = GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="123 Main St, City, ST",
            distance_miles=50,
            travel_mode=TravelMode.DRIVE,
            keywords_to_exclude=[],
            limit=10,
        )
        mock_discover.return_value = [
            create_discovered_resource(
                name="Food Bank 1",
                rating=5,
                rating_count=100,
                travel_duration_minutes=20,
            ),
            create_discovered_resource(
                name="Food Bank 2",
                rating=4,
                rating_count=80,
                travel_duration_minutes=30,
            ),
        ]
        response = await list_resources(request)
        assert response.result == ResourceAPIResultType.SUCCESS
        assert response.error_message is None
        assert len(response.resources) == 2

        # Test limit filters down successful response
        response = await list_resources(
            GetResourcesRequest(
                category=ResourceCategory.BASIC_NEEDS,
                subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
                address="123 Main St, City, ST",
                distance_miles=50,
                travel_mode=TravelMode.DRIVE,
                keywords_to_exclude=[],
                limit=1,
            )
        )
        assert response.result == ResourceAPIResultType.SUCCESS
        assert response.error_message is None
        assert response.resources[0].rating == 5

    @pytest.mark.asyncio
    async def test_empty_results_from_discovery(self, mock_discover):
        """Test when discover_resources returns empty list."""
        request = GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="123 Main St, City, ST",
        )

        mock_discover.return_value = []

        response = await list_resources(request)

        assert response.result == ResourceAPIResultType.NO_RESULTS_FOUND
        assert response.error_message is None
        assert len(response.resources) == 0

    @pytest.mark.asyncio
    async def test_all_resources_filtered_out(self, mock_discover):
        """Test when all discovered resources are filtered out."""
        request = GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="123 Main St, City, ST",
        )

        disallowed_name = list(DISALLOWED_RESOURCE_NAMES)[0]
        mock_resources = [
            create_discovered_resource(name=disallowed_name),
        ]

        mock_discover.return_value = mock_resources

        response = await list_resources(request)

        assert response.result == ResourceAPIResultType.NO_RESULTS_FOUND
        assert response.error_message is None
        assert len(response.resources) == 0

    @pytest.mark.asyncio
    async def test_resource_api_failure_error(self, mock_discover):
        """Test when discover_resources raises ResourceAPIFailure."""
        request = GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="123 Main St, City, ST",
        )

        mock_discover.side_effect = ResourceAPIFailure("API is down")

        response = await list_resources(request)

        assert response.result == ResourceAPIResultType.API_ERROR
        assert response.error_message == "API is down"
        assert len(response.resources) == 0

    @pytest.mark.asyncio
    async def test_bad_resource_api_request_error(self, mock_discover):
        """Test when discover_resources raises BadResourceAPIRequest."""
        request = GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="Invalid Address",
        )

        mock_discover.side_effect = BadResourceAPIRequest("Invalid address format")

        response = await list_resources(request)

        assert response.result == ResourceAPIResultType.BAD_REQUEST
        assert response.error_message == "Invalid address format"
        assert len(response.resources) == 0


######################################################################
# Integration
######################################################################


@pytest.mark.asyncio
@pytest.mark.integration
class TestOnRealEndpoint:
    correctional_centers_address = {
        "80 South Orange Street, Salt Lake City, UT",
        "748 N 1340 W Orem, UT 84057",
        "748 North 1340 W, Orem, UT",  # slightly different formatting
        "1141 South 2475 West, Salt Lake City, UT",
        "1747 South 900 West, Salt Lake City, UT",
        "2445 South Water Tower Way, Ogden, UT",
        "2588 West 2365 South, West Valley City, UT",
    }

    @pytest.mark.parametrize("address", correctional_centers_address)
    async def test_call_list_resources_near_cc(self, address):
        request = GetResourcesRequest(
            category=ResourceCategory.EMPLOYMENT,
            subcategory=ResourceSubcategory.JOB_READINESS_TRAINING,
            address=address,
            travel_mode=TravelMode.DRIVE,
            distance_miles=40,
        )

        response = await list_resources(request)
        print(f"Request: {request}")
        print(f"Response: {response}")
        assert response.result in (
            ResourceAPIResultType.SUCCESS,
            ResourceAPIResultType.NO_RESULTS_FOUND,
        )

        # Check CC isn't in the resource
        for resource in response.resources:
            street = resource.address.split(",")[0]
            assert street.lower() not in address.lower()

    async def test_call_list_resources_on_locale(self):
        request = GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="Chicago, IL",
            travel_mode=TravelMode.DRIVE,
            distance_miles=40,
            limit=100,
        )
        response = await list_resources(request)
        assert response.resources

    async def test_call_list_resources_bad_request(self):
        """Tests we get BAD_REQUEST when we send the wrong categories."""
        request = GetResourcesRequest(
            category=ResourceCategory.EMPLOYMENT,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="Chicago, IL",
            travel_mode=TravelMode.DRIVE,
            distance_miles=40,
            limit=100,
        )
        response = await list_resources(request)
        assert response.result == ResourceAPIResultType.BAD_REQUEST
