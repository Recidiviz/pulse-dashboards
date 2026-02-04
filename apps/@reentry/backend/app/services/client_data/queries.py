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

import json
import pickle
import random
import time
import uuid
from datetime import date
from typing import List, Optional

from google.cloud import bigquery

from app.core.config import settings
from app.services.client_data.exceptions import (
    ClientAlreadyExistsError,
    ClientNotFoundError,
)
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
from app.utils.state_code import normalize_state_code


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
        location
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
    def get_client_by_workflows_pseudonymized_id_unsafe(
        workflows_pseudonymized_id: str,
    ) -> Optional[ClientDataRecord]:
        """
        Get a client record by workflows pseudonymized ID
        Uses Redis caching to improve performance
        Returns the ClientDataRecord or None if not found

        Args:
            workflows_pseudonymized_id: The workflows pseudonymized client ID to retrieve
        """
        if not workflows_pseudonymized_id:
            return None

        workflows_pseudonymized_id = str(workflows_pseudonymized_id).strip()

        logger.info(
            f"Looking for client with workflows pseudonymized ID: {workflows_pseudonymized_id}"
        )

        # Check for cached results first
        cache_key = f"client_by_workflows_pseudo:{workflows_pseudonymized_id}"
        client_record = get_client_from_cache(cache_key)

        if client_record:
            return client_record

        # Fetch client from BigQuery
        logger.info(
            f"Fetching client with workflows pseudonymized ID {workflows_pseudonymized_id} from BigQuery"
        )

        escaped_id = workflows_pseudonymized_id.replace("'", "''")
        quoted_id = f"'{escaped_id}'"

        query = f"""
        SELECT
        external_id,
        pseudonymized_id,
        full_name,
        birthdate,
        state_code,
        location
        FROM
        `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}`
        WHERE
        workflows_pseudonymized_id = {quoted_id}
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
                    f"Successfully fetched client with workflows pseudonymized ID {workflows_pseudonymized_id}"
                )
                return client_record
            else:
                logger.info(
                    f"No client found with workflows pseudonymized ID {workflows_pseudonymized_id}"
                )
                return None
        except Exception as e:
            logger.error(
                f"Error fetching client with workflows pseudonymized ID {workflows_pseudonymized_id}: {str(e)}"
            )
            return None

    @staticmethod
    def get_client_by_doc_id_and_state(
        doc_id: str,
        state_code: str,
    ) -> Optional[ClientDataRecord]:
        """
        Get a client record by DOC ID (external_id) and state code.
        Uses Redis caching to improve performance.
        Returns the ClientDataRecord or None if not found.

        Args:
            doc_id: The document ID (external_id) of the client
            state_code: The state code (e.g., US_UT, US_ID)
        """
        if not doc_id or not state_code:
            return None

        doc_id = str(doc_id).strip()
        state_code = str(state_code).strip().upper()

        # Translate US_ID to US_IX for BigQuery lookup (Idaho uses US_IX internally)
        bq_state_code = "US_IX" if state_code == "US_ID" else state_code

        logger.info(
            f"Looking for client with DOC ID: {doc_id} and state: {state_code} (BQ: {bq_state_code})"
        )

        # Check for cached results first
        cache_key = f"client_by_doc_state:{doc_id}:{bq_state_code}"
        client_record = get_client_from_cache(cache_key)

        if client_record:
            return client_record

        # Fetch client from BigQuery
        logger.info(
            f"Fetching client with DOC ID {doc_id} and state {bq_state_code} from BigQuery"
        )

        escaped_doc_id = doc_id.replace("'", "''")
        escaped_state_code = bq_state_code.replace("'", "''")

        query = f"""
        SELECT
        external_id,
        pseudonymized_id,
        full_name,
        birthdate,
        state_code,
        location
        FROM
        `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}`
        WHERE
            external_id = '{escaped_doc_id}'
            AND state_code = '{escaped_state_code}'
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
                    cache_client_record(cache_key, client_record)
                    break

            if client_record:
                logger.info(
                    f"Successfully fetched client with DOC ID and state {bq_state_code}"
                )
                return client_record
            else:
                logger.info(
                    f"No client found with DOC ID {doc_id} and state {bq_state_code}"
                )
                return None
        except Exception as e:
            logger.error(
                f"Error fetching client with DOC ID {doc_id} and state {bq_state_code}: {str(e)}"
            )
            return None

    @staticmethod
    def get_clients_by_facility_access(
        pseudonymized_staff_id: str, locations: List[str]
    ) -> List[ClientDataRecord]:
        """
        Get all clients accessible to a staff member based on facility/location access.

        Args:
            pseudonymized_staff_id: Staff pseudonymized ID used for access control.
            locations: List of location codes (facilities) the staff can access.
        """

        if not pseudonymized_staff_id or not locations:
            return []

        pseudonymized_staff_id = pseudonymized_staff_id.strip()

        # Cache lookup
        cache_key = (
            f"clients_by_facility:{pseudonymized_staff_id}:{','.join(locations)}"
        )
        cached = get_client_from_cache(cache_key)
        if cached:
            return cached

        logger.info(
            f"Fetching clients for staff '{pseudonymized_staff_id}' with access to {locations}"
        )

        try:
            client = get_bigquery_client()

            query = f"""
            SELECT
                external_id,
                pseudonymized_id,
                full_name,
                birthdate,
                state_code,
                location
            FROM
                `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}`
            WHERE
                ARRAY_LENGTH(
                    ARRAY(
                        SELECT loc
                        FROM UNNEST(location) AS loc
                        WHERE loc IN UNNEST(@allowed_locations)
                    )
                ) > 0
            """

            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ArrayQueryParameter(
                        "allowed_locations", "STRING", locations
                    )
                ]
            )

            query_job = client.query(query, job_config=job_config)
            results = query_job.result()

            #  Process results
            client_records: List[ClientDataRecord] = []

            for row in results:
                record = process_client_row(row)
                if record:
                    client_records.append(record)

            # Cache results
            cache_client_record(cache_key, client_records)

            logger.info(
                f"Found {len(client_records)} clients accessible to staff {pseudonymized_staff_id}"
            )

            return client_records

        except Exception as e:
            logger.error(
                f"Error fetching clients for staff {pseudonymized_staff_id}: {str(e)}"
            )
            return []

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
        location
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
        client.location
        FROM (
        SELECT
            external_id,
            pseudonymized_id,
            email,
            full_name,
            client_ids,
            state_code
        FROM
            `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CASE_MANAGER_TABLE}`
        UNION ALL
        SELECT
            external_id,
            pseudonymized_id,
            email,
            full_name,
            client_ids,
            state_code
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

                        # Ensure locations is always a list
                        location = row.location if row.location else []

                        clients.append(
                            ClientDataRecord(
                                external_client_id=row.external_id,
                                pseudonymized_client_id=row.pseudonymized_id,
                                full_name=full_name,
                                birthdate=row.birthdate,
                                state_code=row.state_code,
                                location=location,
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
        state_code,
        locations
        FROM (
        SELECT
            external_id,
            pseudonymized_id,
            email,
            full_name,
            client_ids,
            state_code,
            locations
        FROM
            `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CASE_MANAGER_TABLE}`
        UNION ALL
        SELECT
            external_id,
            pseudonymized_id,
            email,
            full_name,
            client_ids,
            state_code,
            locations
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
            all_locations = []
            for r in rows:
                if r.client_ids:
                    all_client_external_ids.extend(r.client_ids)

                # Merge repeated locations
                if r.locations:
                    all_locations.extend(r.locations)
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
                    state_code=normalize_state_code(first_row.state_code),
                    locations=all_locations,
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

    @staticmethod
    def get_pseudonymized_id_by_names_and_dob(
        first_name: str, last_name: str, date_of_birth: date
    ) -> Optional[str]:
        try:
            client = Queries.get_client_by_names_and_dob(
                first_name=first_name, last_name=last_name, date_of_birth=date_of_birth
            )
            return client.pseudonymized_client_id if client else None
        except Exception as e:
            logger.exception(
                f"Failed to get pseudonymized_id for {first_name} {last_name}: {str(e)}"
            )
            return None

    @staticmethod
    def get_staff_external_id_from_pseudonymized_id(
        staff_pseudonymized_id: str,
    ) -> Optional[str]:
        query = f"""
        SELECT external_id
        FROM `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CASE_MANAGER_TABLE}`
        WHERE pseudonymized_id = @staff_pseudonymized_id
        LIMIT 1
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter(
                    "staff_pseudonymized_id", "STRING", staff_pseudonymized_id
                )
            ]
        )

        try:
            client = get_bigquery_client()
            query_job = client.query(query, job_config=job_config)
            results = list(query_job.result())

            if results:
                return results[0].external_id
            else:
                logger.warning(
                    f"No case manager found with pseudonymized_id: {staff_pseudonymized_id}"
                )
                return None
        except Exception as e:
            logger.exception(
                f"Failed to get staff external_id for pseudonymized_id {staff_pseudonymized_id}: {str(e)}"
            )
            return None

    @staticmethod
    def add_client(
        given_names: str,
        surname: str,
        birthdate: date,
        state_code: str,
        staff_pseudonymized_id: str,
        middle_names: Optional[str] = None,
        name_suffix: Optional[str] = None,
    ) -> ClientDataRecord:
        staff_id = Queries.get_staff_external_id_from_pseudonymized_id(
            staff_pseudonymized_id
        )
        if not staff_id:
            raise ValueError(
                f"Could not find staff member with pseudonymized_id: {staff_pseudonymized_id}"
            )

        # Translate US_ID to US_IX for BigQuery lookup (Idaho uses US_IX internally)
        bq_state_code = "US_IX" if state_code == "US_ID" else state_code

        logger.info(
            f"Adding client: {given_names} {surname}, DOB: {birthdate}, State: {bq_state_code}, Staff ID: {staff_id}"
        )
        lock_key = "lock:add_client"
        lock = redis_client.lock(lock_key, timeout=30, blocking_timeout=10)

        try:
            if not lock.acquire(blocking=True):
                raise Exception(
                    "Could not acquire lock to add client. Another client addition is in progress. Please try again."
                )

            existing_client = Queries.get_client_by_names_and_dob(
                first_name=given_names,
                last_name=surname,
                date_of_birth=birthdate,
            )

            if existing_client:
                error_msg = (
                    f"Client '{given_names} {surname}' with birth date {birthdate} already exists. "
                    f"Found in {existing_client.state_code} with ID {existing_client.external_client_id}."
                )
                logger.warning(error_msg)
                raise ClientAlreadyExistsError(error_msg)

            timestamp = int(time.time())
            random_digits = random.randint(10, 99)
            external_id = f"CLIENT-{timestamp}{random_digits}"
            pseudonymized_id = str(uuid.uuid4())

            full_name_dict = {
                "given_names": given_names,
                "middle_names": middle_names or "",
                "surname": surname,
                "name_suffix": name_suffix or "",
            }
            full_name_json = json.dumps(full_name_dict)

            query = f"""
            INSERT INTO `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}`
            (external_id, pseudonymized_id, staff_id, full_name, birthdate, state_code, location)
            VALUES
            (@external_id, @pseudonymized_id, @staff_id, @full_name, @birthdate, @state_code, @location)
            """

            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("external_id", "STRING", external_id),
                    bigquery.ScalarQueryParameter(
                        "pseudonymized_id", "STRING", pseudonymized_id
                    ),
                    bigquery.ScalarQueryParameter("staff_id", "STRING", staff_id),
                    bigquery.ScalarQueryParameter(
                        "full_name", "STRING", full_name_json
                    ),
                    bigquery.ScalarQueryParameter("birthdate", "DATE", birthdate),
                    bigquery.ScalarQueryParameter(
                        "state_code", "STRING", bq_state_code
                    ),
                    bigquery.ArrayQueryParameter("location", "STRING", []),
                ]
            )

            client = get_bigquery_client()
            query_job = client.query(query, job_config=job_config)
            result = query_job.result()
            logger.info(f"BigQuery INSERT query_job: {query_job}")
            logger.info(f"BigQuery INSERT result: {result}")

            logger.info(
                f"Successfully added client {external_id} ({given_names} {surname}) to BigQuery"
            )

            Queries.add_client_to_case_manager(staff_pseudonymized_id, external_id)

            # Invalidate cache for staff's client list
            staff_clients_cache_key = f"staff_clients:{staff_pseudonymized_id}"
            caseworker_cache_key = f"caseworker:{staff_pseudonymized_id}"
            redis_client.delete(staff_clients_cache_key)
            redis_client.delete(caseworker_cache_key)
            logger.info(
                f"Invalidated cache keys: {staff_clients_cache_key}, {caseworker_cache_key}"
            )

            return ClientDataRecord(
                external_client_id=external_id,
                pseudonymized_client_id=pseudonymized_id,
                full_name=FullNameModel(**full_name_dict),
                birthdate=birthdate,
                state_code=bq_state_code,
            )

        except ClientAlreadyExistsError:
            raise
        except Exception as e:
            logger.exception(f"Failed to add client to BigQuery: {str(e)}")
            raise Exception(f"Failed to add client: {str(e)}") from e
        finally:
            try:
                lock.release()
            except Exception as e:
                logger.exception(f"Failed to release add_client lock: {str(e)}")

    @staticmethod
    def remove_client(
        pseudonymized_client_id: str, staff_pseudonymized_id: str
    ) -> None:
        logger.info(f"Removing client with pseudonymized_id: {pseudonymized_client_id}")

        lock_key = "lock:remove_client"
        lock = redis_client.lock(lock_key, timeout=30, blocking_timeout=10)

        try:
            if not lock.acquire(blocking=True):
                raise Exception(
                    "Could not acquire lock to remove client. Another client removal is in progress. Please try again."
                )

            query_client = f"""
            SELECT external_id, staff_id, full_name, birthdate
            FROM `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}`
            WHERE pseudonymized_id = @pseudonymized_id
            LIMIT 1
            """

            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter(
                        "pseudonymized_id", "STRING", pseudonymized_client_id
                    ),
                ]
            )

            client = get_bigquery_client()
            query_job = client.query(query_client, job_config=job_config)
            results = query_job.result()

            rows = list(results)
            if not rows:
                raise ClientNotFoundError(
                    f"Client with pseudonymized_id {pseudonymized_client_id} not found in database"
                )

            external_client_id = rows[0].external_id
            full_name_json = rows[0].full_name
            birthdate = rows[0].birthdate

            # Delete the client from client table
            delete_query = f"""
            DELETE FROM `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}`
            WHERE pseudonymized_id = @pseudonymized_id
            """

            delete_job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter(
                        "pseudonymized_id", "STRING", pseudonymized_client_id
                    ),
                ]
            )

            delete_job = client.query(delete_query, job_config=delete_job_config)
            delete_job.result()

            logger.info(
                f"Successfully deleted client {external_client_id} (pseudonymized: {pseudonymized_client_id}) from BigQuery"
            )

            Queries.remove_client_from_case_manager(
                staff_pseudonymized_id, external_client_id
            )

            # Invalidate cache
            full_name_data = json.loads(full_name_json)
            given_names = full_name_data.get("given_names", "")
            surname = full_name_data.get("surname", "")

            cache_key_pseudo = f"client_by_pseudo:{pseudonymized_client_id}"
            cache_key_name_dob = (
                f"client_by_name_dob:{given_names}:{surname}:{birthdate}"
            )

            redis_client.delete(cache_key_pseudo)
            redis_client.delete(cache_key_name_dob)

            # Invalidate staff's client list cache
            staff_clients_cache_key = f"staff_clients:{staff_pseudonymized_id}"
            caseworker_cache_key = f"caseworker:{staff_pseudonymized_id}"
            redis_client.delete(staff_clients_cache_key)
            redis_client.delete(caseworker_cache_key)

            logger.info(
                f"Invalidated cache keys: {cache_key_pseudo}, {cache_key_name_dob}, {staff_clients_cache_key}, {caseworker_cache_key}"
            )

            logger.info(f"Successfully removed client {external_client_id} completely")

        except ClientNotFoundError:
            raise
        except Exception as e:
            logger.exception(f"Failed to remove client from BigQuery: {str(e)}")
            raise Exception(f"Failed to remove client: {str(e)}") from e
        finally:
            try:
                lock.release()
            except Exception as e:
                logger.exception(f"Failed to release remove_client lock: {str(e)}")

    @staticmethod
    def add_client_to_case_manager(staff_pseudonymized_id: str, client_id: str) -> None:
        logger.info(
            f"Adding client {client_id} to case manager {staff_pseudonymized_id}"
        )

        query = f"""
        UPDATE `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CASE_MANAGER_TABLE}`
        SET client_ids = ARRAY_CONCAT(
          IFNULL(client_ids, []),
          [@client_id]
        )
        WHERE pseudonymized_id = @staff_pseudonymized_id
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter(
                    "staff_pseudonymized_id", "STRING", staff_pseudonymized_id
                ),
                bigquery.ScalarQueryParameter("client_id", "STRING", client_id),
            ]
        )

        try:
            client = get_bigquery_client()
            query_job = client.query(query, job_config=job_config)
            query_job.result()
            logger.info(
                f"Successfully added client {client_id} to case manager {staff_pseudonymized_id}"
            )
        except Exception as e:
            logger.exception(
                f"Failed to add client {client_id} to case manager {staff_pseudonymized_id}: {str(e)}"
            )
            raise

    @staticmethod
    def remove_client_from_case_manager(
        staff_pseudonymized_id: str, client_id: str
    ) -> None:
        logger.info(
            f"Removing client {client_id} from case manager {staff_pseudonymized_id}"
        )

        query = f"""
        UPDATE `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CASE_MANAGER_TABLE}`
        SET client_ids = ARRAY(
          SELECT element
          FROM UNNEST(client_ids) AS element
          WHERE element != @client_id
        )
        WHERE pseudonymized_id = @staff_pseudonymized_id
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter(
                    "staff_pseudonymized_id", "STRING", staff_pseudonymized_id
                ),
                bigquery.ScalarQueryParameter("client_id", "STRING", client_id),
            ]
        )

        try:
            client = get_bigquery_client()
            query_job = client.query(query, job_config=job_config)
            query_job.result()
            logger.info(
                f"Successfully removed client {client_id} from case manager {staff_pseudonymized_id}"
            )
        except Exception as e:
            logger.exception(
                f"Failed to remove client {client_id} from case manager {staff_pseudonymized_id}: {str(e)}"
            )
            raise
