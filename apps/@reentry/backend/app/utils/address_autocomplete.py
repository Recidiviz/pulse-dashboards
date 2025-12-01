import logging
from typing import List, Optional

import httpx
from google.auth import default
from google.auth.transport.requests import Request as GoogleAuthRequest
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Initialize Google Cloud credentials using Application Default Credentials
# Set up ADC by running: gcloud auth application-default login
credentials, project = default(
    scopes=["https://www.googleapis.com/auth/cloud-platform"]
)
PLACES_API_URL = "https://places.googleapis.com/v1/places:autocomplete"

US_STATES = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming",
    "DC": "District of Columbia",
}


def extract_state_code(secondary_text: str) -> Optional[str]:
    """
    Extract state code from secondary text like 'California, USA' or 'TX, USA'.

    Args:
        secondary_text: The secondary text from Places API (e.g., "California, USA")

    Returns:
        Two-letter state code (e.g., "CA") or None if not found
    """
    parts = secondary_text.split(",")
    if len(parts) >= 1:
        state_part = parts[0].strip()
        # Check if it's already a state code (2 letters)
        if len(state_part) == 2 and state_part.upper() in US_STATES:
            return state_part.upper()
        # Check if it's a state name
        for code, name in US_STATES.items():
            if name.lower() == state_part.lower():
                return code
    return None


class AddressSuggestion(BaseModel):
    place_id: str
    description: str
    main_text: str
    secondary_text: str


class AutocompleteAddressResponse(BaseModel):
    success: bool
    suggestions: List[AddressSuggestion]
    error: Optional[str] = None


class CitySuggestion(BaseModel):
    place_id: str
    description: str
    main_text: str
    secondary_text: str
    state_code: Optional[str] = None


class AutocompleteCityResponse(BaseModel):
    success: bool
    suggestions: List[CitySuggestion]
    error: Optional[str] = None


async def autocomplete_address(input: str) -> AutocompleteAddressResponse:
    """
    Autocomplete address suggestions as user types using Google Places API.
    Similar to Uber's address input.

    Args:
        input: The address input string (minimum 2 characters)

    Returns:
        AutocompleteAddressResponse with suggestions or error
    """
    logger.info(f"🔍 Autocompleting address for input: {input}")

    try:
        # Refresh credentials if needed
        if not credentials.valid:
            credentials.refresh(GoogleAuthRequest())

        # Prepare request body for Places API (New)
        request_body = {
            "input": input,
            "includedPrimaryTypes": ["street_address", "premise", "subpremise"],
            "includedRegionCodes": ["US"],
            "languageCode": "en",
        }

        # Make authenticated request to Google Places API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                PLACES_API_URL,
                json=request_body,
                headers={
                    "Authorization": f"Bearer {credentials.token}",
                    "Content-Type": "application/json",
                    "X-Goog-User-Project": project if project else "",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            result = response.json()

        # Parse suggestions from the response
        suggestions = []
        for suggestion in result.get("suggestions", []):
            place_prediction = suggestion.get("placePrediction", {})
            structured_format = place_prediction.get("structuredFormat", {})

            suggestions.append(
                AddressSuggestion(
                    place_id=place_prediction.get("placeId", ""),
                    description=place_prediction.get("text", {}).get("text", ""),
                    main_text=structured_format.get("mainText", {}).get("text", ""),
                    secondary_text=structured_format.get("secondaryText", {}).get(
                        "text", ""
                    ),
                )
            )

        return AutocompleteAddressResponse(success=True, suggestions=suggestions)

    except httpx.HTTPStatusError as e:
        logger.error(
            f"Places API HTTP error: {e.response.status_code} - {e.response.text}"
        )
        return AutocompleteAddressResponse(
            success=False, suggestions=[], error=f"API error: {e.response.status_code}"
        )
    except Exception as e:
        logger.error(f"Autocomplete error: {e}")
        return AutocompleteAddressResponse(success=False, suggestions=[], error=str(e))


async def autocomplete_city(
    input: str,
    state: Optional[str] = None,
    address_suggestion_selected: Optional[bool] = None,
) -> AutocompleteCityResponse:
    """
    Autocomplete city suggestions as user types using Google Places API.
    Filters for US cities only.

    Args:
        input: The city name input string (minimum 2 characters)
        state: Optional US state name or abbreviation to filter results (e.g., "California" or "CA")

    Returns:
        AutocompleteCityResponse with city suggestions or error
    """
    # If state is provided, append it to the input for better filtering
    state_name = US_STATES.get(state.upper(), state) if state else state
    search_input = f"{input}, {state_name}" if state_name else input
    logger.info(f"🔍 Autocompleting city for input: {search_input}")
    print(search_input)
    try:
        # Refresh credentials if needed
        if not credentials.valid:
            credentials.refresh(GoogleAuthRequest())

        # Prepare request body for Places API (New) - using locality for cities
        request_body = {
            "input": search_input,
            "includedPrimaryTypes": [
                "locality",
                "sublocality",
                "neighborhood",
                "postal_town",
            ],
            "includedRegionCodes": ["US"],
            "languageCode": "en",
        }
        # Make authenticated request to Google Places API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                PLACES_API_URL,
                json=request_body,
                headers={
                    "Authorization": f"Bearer {credentials.token}",
                    "Content-Type": "application/json",
                    "X-Goog-User-Project": project if project else "",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            result = response.json()

        # Parse suggestions from the response
        suggestions = []
        for suggestion in result.get("suggestions", []):
            place_prediction = suggestion.get("placePrediction", {})
            structured_format = place_prediction.get("structuredFormat", {})
            secondary_text = structured_format.get("secondaryText", {}).get("text", "")

            suggestions.append(
                CitySuggestion(
                    place_id=place_prediction.get("placeId", ""),
                    description=place_prediction.get("text", {}).get("text", ""),
                    main_text=structured_format.get("mainText", {}).get("text", ""),
                    secondary_text=secondary_text,
                    state_code=extract_state_code(secondary_text),
                )
            )
        return AutocompleteCityResponse(success=True, suggestions=suggestions)

    except httpx.HTTPStatusError as e:
        logger.error(
            f"Places API HTTP error: {e.response.status_code} - {e.response.text}"
        )
        return AutocompleteCityResponse(
            success=False, suggestions=[], error=f"API error: {e.response.status_code}"
        )
    except Exception as e:
        logger.error(f"City autocomplete error: {e}")
        return AutocompleteCityResponse(success=False, suggestions=[], error=str(e))
