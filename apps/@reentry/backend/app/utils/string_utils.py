"""String utility functions for data configuration normalization."""

import string


def normalize_code(code_str: str) -> str:
    """
    Normalize a code by converting to lowercase and removing punctuation.

    This normalization is used consistently across the codebase for config codes
    to ensure case-insensitive and punctuation-insensitive matching.

    Args:
        code_str: The code string to normalize (e.g., "UT-CCCI", "ID_FACR")

    Returns:
        Normalized code (e.g., "utccci", "idfacr")

    Example:
        >>> normalize_code("UT-CCCI")
        'utccci'
        >>> normalize_code("ID_FACR")
        'idfacr'
    """
    translator = str.maketrans("", "", string.punctuation)
    return code_str.casefold().translate(translator)


def escape_sql_string(content: str) -> str:
    """
    Escape single quotes in SQL string literals.

    This is used when embedding string values in SQL statements to prevent
    syntax errors and SQL injection vulnerabilities.

    Args:
        content: The string content to escape

    Returns:
        String with single quotes escaped (doubled)

    Example:
        >>> escape_sql_string("test's string")
        "test''s string"
        >>> escape_sql_string("it's a test")
        "it''s a test"
    """
    return content.replace("'", "''")


def normalize_locations(locations: list[str]) -> list[str]:
    """
    Normalize a list of location codes.

    This function applies normalization to each location code in the list
    using the `normalize_code` function.

    Example:
        >>> normalize_locations(["ORANGE_STREET_CCC", "DISTRICT_4_-_BOISE"])
        [' ORANGE STREET CCC', 'DISTRICT 4 - BOISE']
    """
    locations = [loc.strip().replace("_", " ") for loc in locations]
    return list(set(locations))
