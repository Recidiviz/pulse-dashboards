"""
Tests for the app.services.resources.types module,
which holds the resource related pydantic models to be used by
the system.

This excludes types used only by app.services.resources.api

"""

import pytest

from app.services.resources.api import TravelMode
from app.services.resources.resource_taxonomy import (
    ResourceCategory,
    ResourceSubcategory,
)
from app.services.resources.types import (
    ClientExtractedInfo,
    GetResourcesRequest,
)


def test_build_GetResourcesRequest__no_address():
    """Tests we don't build a GetResourcesRequest when there is no address in ClientExtractedInfo."""

    all_default = ClientExtractedInfo()
    with pytest.raises(
        ValueError,
        match=r"At least one address \(home, work, school, or probation_office\) is required to request resources.",
    ):
        GetResourcesRequest.from_client_extracted_info(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            client_info=all_default,
            limit=10,
            keywords_to_exclude=None,
        )

    with pytest.raises(
        ValueError,
        match=r"At least one address \(home, work, school, or probation_office\) is required to request resources.",
    ):
        GetResourcesRequest.from_client_extracted_json(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            client_info_json=all_default.model_dump(),
            limit=10,
            keywords_to_exclude=None,
        )


def test_build_GetResourcesRequest__invalid_json():
    """Ensures we fail clearly when trying to build a request from invalid client info JSON."""
    # This doesn't throw because pydantic will just ignore the extra field
    GetResourcesRequest.from_client_extracted_json(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        client_info_json={"extra_field": "value", "home": "123 Main St"},
        limit=10,
        keywords_to_exclude=None,
    )

    with pytest.raises(
        ValueError,
        match="Input should be a valid string",
    ):
        GetResourcesRequest.from_client_extracted_json(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            client_info_json={"extra_field": "value", "work": 2},
            limit=10,
            keywords_to_exclude=None,
        )

    # TODO(#10014): This currently doesn't throw because we only check for address
    # fields to be strings. Ideally we have more strict validation on a client address
    GetResourcesRequest.from_client_extracted_json(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        client_info_json={"extra_field": "value", "work": "2"},
        limit=10,
        keywords_to_exclude=None,
    )


@pytest.mark.parametrize("field_name", ["category", "address", "subcategory"])
def test_build_GetResourcesRequest__missing_required_fields(field_name):
    """Tests we don't build a GetResourcesRequest when we're missing required fields."""
    data = {
        "category": ResourceCategory.BASIC_NEEDS,
        "subcategory": ResourceSubcategory.FOOD_ASSISTANCE,
        "address": "123 Main St, Anytown, USA",
    }
    data.pop(field_name)
    with pytest.raises(ValueError, match="type=missing"):
        GetResourcesRequest(**data)


def test_build_GetResourcesRequest__request_address():
    """Tests that our expectations of the requested address line up from extracted info."""

    client_info = ClientExtractedInfo()

    # Go in reverse order of precedence to make sure we get the right address
    # for all fields
    for field in ["probation_office", "school", "work", "home"]:
        correct_address = f"{field} address"
        setattr(client_info, field, correct_address)
        request = GetResourcesRequest.from_client_extracted_info(
            category=ResourceCategory.BASIC_NEEDS,
            subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
            client_info=client_info,
            limit=10,
            keywords_to_exclude=None,
        )
        assert request.address == correct_address


def test_build_GetResourcesRequest__travel_info():
    """Tests that our expectations of the requested address line up from extracted info."""

    # We default ClientExtractedInfo to can_walk if no info is provided
    walking = GetResourcesRequest.from_client_extracted_info(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        client_info=ClientExtractedInfo(home="home address"),
        limit=10,
        keywords_to_exclude=None,
    )
    assert walking.travel_mode == TravelMode.WALK
    assert walking.distance_miles == 5

    client_info = ClientExtractedInfo(
        can_drive=True,
        home="home address",
    )
    request = GetResourcesRequest.from_client_extracted_info(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        client_info=client_info,
        limit=10,
        keywords_to_exclude=None,
    )
    assert request.travel_mode == TravelMode.DRIVE
    assert request.distance_miles == 100

    # We default to no travel mode within 100 miles if building directly
    # (not from ClientExtractedInfo)
    no_travel_mode = GetResourcesRequest(
        category=ResourceCategory.BASIC_NEEDS,
        subcategory=ResourceSubcategory.FOOD_ASSISTANCE,
        address="123 Main St, Anytown, USA",
        limit=10,
        keywords_to_exclude=[],
    )
    no_travel_mode.travel_mode = None
    no_travel_mode.distance_miles = 100


async def test_get_resources_invalid_resource_type_api(client):
    """Tests that we return 422 when the GetResourcesRequest is invalid"""
    response = await client.post(
        "/resources",
        json={
            "category": "INVALID_CATEGORY",
            "address": "123 Anywhere St, UT 84057",
        },
    )
    assert response.status_code == 422
