from typing import Optional

from fastapi import APIRouter, Query

from app.utils.address_autocomplete import (
    AutocompleteAddressResponse,
    AutocompleteCityResponse,
)
from app.utils.address_autocomplete import (
    autocomplete_address as autocomplete_address_util,
)
from app.utils.address_autocomplete import (
    autocomplete_city as autocomplete_city_util,
)

router = APIRouter()


@router.get(
    "/address",
    summary="Autocomplete address suggestions",
    description="Provides address autocomplete suggestions as user types, similar to Uber's address input",
    response_model=AutocompleteAddressResponse,
)
async def autocomplete_address(
    input: str = Query(..., min_length=2),
) -> AutocompleteAddressResponse:
    """
    Autocomplete address suggestions as user types
    Similar to Uber's address input
    """
    return await autocomplete_address_util(input)


@router.get(
    "/city",
    summary="Autocomplete city suggestions",
    description="Provides city autocomplete suggestions for US cities as user types, with optional state filtering",
    response_model=AutocompleteCityResponse,
)
async def autocomplete_city(
    input: str = Query(..., min_length=2),
    state: Optional[str] = Query(
        None,
        description="Optional US state name or abbreviation (e.g., 'California' or 'CA')",
    ),
    address_suggestion_selected: Optional[bool] = Query(
        None,
        description="Optional boolean indicating if an address suggestion was selected",
    ),
) -> AutocompleteCityResponse:
    """
    Autocomplete city suggestions as user types
    Filters for US cities only, with optional state filter
    """
    return await autocomplete_city_util(input, state, address_suggestion_selected)
