# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2025 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================

import uuid
from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from google.cloud import bigquery

from app.core.config import settings
from app.services.client_data.exceptions import ClientAlreadyExistsError
from app.services.client_data.queries import Queries
from app.services.client_data.utils import get_bigquery_client, set_bigquery_client


@pytest.fixture
def use_test_table(monkeypatch):
    monkeypatch.setattr(settings, "BQ_CLIENT_TABLE", "client_test")
    monkeypatch.setattr(settings, "BQ_CASE_MANAGER_TABLE", "case_manager_test")

    original_client = get_bigquery_client()
    real_client = bigquery.Client(project=settings.BQ_PROJECT_ID)
    set_bigquery_client(real_client)

    yield

    set_bigquery_client(original_client)


@pytest.mark.integration
@patch("app.services.client_data.queries.redis_client")
@patch("app.services.client_data.utils.redis_client")
def test_add_client_success(mock_utils_redis, mock_queries_redis, use_test_table):
    mock_lock = MagicMock()
    mock_lock.acquire.return_value = True

    mock_queries_redis.lock.return_value = mock_lock

    mock_utils_redis.get.return_value = None
    mock_utils_redis.delete.return_value = None
    given_names = f"Test_Given_Name_{str(uuid.uuid4().int)[:8]}"
    middle_name = "Test_Middle_Name"
    surname = "Test_Surname"
    name_suffix = "Jr."
    birthdate = date(1990, 1, 1)
    state_code = "US_CA"
    staff_pseudonymized_id = "abcd1234"

    created_pseudonymized_id = None

    try:
        result = Queries.add_client(
            given_names=given_names,
            surname=surname,
            birthdate=birthdate,
            state_code=state_code,
            staff_pseudonymized_id=staff_pseudonymized_id,
            middle_names=middle_name,
            name_suffix=name_suffix,
        )

        assert result is not None
        assert result.external_client_id.startswith("CLIENT-")
        assert result.pseudonymized_client_id is not None
        assert len(result.pseudonymized_client_id) == 36
        assert result.full_name.given_names == given_names.title()
        assert result.full_name.surname == surname.title()
        assert result.full_name.middle_names == middle_name.title()
        assert result.full_name.name_suffix == name_suffix
        assert result.birthdate == birthdate
        assert result.state_code == state_code

        created_pseudonymized_id = result.pseudonymized_client_id

        fetched_client = Queries.get_client_by_names_and_dob(
            first_name=given_names,
            last_name=surname,
            date_of_birth=birthdate,
        )

        assert fetched_client is not None
        assert fetched_client.external_client_id == result.external_client_id
        assert fetched_client.full_name.given_names == given_names.title()
        assert fetched_client.full_name.surname == surname.title()

        print(f"Successfully added and verified client: {result.external_client_id}")

    finally:
        if created_pseudonymized_id:
            Queries.remove_client(created_pseudonymized_id, staff_pseudonymized_id)
            print(f"Cleaned up test client: {created_pseudonymized_id}")

            deleted_client = Queries.get_client_by_names_and_dob(
                first_name=given_names,
                last_name=surname,
                date_of_birth=birthdate,
            )
            assert deleted_client is None, "Client should be deleted but still exists"
            print(f"Verified client deletion: {created_pseudonymized_id}")


@pytest.mark.integration
@patch("app.services.client_data.queries.redis_client")
@patch("app.services.client_data.utils.redis_client")
def test_add_client_duplicate_detection(
    mock_utils_redis, mock_queries_redis, use_test_table
):
    mock_lock = MagicMock()
    mock_lock.acquire.return_value = True

    mock_queries_redis.lock.return_value = mock_lock

    mock_utils_redis.get.return_value = None
    mock_utils_redis.delete.return_value = None
    given_names = f"Test_Given_Name_{str(uuid.uuid4().int)[:8]}"
    surname = "Test_Surname"
    birthdate = date(1985, 5, 15)
    state_code = "US_NY"
    staff_pseudonymized_id = "abcd1234"

    created_pseudonymized_id = None

    try:
        first_client = Queries.add_client(
            given_names=given_names,
            surname=surname,
            birthdate=birthdate,
            state_code=state_code,
            staff_pseudonymized_id=staff_pseudonymized_id,
        )

        created_pseudonymized_id = first_client.pseudonymized_client_id

        with pytest.raises(ClientAlreadyExistsError) as exc_info:
            Queries.add_client(
                given_names=given_names,
                surname=surname,
                birthdate=birthdate,
                state_code="US_CA",
                staff_pseudonymized_id=staff_pseudonymized_id,
            )

        error_message = str(exc_info.value)
        assert given_names in error_message
        assert surname in error_message
        assert str(birthdate) in error_message
        assert first_client.external_client_id in error_message

        print(f"Duplicate detection working correctly: {error_message}")

    finally:
        if created_pseudonymized_id:
            Queries.remove_client(created_pseudonymized_id, staff_pseudonymized_id)
            print(f"Cleaned up test client: {created_pseudonymized_id}")

            deleted_client = Queries.get_client_by_names_and_dob(
                first_name=given_names,
                last_name=surname,
                date_of_birth=birthdate,
            )
            assert deleted_client is None, "Client should be deleted but still exists"
            print(f"Verified client deletion: {created_pseudonymized_id}")


@pytest.mark.integration
def test_get_staff_external_id_from_pseudonymized_id(use_test_table):
    pseudonymized_id = "abcd1234"
    expected_external_id = "CM-001"
    result = Queries.get_staff_external_id_from_pseudonymized_id(pseudonymized_id)

    assert (
        result == expected_external_id
    ), f"Expected {expected_external_id}, got {result}"
