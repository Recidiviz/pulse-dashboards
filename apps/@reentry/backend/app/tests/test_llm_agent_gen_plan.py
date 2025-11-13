"""Tests functions from app.utils.llm_agent_gen_plan."""

from unittest.mock import patch

import pytest

from app.services.resources.resource_taxonomy import (
    ResourceCategory,
    ResourceSubcategory,
)
from app.services.resources.types import (
    ClientExtractedInfo,
    GetResourcesRequest,
    GetResourcesResponse,
    Resource,
    ResourceAPIResultType,
)
from app.utils.action_plan_types import ActionPlanSectionResourceTypes
from app.utils.llm_agent_gen_plan import (
    build_resource_requests_for_section,
    fetch_resources_with_retry,
    get_resources_for_section,
)


@pytest.fixture
def mock_fetch_resources():
    """Fixture to mock fetch_resources_with_retry for all tests."""
    with patch("app.utils.llm_agent_gen_plan.fetch_resources_with_retry") as mock:
        yield mock


@pytest.mark.parametrize(
    "reason",
    [ResourceAPIResultType.NO_RESULTS_FOUND, ResourceAPIResultType.BAD_REQUEST],
)
@pytest.mark.asyncio
async def test_fetch_resources_with_retry_no_results(reason):
    """Test that both NO_RESULTS_FOUND and BAD_REQUEST returns an empty list immediately without retries."""

    request = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        address="This Address Does Not Exist 12345",
        limit=10,
    )

    # Mock list_resources to return NO_RESULTS_FOUND
    with patch("app.utils.llm_agent_gen_plan.list_resources") as mock_list_resources:
        mock_list_resources.return_value = GetResourcesResponse(
            resources=[],
            result=reason,
            error_message=None,
        )

        resources = await fetch_resources_with_retry(request, max_retries=10)
        assert resources == []
        mock_list_resources.assert_called_once_with(request)


@pytest.mark.asyncio
async def test_fetch_resources_with_retry_failures():
    """Test the retry functionality with API_ERROR followed by success."""

    request = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        address="123 Anywhere St, UT 84057",
        limit=10,
    )

    # Create a mock resource that will be returned on successful attempt
    mock_resource = Resource(
        id="test-resource-id",
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        name="Test Food Bank",
        address="123 Test St, Test City, TS 12345",
        phone="555-0100",
        website="https://testfoodbank.org",
    )

    # Mock list_resources with side_effect:
    # - First two calls return API_ERROR
    # - Third call returns SUCCESS with one resource
    with patch("app.utils.llm_agent_gen_plan.list_resources") as mock_list_resources:
        mock_list_resources.side_effect = [
            GetResourcesResponse(
                resources=[],
                result=ResourceAPIResultType.API_ERROR,
                error_message="API is temporarily unavailable",
            ),
            GetResourcesResponse(
                resources=[],
                result=ResourceAPIResultType.API_ERROR,
                error_message="API is temporarily unavailable",
            ),
            GetResourcesResponse(
                resources=[mock_resource],
                result=ResourceAPIResultType.SUCCESS,
                error_message=None,
            ),
        ]

        resources = await fetch_resources_with_retry(request, max_retries=2)

        # Should return a list of resources
        assert isinstance(resources, list)
        assert len(resources) == 1
        assert resources[0].id == "test-resource-id"
        assert resources[0].name == "Test Food Bank"

        # Should have been called 3 times (initial + 2 retries)
        assert mock_list_resources.call_count == 3


def test_build_resource_request_for_section():
    section_types = ActionPlanSectionResourceTypes(
        section_title="Help with things",
        categories=[
            ResourceCategory.BASIC_NEEDS,
            ResourceCategory.EMPLOYMENT,
        ],
        subcategories=[
            ResourceSubcategory.FOOD_ASSISTANCE,
        ],
    )
    info = ClientExtractedInfo(home="Chicago, IL")
    reqs = list(build_resource_requests_for_section(section_types, info))
    expected = [
        GetResourcesRequest.from_client_extracted_info(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            limit=2,
            client_info=info,
            keywords_to_exclude=None,
        )
    ]
    assert sorted(reqs, key=lambda r: (r.category, r.subcategory)) == sorted(
        expected, key=lambda r: (r.category, r.subcategory)
    )

    # We only include FOOD_ASSISTANCE
    section_types = ActionPlanSectionResourceTypes(
        section_title="Help with things",
        categories=[
            ResourceCategory.EMPLOYMENT,
        ],
        subcategories=[
            ResourceSubcategory.FOOD_ASSISTANCE,
        ],
    )
    info = ClientExtractedInfo(home="Chicago, IL")
    reqs = list(build_resource_requests_for_section(section_types, info))
    expected = [
        GetResourcesRequest.from_client_extracted_info(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            limit=2,
            client_info=info,
            keywords_to_exclude=None,
        )
    ]
    assert sorted(reqs, key=lambda r: (r.category, r.subcategory)) == sorted(
        expected, key=lambda r: (r.category, r.subcategory)
    )

    # If there are no subcategories at all, but there are categories,
    # we include the categories.
    section_types = ActionPlanSectionResourceTypes(
        section_title="Help with things",
        categories=[
            ResourceCategory.EMPLOYMENT,
        ],
        subcategories=[],
    )
    info = ClientExtractedInfo(home="Chicago, IL")
    reqs = list(build_resource_requests_for_section(section_types, info))
    expected = [
        GetResourcesRequest.from_client_extracted_info(
            category=category,
            subcategory=subcategory,
            limit=2,
            client_info=info,
            keywords_to_exclude=None,
        )
        for category, subcategory in (
            (ResourceCategory.EMPLOYMENT, ResourceSubcategory.SECOND_CHANCE_EMPLOYER),
            (
                ResourceCategory.EMPLOYMENT,
                ResourceSubcategory.TEMPORARY_STAFFING_AGENCY,
            ),
            (ResourceCategory.EMPLOYMENT, ResourceSubcategory.JOB_READINESS_TRAINING),
            (
                ResourceCategory.EMPLOYMENT,
                ResourceSubcategory.JOB_CERTIFICATION_AND_LICENSING,
            ),
        )
    ]
    assert sorted(reqs, key=lambda r: (r.category, r.subcategory)) == sorted(
        expected, key=lambda r: (r.category, r.subcategory)
    )


