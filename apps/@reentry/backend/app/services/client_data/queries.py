"""
User data
========

This is the data that will be user for the pilot.
It is stored in big query

Example of a client record
{
    external_id
    pseudonymized_id
    staff_id (-> case_manager.external_id)
    full_name
    birthdate
}

Example of a case manager record
{
    external_id (<- client.staff_id)
    pseudonymized_id (this is the one that will match up with the auth0 metadata)
    email
    full_name
    client_ids (-> client.external_id, it's an array)
    state_code
}

"""

import pickle
from datetime import date
from typing import Dict, List, Optional

from google.cloud import bigquery

from app.core.config import settings
from app.services.client_data.types import (
    CaseWorkerDataRecord,
    ClientDataRecord,
    FullNameModel,
)
from app.services.client_data.utils import (
    CACHE_TTL,
    cache_client_record,
    format_name_capitalization,
    get_bigquery_client,
    get_client_from_cache,
    logger,
    process_client_row,
    redis_client,
)


def get_client_data(
    external_client_id: str, pseudonymized_staff_id: str
) -> ClientDataRecord | None:
    """
    Searches for a set of records
    ignores undefined record
    unordered results

    Args:
        external_client_id: The external ID of the client
        pseudonymized_staff_id: The pseudonymized ID of the staff member (from auth0)
    """
    # Check if staff is assigned to this client
    staff_record = get_caseworker_by_pseudonymized_id(pseudonymized_staff_id)
    if staff_record and external_client_id in staff_record.external_client_ids:
        client_record = get_client_data_unsafe(external_client_id)
        if client_record:
            return client_record

        # Staff not assigned, log the access attempt
        logger.warning(
            f"Staff {pseudonymized_staff_id} attempted to access client {external_client_id} without permission"
        )
        return None


def get_clients_by_external_ids(
    external_client_ids: List[str],
) -> Dict[str, ClientDataRecord]:
    """
    Get multiple client records by their external IDs in a single batch query
    Uses Redis caching to improve performance
    Returns a dictionary mapping external_client_id to ClientDataRecord

    Args:
        external_client_ids: List of external client IDs to retrieve
    """
    if not external_client_ids:
        return {}

    # Check for cached results first
    cached_results = {}
    missing_ids = []

    # Try to get each client from cache
    for external_id in external_client_ids:
        cache_key = f"client:{external_id}"
        client_record = get_client_from_cache(cache_key)

        if client_record:
            cached_results[external_id] = client_record
        else:
            missing_ids.append(external_id)

    # If all clients were in cache, return immediately
    if not missing_ids:
        logger.info(f"All {len(external_client_ids)} clients found in cache")
        return cached_results

    # Otherwise, fetch missing clients from BigQuery in a single query
    logger.info(f"Fetching {len(missing_ids)} clients from BigQuery in batch")

    # Create placeholders for the IN clause
    placeholders = ", ".join([f"'{id}'" for id in missing_ids])

    query = f"""
    SELECT
      external_id,
      pseudonymized_id,
      full_name,
      birthdate,
      state_code,
    FROM
      `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}`
    WHERE
      external_id IN ({placeholders})
    """

    try:
        client = get_bigquery_client()
        query_job = client.query(query)
        results = query_job.result()

        # Process results and cache them
        for row in results:
            client_record = process_client_row(row)
            if not client_record:
                continue

            # Add to results
            cached_results[client_record.external_client_id] = client_record

            # Cache the result
            cache_key = f"client:{client_record.external_client_id}"
            cache_client_record(cache_key, client_record)

        logger.info(f"Successfully fetched {len(cached_results)} clients")
        return cached_results
    except Exception as e:
        logger.error(f"Error fetching clients in batch: {str(e)}")
        return cached_results  # Return any clients we did find in cache


def get_client_by_pseudonymized_id_unsafe(
    pseudonymized_id: str,
) -> Optional[ClientDataRecord]:
    """
    Get a client record by pseudonymized ID
    Uses Redis caching to improve performance
    Returns the ClientDataRecord or None if not found

    Args:
        pseudonymized_id: The pseudonymized client ID to retrieve
    """
    if not pseudonymized_id:
        return None

    pseudonymized_id = str(pseudonymized_id).strip()

    logger.info(f"Looking for client with pseudonymized ID: {pseudonymized_id}")

    # Check for cached results first
    cache_key = f"client_by_pseudo:{pseudonymized_id}"
    client_record = get_client_from_cache(cache_key)

    if client_record:
        return client_record

    # Fetch client from BigQuery
    logger.info(
        f"Fetching client with pseudonymized ID {pseudonymized_id} from BigQuery"
    )

    escaped_id = pseudonymized_id.replace("'", "''")
    quoted_id = f"'{escaped_id}'"

    query = f"""
    SELECT
      external_id,
      pseudonymized_id,
      full_name,
      birthdate,
      state_code,
    FROM
      `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}`
    WHERE
      pseudonymized_id = {quoted_id}
    LIMIT 1
    """

    try:
        client = get_bigquery_client()
        query_job = client.query(query)
        results = query_job.result()

        client_record = None
        for row in results:
            client_record = process_client_row(row)
            if client_record:
                # Cache the result
                cache_client_record(cache_key, client_record)
                break

        if client_record:
            logger.info(
                f"Successfully fetched client with pseudonymized ID {pseudonymized_id}"
            )
            return client_record
        else:
            logger.info(f"No client found with pseudonymized ID {pseudonymized_id}")
            return None
    except Exception as e:
        logger.error(
            f"Error fetching client with pseudonymized ID {pseudonymized_id}: {str(e)}"
        )
        return None


