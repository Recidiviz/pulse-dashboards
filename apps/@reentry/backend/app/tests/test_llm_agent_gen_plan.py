"""Tests functions from app.utils.llm_agent_gen_plan."""

from unittest.mock import patch

import pytest

from app.services.resources.resource_taxonomy import (
    ResourceCategory,
    ResourceSubcategory,
)
from app.services.resources.types import (
    GetResourcesRequest,
    GetResourcesResponse,
    Resource,
    ResourceAPIResultType,
)
from app.utils.llm_agent_gen_plan import fetch_resources_with_retry


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