@pytest.mark.asyncio
async def test_get_resources_for_section_all_succeed(mock_fetch_resources):
    """Test get_resources_for_section when all requests succeed."""

    resource1 = Resource(
        id="resource-1",
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        name="Food Bank 1",
        address="123 Test St",
    )
    resource2 = Resource(
        id="resource-2",
        category=ResourceCategory.EMPLOYMENT,
        subcategory=ResourceSubcategory.JOB_READINESS_TRAINING,
        name="Job Training Center",
        address="456 Test Ave",
    )
    resource3 = Resource(
        id="resource-3",
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        name="Food Bank 2",
        address="789 Test Blvd",
    )

    requests = [
        GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="Chicago, IL",
            limit=2,
        ),
        GetResourcesRequest(
            category=ResourceCategory.EMPLOYMENT,
            subcategory=ResourceSubcategory.JOB_READINESS_TRAINING,
            address="Chicago, IL",
            limit=2,
        ),
    ]

    mock_fetch_resources.side_effect = [
        [resource1, resource3],
        [resource2],
    ]

    results = await get_resources_for_section(requests)

    assert len(results) == 3
    assert resource1 in results
    assert resource2 in results
    assert resource3 in results
    assert mock_fetch_resources.call_count == 2


@pytest.mark.asyncio
async def test_get_resources_for_section_all_fail(mock_fetch_resources):
    """Test get_resources_for_section when all requests fail with exceptions."""

    requests = [
        GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="Chicago, IL",
            limit=2,
        ),
        GetResourcesRequest(
            category=ResourceCategory.EMPLOYMENT,
            subcategory=ResourceSubcategory.JOB_READINESS_TRAINING,
            address="Chicago, IL",
            limit=2,
        ),
    ]

    # Configure mock to raise exceptions
    mock_fetch_resources.side_effect = [
        Exception("API Error 1"),
        Exception("API Error 2"),
    ]

    results = await get_resources_for_section(requests)

    # Should return empty list when all fail
    assert results == []
    assert mock_fetch_resources.call_count == 2


@pytest.mark.asyncio
async def test_get_resources_for_section_mixed_success_and_failure(
    mock_fetch_resources,
):
    """Test get_resources_for_section when some requests succeed and some fail."""

    resource1 = Resource(
        id="resource-1",
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        name="Food Bank 1",
        address="123 Test St",
    )

    requests = [
        GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="Chicago, IL",
            limit=2,
        ),
        GetResourcesRequest(
            category=ResourceCategory.EMPLOYMENT,
            subcategory=ResourceSubcategory.JOB_READINESS_TRAINING,
            address="Chicago, IL",
            limit=2,
        ),
        GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FINANCIAL_ASSISTANCE,
            address="Chicago, IL",
            limit=2,
        ),
    ]

    # Configure mock with mixed results: success, exception, empty list
    mock_fetch_resources.side_effect = [
        [resource1],  # Success
        Exception("Network error"),  # Exception
        [],  # Empty list (no results)
    ]

    results = await get_resources_for_section(requests)

    # Should only return the successful resource
    assert len(results) == 1
    assert results[0] == resource1
    assert mock_fetch_resources.call_count == 3


@pytest.mark.asyncio
async def test_get_resources_for_section_unexpected_type(mock_fetch_resources):
    """Test get_resources_for_section when an unexpected type is returned."""

    resource1 = Resource(
        id="resource-1",
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        name="Food Bank 1",
        address="123 Test St",
    )

    requests = [
        GetResourcesRequest(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            address="Chicago, IL",
            limit=2,
        ),
        GetResourcesRequest(
            category=ResourceCategory.EMPLOYMENT,
            subcategory=ResourceSubcategory.JOB_READINESS_TRAINING,
            address="Chicago, IL",
            limit=2,
        ),
    ]

    # Check handling of unexpected type (shouldn't happen, but nice to check)
    mock_fetch_resources.side_effect = [
        [resource1],
        "unexpected string result",
    ]

    results = await get_resources_for_section(requests)

    # Should only include the valid result, ignoring the unexpected type
    assert len(results) == 1
    assert results[0] == resource1
    assert mock_fetch_resources.call_count == 2
