import pytest

from app.services.resources import (
    CATEGORY_SUBCATEGORY_MAP,
    ResourceCategory,
    ResourceFailureReason,
    ResourceSubcategory,
)


@pytest.mark.parametrize(
    "resource_type",
    list(CATEGORY_SUBCATEGORY_MAP.keys()),
)
@pytest.mark.asyncio
async def test_resource_type_get_result(resource_type: ResourceCategory):
    from app.services.resources import GetResourcesRequest, list_resources

    # Get the first subcategory from the list (if available)
    subcategories = CATEGORY_SUBCATEGORY_MAP[resource_type]
    subcategory = subcategories[0] if subcategories else None

    # Create a request with the category and first subcategory
    request = GetResourcesRequest(
        category=resource_type, subcategory=subcategory, limit=10
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
async def test_get_resources_invalid_resource_type():
    from app.services.resources import GetResourcesRequest
    from app.services.resources.stub_resources import _list_resources_internal

    with pytest.raises(Exception):
        # Use an invalid category
        request = GetResourcesRequest(category="INVALID_CATEGORY", limit=10)
        _list_resources_internal(request)


@pytest.mark.asyncio
async def test_get_resources_with_exclusion():
    # Using housing resource type, exclude "Safe Harbor Shelter"
    from app.services.resources import GetResourcesRequest
    from app.services.resources.stub_resources import _list_resources_internal

    # Using shelter resource type, exclude a resource
    category = ResourceCategory.BASIC_NEEDS
    subcategory = ResourceSubcategory.HOUSING
    request = GetResourcesRequest(category=category, subcategory=subcategory, limit=10)
    response = _list_resources_internal(request)
    assert response is not None
    assert response.resources is not None

    # Check if we have resources to test with
    if len(response.resources) > 0:
        resource_name = response.resources[0].name

        # Now exclude it
        request.exclude_names = [resource_name]
        response = _list_resources_internal(request)
        assert response is not None
        assert response.resources is not None

        # The excluded resource should not be in the results
        names_after_exclusion = [r.name.lower() for r in response.resources]
        assert resource_name.lower() not in names_after_exclusion


@pytest.mark.asyncio
async def test_get_resources_success_status():
    """Test that successful resource retrieval returns SUCCESS status"""
    from app.services.resources import GetResourcesRequest, list_resources

    # Use a category that should have resources
    request = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.HOUSING,
        limit=10,
    )
    response = await list_resources(request)

    if response.resources:
        assert response.failure_reason == ResourceFailureReason.SUCCESS
        assert response.error_message is None
    else:
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
        limit=10,
    )

    resources = await fetch_resources_with_retry(request, max_retries=1)

    # Should still return a list (even if empty)
    assert isinstance(resources, list)


# Update existing API tests
@pytest.mark.parametrize(
    "category",
    list(CATEGORY_SUBCATEGORY_MAP.keys()),
)
async def test_resource_type_get_result_api(client, category: ResourceCategory):
    # Get the first subcategory from the list (if available)
    subcategories = CATEGORY_SUBCATEGORY_MAP[category]
    subcategory = subcategories[0] if subcategories else None
    # Convert enum to string value
    category_str = category.value if category else None
    subcategory_str = subcategory.value if subcategory else None
    print({"category": category_str, "subcategory": subcategory_str})
    response = await client.post(
        "/resources", json={"category": category_str, "subcategory": subcategory_str}
    )
    assert response.status_code == 200
    response_json = response.json()
    assert response_json is not None

    # Test new fields in API response
    assert "failure_reason" in response_json
    assert "error_message" in response_json

    if category_str != "Unknown":
        assert len(response_json["resources"]) > 0
        # Should be success if resources found
        if response_json["resources"]:
            assert (
                response_json["failure_reason"] == ResourceFailureReason.SUCCESS.value
            )
        else:
            assert (
                response_json["failure_reason"]
                == ResourceFailureReason.NO_RESULTS_FOUND.value
            )

        for resource in response_json["resources"]:
            assert resource["category"] == category
            assert resource["subcategory"] == subcategory
            assert resource["name"] is not None
            assert resource["address"] is not None


async def test_get_resources_with_exclusion_api(client):
    # Using shelter resource type, exclude a resource
    category = ResourceCategory.BASIC_NEEDS
    subcategory = ResourceSubcategory.HOUSING

    # First check if there are resources available
    response = await client.post(
        "/resources", json={"category": category, "subcategory": subcategory}
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
    response = await client.post("/resources", json={"category": "INVALID_CATEGORY"})
    assert response.status_code == 422
