import json
import pickle
from typing import Optional

import redis
import structlog
from google.cloud import bigquery

from app.core.config import settings
from app.services.client_data.types import ClientDataRecord, FullNameModel
from app.utils.state_code import normalize_state_code

# Cache expiration time (5 minutes)
CACHE_TTL = 300  # seconds

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
        name_dict: Dictionary containing name components

    Returns:
        A dictionary with properly capitalized name components
    """
    # Handle case where name_dict is a string representation of a dictionary
    if (
        isinstance(name_dict, str)
        and name_dict.strip().startswith("{")
        and name_dict.strip().endswith("}")
    ):
        try:
            # Strip quotes and replace single quotes with double quotes for proper JSON
            cleaned_str = name_dict.replace("'", '"')
            name_dict = json.loads(cleaned_str)
        except Exception as e:
            logger.error(f"Error parsing full_name string as dictionary: {e}")
            # Return placeholder dictionary on error
            return {
                "given_names": "Unknown",
                "middle_names": "",
                "surname": "User",
                "name_suffix": "",
            }

    # Process a dictionary with name components
    try:
        return {
            "given_names": name_dict["given_names"].title()
            if name_dict["given_names"]
            else "",
            "middle_names": name_dict["middle_names"].title()
            if name_dict["middle_names"]
            else "",
            "surname": name_dict["surname"].title() if name_dict["surname"] else "",
            # Don't capitalize suffix like "Jr." or "III"
            "name_suffix": name_dict["name_suffix"] if name_dict["name_suffix"] else "",
        }
    except Exception as e:
        logger.error(f"Error formatting name dictionary: {e}")
        return {
            "given_names": "Unknown",
            "middle_names": "",
            "surname": "User",
            "name_suffix": "",
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
            client_data = pickle.loads(cached_data)
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

        client_record = ClientDataRecord(
            external_client_id=row.external_id,
            pseudonymized_client_id=row.pseudonymized_id,
            full_name=full_name,
            birthdate=row.birthdate,
            state_code=normalize_state_code(row.state_code),
        )
        return client_record
    except Exception as e:
        id_type = getattr(
            row, "external_id", getattr(row, "pseudonymized_id", "unknown")
        )
        logger.error(f"Error processing client data for {id_type}: {str(e)}")
        return None


def cache_client_record(cache_key: str, client_record: ClientDataRecord) -> bool:
    """
    Cache a client record in Redis

    Args:
        cache_key: The Redis cache key
        client_record: The client record to cache

    Returns:
        True if caching was successful, False otherwise
    """
    try:
        redis_client.setex(cache_key, CACHE_TTL, pickle.dumps(client_record))
        return True
    except Exception as e:
        id_info = getattr(
            client_record,
            "external_client_id",
            getattr(client_record, "pseudonymized_client_id", "unknown"),
        )
        logger.error(f"Error caching client data for {id_info}: {str(e)}")
        return False