def get_client_by_names_and_dob(
    first_name: str,
    last_name: str,
    date_of_birth: date,
) -> Optional[ClientDataRecord]:
    """
    Get a client record by personal details (first name, last name, date of birth)
    Uses Redis caching to improve performance
    Returns the ClientDataRecord or None if not found

    Args:
        first_name: The first name of the client
        last_name: The last name of the client
        date_of_birth: The date of birth of the client
    """
    if not first_name or not last_name or not date_of_birth:
        return None

    first_name = str(first_name).strip()
    last_name = str(last_name).strip()
    date_of_birth = date_of_birth.isoformat()  # Ensure date is in ISO format

    logger.info(
        f"Looking for client with name: {first_name} {last_name} and DOB: {date_of_birth}"
    )

    # Check for cached results first
    cache_key = f"client_by_name_dob:{first_name}:{last_name}:{date_of_birth}"
    client_record = get_client_from_cache(cache_key)

    if client_record:
        return client_record

    # Fetch client from BigQuery
    logger.info(
        f"Fetching client with name {first_name} {last_name} and DOB {date_of_birth} from BigQuery"
    )
    escaped_first_name = first_name.replace("'", "''")
    escaped_last_name = last_name.replace("'", "''")
    logger.info(
        f"Escaped names: first_name={escaped_first_name}, last_name={escaped_last_name}, birthdate={date_of_birth}"
    )

    query = f"""
    SELECT
      external_id,
      pseudonymized_id,
      full_name,
      birthdate,
      state_code,
    FROM
      `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}`
    WHERE
        UPPER(JSON_VALUE(full_name, "$.given_names")) = UPPER('{escaped_first_name}')
        AND UPPER(JSON_VALUE(full_name, "$.surname")) = UPPER('{escaped_last_name}')
        AND birthdate = DATE('{date_of_birth}')
    """

    try:
        client = get_bigquery_client()
        query_job = client.query(query)
        results = query_job.result()

        client_record = None
        for row in results:
            client_record = process_client_row(row)
            if client_record:
                # Cache the result
                cache_client_record(cache_key, client_record)
                break

        if client_record:
            logger.info(
                f"Successfully  fetched client with name {first_name} {last_name} and DOB {date_of_birth}"
            )
            return client_record
        else:
            logger.info(
                f"No client found with name {first_name} {last_name} and DOB {date_of_birth}"
            )
            return None
    except Exception as e:
        logger.error(
            f"Error fetching client with {first_name} {last_name} and DOB {date_of_birth}: {str(e)}"
        )
        return None


def get_client_data_unsafe(external_client_id: str) -> ClientDataRecord | None:
    """
    Get client data without staff verification
    Uses Redis caching to improve performance

    Now implemented using the batch function for consistency

    Args:
        external_client_id: The external ID of the client to retrieve
    """
    clients = get_clients_by_external_ids([external_client_id])
    return clients.get(external_client_id)


