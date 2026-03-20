import json
from typing import Optional

import redis
import structlog
from google.cloud import bigquery

from app.core.config import settings
from app.services.client_data.types import ClientDataRecord, FullNameModel
from app.utils.state_code import normalize_state_code

# Cache expiration time (6 hours)
CACHE_TTL = 21600  # seconds

# Initialize Redis client
redis_client = redis.from_url(settings.REDIS_URL)

logger = structlog.get_logger(__name__)

# Global BigQuery client instance
_bq_client = None


def set_bigquery_client(client):
    """
    Override the default BigQuery client.

    This is primarily used for testing to inject a mock client.
    """
    global _bq_client
    _bq_client = client


def get_bigquery_client():
    """
    Get or initialize the BigQuery client.

    This function lazily initializes the client when first needed,
    allowing it to be more easily mocked in tests.
    """
    global _bq_client
    if _bq_client is None:
        _bq_client = bigquery.Client(project=settings.BQ_PROJECT_ID)
    return _bq_client


def format_name_capitalization(name_dict):
    """
    Ensure consistent capitalization of names.

    Args:
        name_dict: Dictionary containing name components or string representation

    Returns:
        A dictionary with properly capitalized name components

    Raises:
        KeyError: If required keys (given_names or surname) are missing
        ValueError: If the input cannot be parsed
    """
    # Handle case where name_dict is a string representation of a dictionary
    if (
        isinstance(name_dict, str)
        and name_dict.strip().startswith("{")
        and name_dict.strip().endswith("}")
    ):
        try:
            # Try parsing as JSON first (handles escaped quotes properly)
            name_dict = json.loads(name_dict)
        except json.JSONDecodeError:
            # If JSON parsing fails, preprocess for Python dict format with apostrophes
            import ast
            import re

            try:
                processed = name_dict.strip()

                # Match pattern: 'key': 'value...', or 'key': 'value...'}
                # The value may contain apostrophes and continues until we hit a comma or closing brace
                # Pattern: 'key': 'value content' followed by , or }
                # We need to escape apostrophes within the value part

                def escape_value_apostrophes(match):
                    """Escape apostrophes in string values for ast.literal_eval."""
                    key = match.group(1)
                    value = match.group(2)
                    terminator = match.group(3)  # comma or closing brace

                    # Escape apostrophes in the value
                    escaped_value = value.replace("'", "\\'")

                    return f"'{key}': '{escaped_value}'{terminator}"

                # Pattern explanation:
                # '([^']+)' - matches 'key'
                # \s*:\s* - matches : with optional whitespace
                # '([^']*(?:'[^']*)*?)' - matches 'value' potentially containing apostrophes
                # (,|}) - matches comma or closing brace
                # This pattern matches: 'key': 'value with any apostrophes',
                pattern = r"'([^']+)'\s*:\s*'(.*?)'(\s*[,}])"

                processed = re.sub(pattern, escape_value_apostrophes, processed)

                name_dict = ast.literal_eval(processed)
            except Exception as e:
                logger.error(f"Error parsing full_name string as dictionary: {e}")
                raise ValueError(f"Cannot parse name string: {e}")

    # Validate required fields are present
    if not isinstance(name_dict, dict):
        raise ValueError(
            "name_dict must be a dictionary or string representation of one"
        )

    if "given_names" not in name_dict:
        raise KeyError("Required field 'given_names' is missing")

    if "surname" not in name_dict:
        raise KeyError("Required field 'surname' is missing")

    # Process a dictionary with name components
    # Use .get() with defaults for optional fields
    given_names = name_dict["given_names"]
    surname = name_dict["surname"]
    middle_names = name_dict.get("middle_names", "")
    name_suffix = name_dict.get("name_suffix", "")

    # Helper function to format suffix appropriately
    def format_suffix(suffix: str) -> str:
        """Format suffix with proper capitalization."""
        if not suffix:
            return ""

        suffix_lower = suffix.lower().rstrip(".")

        # Roman numerals should be uppercase
        roman_numerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"]
        if suffix_lower in roman_numerals:
            return suffix_lower.upper()

        # Common suffixes with standard formatting
        suffix_map = {
            "jr": "Jr.",
            "sr": "Sr.",
            "esq": "Esq.",
            "phd": "PhD",
            "md": "MD",
            "dds": "DDS",
        }

        if suffix_lower in suffix_map:
            return suffix_map[suffix_lower]

        # For anything else, capitalize
        return suffix.title()

    # Capitalize names, handling None values
    return {
        "given_names": given_names.title() if given_names else "",
        "middle_names": middle_names.title() if middle_names else "",
        "surname": surname.title() if surname else "",
        "name_suffix": format_suffix(name_suffix),
    }


