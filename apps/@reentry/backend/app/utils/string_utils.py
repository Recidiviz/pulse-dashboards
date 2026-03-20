"""String utility functions for data configuration normalization."""


def normalize_state_code_format(state_code: str) -> str:
    """
    Normalize state code format (case and separators only).

    This is a format-only normalization for config management that does NOT
    apply state code aliases (like US_ID → US_IX). Use this when the state code
    comes from explicit user input where the exact value should be preserved.

    For client data from BigQuery where US_ID/US_IX aliasing is needed,
    use `app.utils.state_code.normalize_state_code()` instead.

    Args:
        state_code: The state code to normalize (e.g., "us_ut", "US-UT")

    Returns:
        Normalized state code in uppercase with underscores (e.g., "US_UT")

    Example:
        >>> normalize_state_code_format("us_ut")
        'US_UT'
        >>> normalize_state_code_format("US-ID")
        'US_ID'  # Note: NOT converted to US_IX
    """
    return state_code.upper().replace("-", "_")


def normalize_locations(locations: list[str]) -> list[str]:
    """
    Normalize a list of location codes.

    This function applies normalization to each location code in the list
    by stripping whitespace and replacing underscores with spaces.

    Example:
        >>> normalize_locations(["ORANGE_STREET_CCC", "DISTRICT_4_-_BOISE"])
        [' ORANGE STREET CCC', 'DISTRICT 4 - BOISE']
    """
    locations = [loc.strip().replace("_", " ") for loc in locations]
    return list(set(locations))
