"""
User data
========

This is the data that will be user for the pilot.
It is stored in big query

Example of a client record
{
    external_id
    pseudonymized_id
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
from typing import Optional

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


class Queries:
    @staticmethod
    def get_client_data_by_pseudonymized_id(
        pseudonymized_client_id: str, pseudonymized_staff_id: str
    ) -> ClientDataRecord | None:
        """
        Searches for a set of records
        ignores undefined record
        unordered results

        Args:
            pseudonymized_client_id: The pseudonymized ID of the client
            pseudonymized_staff_id: The pseudonymized ID of the staff member (from auth0)
        """
        # Check if staff is assigned to this client
        staff_record = Queries.get_caseworker_by_pseudonymized_id(
            pseudonymized_staff_id
        )
        client_record = Queries.get_client_by_pseudonymized_id_unsafe(
            pseudonymized_client_id
        )
        if (
            staff_record
            and client_record
            and client_record.external_client_id in staff_record.external_client_ids
        ):
            if client_record:
                return client_record

            return None
        logger.warning(
            f"Staff {pseudonymized_staff_id} attempted to access client {pseudonymized_client_id}"
        )

    @staticmethod
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

    @staticmethod
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

    @staticmethod
    def get_clients_by_pseudonymized_staff_id(
        pseudonymized_staff_id: str,
    ) -> list[ClientDataRecord]:
        """
        Get all clients assigned to a specific staff member
        Uses Redis caching to improve performance

        Args:
            pseudonymized_staff_id: The pseudonymized ID of the staff member
        """

        # Check if we have this data in cache
        cache_key = f"staff_clients:{pseudonymized_staff_id}"
        cached_data = redis_client.get(cache_key)
        if cached_data:
            # Data found in cache, deserialize and return
            logger.info(
                f"Cache hit for pseudonymized_staff_id {pseudonymized_staff_id}"
            )
            try:
                clients_data = pickle.loads(cached_data)
                return clients_data
            except Exception as e:
                logger.error(f"Error deserializing cached client data: {str(e)}")
                # Continue to fetch from BigQuery on cache error
        else:
            logger.info(
                f"Cache miss for pseudonymized_staff_id {pseudonymized_staff_id}"
            )

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
        officer.pseudonymized_id = @pseudonymized_staff_id
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
                    logger.error(
                        f"Error processing client data in staff query: {str(e)}"
                    )
                    continue

            # Cache the results
            try:
                redis_client.setex(cache_key, CACHE_TTL, pickle.dumps(clients))
                logger.info(
                    f"Cached {len(clients)} clients for pseudonymized_staff_id {pseudonymized_staff_id}"
                )
            except Exception as e:
                logger.error(f"Error caching client data: {str(e)}")

            return clients
        except Exception as e:
            logger.error(f"Error fetching clients by staff ID: {str(e)}")
            return []

    @staticmethod
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
            logger.info(
                f"Cache hit for pseudonymized_staff_id {pseudonymized_staff_id}"
            )
            try:
                caseworker_data = pickle.loads(cached_data)
                return caseworker_data
            except Exception as e:
                logger.error(f"Error deserializing cached caseworker data: {str(e)}")
                # Continue to fetch from BigQuery on cache error
        else:
            logger.info(
                f"Cache miss for pseudonymized_staff_id {pseudonymized_staff_id}"
            )

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

            rows = list(results)
            if not rows:
                return None

            # Create the CaseWorkerDataRecord with either row's data,
            # but concatenate the client_external_ids from all rows
            all_client_external_ids = []
            for r in rows:
                if r.client_ids:
                    all_client_external_ids.extend(r.client_ids)

            first_row = rows[0]

            try:
                # Handle full_name with proper capitalization
                full_name_data = first_row.full_name
                capitalized_data = format_name_capitalization(full_name_data)
                full_name = FullNameModel(**capitalized_data)

                caseworker = CaseWorkerDataRecord(
                    external_staff_id=first_row.external_id,
                    pseudonymized_staff_id=first_row.pseudonymized_id,
                    email=first_row.email,
                    full_name=full_name,
                    external_client_ids=all_client_external_ids,
                    state_code=first_row.state_code,
                )
            except Exception as e:
                logger.error(
                    f"Error processing caseworker data for {pseudonymized_staff_id}: {str(e)}"
                )
                return None

            # Cache the result
            try:
                redis_client.setex(cache_key, CACHE_TTL, pickle.dumps(caseworker))
                logger.info(
                    f"Cached caseworker data for pseudonymized_staff_id {pseudonymized_staff_id}"
                )
            except Exception as e:
                logger.error(f"Error caching caseworker data: {str(e)}")

            return caseworker
        except Exception as e:
            logger.error(
                f"Error fetching caseworker by pseudonymized staff ID: {str(e)}"
            )
            return None