def get_clients_by_external_staff_id(external_staff_id: str) -> list[ClientDataRecord]:
    """
    Get all clients assigned to a specific staff member
    Uses Redis caching to improve performance

    Args:
        external_staff_id: The external ID of the staff member
    """

    # Check if we have this data in cache
    cache_key = f"staff_clients:{external_staff_id}"
    cached_data = redis_client.get(cache_key)
    if cached_data:
        # Data found in cache, deserialize and return
        logger.info(f"Cache hit for external_staff_id {external_staff_id}")
        try:
            clients_data = pickle.loads(cached_data)
            return clients_data
        except Exception as e:
            logger.error(f"Error deserializing cached client data: {str(e)}")
            # Continue to fetch from BigQuery on cache error
    else:
        logger.info(f"Cache miss for external_staff_id {external_staff_id}")

    # Data not in cache or error deserializing, fetch from BigQuery
    query = f"""
    SELECT
      client.external_id,
      client.pseudonymized_id,
      client.full_name,
      client.birthdate,
      client.state_code,
    FROM (
      SELECT
        *
      FROM
        `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CASE_MANAGER_TABLE}`
      UNION ALL
      SELECT
        *
      FROM
        `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_SUPERVISION_OFFICER_TABLE}`) officer,
      UNNEST(officer.client_ids) AS client_external_id
    LEFT JOIN
      `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}` client
    ON
      client_external_id = client.external_id
      {'AND officer.state_code = client.state_code' if settings.ENV_NAME == "staging" or settings.ENV_NAME == "prod" else ''}
    WHERE
      officer.external_id = @external_staff_id
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "external_staff_id", "STRING", external_staff_id
            ),
        ]
    )

    try:
        client = get_bigquery_client()
        results = client.query_and_wait(query, job_config=job_config)
        clients = []
        for row in results:
            try:
                if row.full_name and row.pseudonymized_id:
                    # Handle full_name with proper capitalization
                    full_name_data = row.full_name
                    capitalized_data = format_name_capitalization(full_name_data)
                    full_name = FullNameModel(**capitalized_data)

                    clients.append(
                        ClientDataRecord(
                            external_client_id=row.external_id,
                            pseudonymized_client_id=row.pseudonymized_id,
                            full_name=full_name,
                            birthdate=row.birthdate,
                            state_code=row.state_code,
                        )
                    )
            except Exception as e:
                logger.error(f"Error processing client data in staff query: {str(e)}")
                continue

        # Cache the results
        try:
            redis_client.setex(cache_key, CACHE_TTL, pickle.dumps(clients))
            logger.info(
                f"Cached {len(clients)} clients for external_staff_id {external_staff_id}"
            )
        except Exception as e:
            logger.error(f"Error caching client data: {str(e)}")

        return clients
    except Exception as e:
        logger.error(f"Error fetching clients by staff ID: {str(e)}")
        return []


def get_clients_by_pseudonymized_staff_id(
    pseudonymized_staff_id: str,
) -> list[ClientDataRecord]:
    """
    Get all clients assigned to a specific staff member by their pseudonymized ID
    This is a convenience function that first looks up the caseworker by pseudonymized ID
    and then gets all clients assigned to that caseworker's external ID

    Args:
        pseudonymized_staff_id: The pseudonymized ID of the staff member (from Auth0)
    """
    # First get the caseworker record to find the external_staff_id
    caseworker = get_caseworker_by_pseudonymized_id(pseudonymized_staff_id)

    if not caseworker:
        logger.warning(
            f"No caseworker found for pseudonymized_id {pseudonymized_staff_id}"
        )
        return []

    # Now get clients using the external_staff_id
    return get_clients_by_external_staff_id(caseworker.external_staff_id)


def get_caseworker_by_pseudonymized_id(
    pseudonymized_staff_id: str,
) -> CaseWorkerDataRecord | None:
    """
    Get caseworker data by pseudonymized ID (usually from Auth0 metadata)
    Uses Redis caching to improve performance

    Args:
        pseudonymized_staff_id: The pseudonymized ID of the staff member (from Auth0)
    """
    # Check if we have this data in cache
    cache_key = f"caseworker:{pseudonymized_staff_id}"
    cached_data = redis_client.get(cache_key)

    if cached_data:
        # Data found in cache, deserialize and return
        logger.info(f"Cache hit for pseudonymized_staff_id {pseudonymized_staff_id}")
        try:
            caseworker_data = pickle.loads(cached_data)
            return caseworker_data
        except Exception as e:
            logger.error(f"Error deserializing cached caseworker data: {str(e)}")
            # Continue to fetch from BigQuery on cache error
    else:
        logger.info(f"Cache miss for pseudonymized_staff_id {pseudonymized_staff_id}")

    # Data not in cache or error deserializing, fetch from BigQuery
    query = f"""
    SELECT
      external_id,
      pseudonymized_id,
      email,
      full_name,
      client_ids,
      state_code
    FROM (
      SELECT
        *
      FROM
        `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CASE_MANAGER_TABLE}`
      UNION ALL
      SELECT
        *
      FROM
        `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_SUPERVISION_OFFICER_TABLE}`)
    WHERE
      pseudonymized_id = @pseudonymized_staff_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter(
                "pseudonymized_staff_id", "STRING", pseudonymized_staff_id
            ),
        ]
    )

    try:
        client = get_bigquery_client()
        query_job = client.query(query, job_config=job_config)
        results = query_job.result()

        # Get first result if any
        for row in results:
            try:
                # client_ids is now always a list from BigQuery REPEATED field
                client_ids_list = row.client_ids if row.client_ids else []

                # Handle full_name with proper capitalization
                full_name_data = row.full_name
                capitalized_data = format_name_capitalization(full_name_data)
                full_name = FullNameModel(**capitalized_data)

                caseworker = CaseWorkerDataRecord(
                    external_staff_id=row.external_id,
                    pseudonymized_staff_id=row.pseudonymized_id,
                    email=row.email,
                    full_name=full_name,
                    external_client_ids=client_ids_list,
                    state_code=row.state_code,
                )
            except Exception as e:
                logger.error(
                    f"Error processing caseworker data for {pseudonymized_staff_id}: {str(e)}"
                )
                continue

            # Cache the result
            try:
                redis_client.setex(cache_key, CACHE_TTL, pickle.dumps(caseworker))
                logger.info(
                    f"Cached caseworker data for pseudonymized_staff_id {pseudonymized_staff_id}"
                )
            except Exception as e:
                logger.error(f"Error caching caseworker data: {str(e)}")

            return caseworker

        return None
    except Exception as e:
        logger.error(f"Error fetching caseworker by pseudonymized staff ID: {str(e)}")
        return None
