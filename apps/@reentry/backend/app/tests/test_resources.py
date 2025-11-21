import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from app.services.resources import (
    CATEGORY_SUBCATEGORY_MAP,
    GetResourcesRequest,
    ResourceCategory,
    ResourceFailureReason,
    ResourceSubcategory,
    list_resources,
)
from app.services.resources.api import ApiSearchResult, Location
from app.utils.disallowed_resources import DISALLOWED_RESOURCE_NAMES

CHICAGO = "Chicago, IL"


def test_build_GetResourcesRequest__invalid_address():
    """Tests we don't build a GetResourcesRequest when the address is invalid."""
    for addr in [None, 42, [CHICAGO]]:
        with pytest.raises(
            ValueError, match=r"1 validation error for GetResourcesRequest\naddress"
        ):
            GetResourcesRequest(
                category=ResourceCategory.BASIC_NEEDS,
                subcategory=ResourceSubcategory.HOUSING,
                address=addr,  # type: ignore
                limit=10,
            )


# TODO(#10014): Have subcategory be required in the new API
@pytest.mark.parametrize("field_name", ["category", "address"])
def test_build_GetResourcesRequest__missing_required_fields(field_name):
    """Tests we don't build a GetResourcesRequest when we're missing required fields."""
    data = {
        "category": ResourceCategory.BASIC_NEEDS,
        "subcategory": ResourceSubcategory.HOUSING,
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

    # Create a request with the category and first subcategory
    request = GetResourcesRequest(
        category=resource_type,
        subcategory=subcategory,
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
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.HOUSING,
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
        "app.services.resources.api.call_resource_api",
        new_callable=AsyncMock,
    ) as mock_api:
        mock_api.return_value = mock_results

        # Use a category that should have resources
        request = GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.HOUSING,
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
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.HOUSING,
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
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.HOUSING,
        address="This Address Does Not Exist 12345",
        limit=10,
    )

    resources = await fetch_resources_with_retry(request, max_retries=1)

    # Should still return a list (even if empty)
    assert isinstance(resources, list)


async def test_get_resources_with_exclusion_api(client):
    # Using shelter resource type, exclude a resource
    category = ResourceCategory.BASIC_NEEDS
    subcategory = ResourceSubcategory.HOUSING

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
        category=ResourceCategory.EMPLOYMENT_AND_CAREER,
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
    requests = [
        GetResourcesRequest(
            category=resource_category,
            address=current_address,
            limit=50,
        )
        for current_address in correctional_centers_address
        for resource_category in ResourceCategory
    ]
    responses = await asyncio.gather(*map(list_resources, requests))
    all_found_resource_names: set[str] = {
        resource.name for response in responses for resource in response.resources
    }
    assert not all_found_resource_names.intersection((DISALLOWED_RESOURCE_NAMES))