def get_client_from_cache(cache_key: str) -> Optional[ClientDataRecord]:
    """
    Try to retrieve a client record from the Redis cache

    Args:
        cache_key: The Redis cache key

    Returns:
        The client record if found in cache, None otherwise
    """
    cached_data = redis_client.get(cache_key)

    if cached_data:
        try:
            # Deserialize JSON and validate with Pydantic
            json_str = (
                cached_data.decode("utf-8")
                if isinstance(cached_data, bytes)
                else str(cached_data)
            )

            # Handle both single records and lists of records
            data = json.loads(json_str)
            if isinstance(data, list):
                client_data = [ClientDataRecord.model_validate(item) for item in data]
            else:
                client_data = ClientDataRecord.model_validate(data)

            logger.info(f"Client found in cache with key: {cache_key}")
            return client_data
        except Exception as e:
            logger.error(
                f"Error deserializing cached client data for {cache_key}: {str(e)}"
            )

    return None


def process_client_row(row) -> Optional[ClientDataRecord]:
    """
    Process a database row into a ClientDataRecord

    Args:
        row: The database result row

    Returns:
        A ClientDataRecord object or None if processing fails
    """
    try:
        # Handle full_name with proper capitalization
        full_name_data = row.full_name
        capitalized_data = format_name_capitalization(full_name_data)
        full_name = FullNameModel(**capitalized_data)

        if not hasattr(row, "location"):
            id_type = getattr(
                row, "external_id", getattr(row, "pseudonymized_id", "unknown")
            )
            logger.info(
                f"Client {id_type} row does not have a location attribute: {row}"
            )

        location = row.location if hasattr(row, "location") else []

        client_record = ClientDataRecord(
            external_client_id=row.external_id,
            pseudonymized_client_id=row.pseudonymized_id,
            full_name=full_name,
            birthdate=row.birthdate,
            state_code=normalize_state_code(row.state_code),
            location=location,
        )
        return client_record
    except Exception as e:
        id_type = getattr(
            row, "external_id", getattr(row, "pseudonymized_id", "unknown")
        )
        logger.error(f"Error processing client data for {id_type}: {str(e)}")
        return None


def cache_client_record(
    cache_key: str, client_record: ClientDataRecord | list[ClientDataRecord]
) -> bool:
    """
    Cache a client record in Redis

    Args:
        cache_key: The Redis cache key
        client_record: The client record(s) to cache (single or list)

    Returns:
        True if caching was successful, False otherwise
    """
    try:
        # Serialize to JSON using Pydantic
        if isinstance(client_record, list):
            json_data = json.dumps([record.model_dump() for record in client_record])
        else:
            json_data = client_record.model_dump_json()

        redis_client.setex(cache_key, CACHE_TTL, json_data)
        return True
    except Exception as e:
        if isinstance(client_record, list):
            id_info = f"list of {len(client_record)} clients"
        else:
            id_info = getattr(
                client_record,
                "external_client_id",
                getattr(client_record, "pseudonymized_client_id", "unknown"),
            )
        logger.error(f"Error caching client data for {id_info}: {str(e)}")
        return False
