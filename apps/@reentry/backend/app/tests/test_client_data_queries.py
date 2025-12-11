from unittest.mock import MagicMock, patch

from google.cloud.bigquery.table import Row

from app.services.client_data.queries import Queries
from app.services.client_data.types import (
    CaseWorkerDataRecord,
    ClientDataRecord,
    FullNameModel,
)


# A test that checks that get_caseworker_by_pseudonymized_id
# concatenates the client_ids from all rows
@patch("app.services.client_data.queries.redis_client")
@patch("app.services.client_data.queries.get_bigquery_client")
def test_get_caseworker_by_pseudonymized_id_concatenates_client_ids(
    mock_get_bigquery_client, mock_redis_client
):
    # Arrange
    pseudonymized_staff_id = "test_staff_id"
    mock_redis_client.get.return_value = None  # Cache miss

    mock_query_job = MagicMock()
    mock_get_bigquery_client.return_value.query.return_value = mock_query_job

    # Mock BigQuery results with multiple rows
    mock_rows = [
        Row(
            (
                "ext_id_1",
                pseudonymized_staff_id,
                "staff1@test.com",
                """{"given_names": "Staff", "surname": "One", "middle_names": "", "name_suffix": ""}""",
                ["client1", "client2"],
                "CA",
                ["loc1"],
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "email": 2,
                "full_name": 3,
                "client_ids": 4,
                "state_code": 5,
                "locations": 6,
            },
        ),
        Row(
            (
                "ext_id_1",  # same staff
                pseudonymized_staff_id,
                "staff1@test.com",
                """{"given_names": "Staff", "surname": "One", "middle_names": "", "name_suffix": ""}""",
                ["client3", "client4"],
                "CA",
                ["loc2"],
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "email": 2,
                "full_name": 3,
                "client_ids": 4,
                "state_code": 5,
                "locations": 6,
            },
        ),
        Row(
            (
                "ext_id_1",  # same staff
                pseudonymized_staff_id,
                "staff1@test.com",
                """{"given_names": "Staff", "surname": "One", "middle_names": "", "name_suffix": ""}""",
                None,  # No client_ids
                "CA",
                [],
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "email": 2,
                "full_name": 3,
                "client_ids": 4,
                "state_code": 5,
                "locations": 6,
            },
        ),
    ]
    mock_query_job.result.return_value = mock_rows

    # Act
    result = Queries.get_caseworker_by_pseudonymized_id(pseudonymized_staff_id)

    # Assert
    assert result is not None
    assert isinstance(result, CaseWorkerDataRecord)
    assert result.pseudonymized_staff_id == pseudonymized_staff_id
    assert result.external_staff_id == "ext_id_1"
    assert result.full_name == FullNameModel(given_names="Staff", surname="One")

    # Check that client_ids are concatenated
    assert result.external_client_ids == ["client1", "client2", "client3", "client4"]

    # check that locations are concatenated
    assert result.locations == ["loc1", "loc2"]

    # Check that data is cached
    mock_redis_client.setex.assert_called_once()


def test_get_clients_by_facility_access_returns_empty_if_invalid_params():
    assert Queries.get_clients_by_facility_access("", ["loc1"]) == []
    assert Queries.get_clients_by_facility_access("staff123", []) == []
    assert Queries.get_clients_by_facility_access("", []) == []


@patch("app.services.client_data.queries.cache_client_record")
@patch("app.services.client_data.queries.get_client_from_cache")
@patch("app.services.client_data.queries.get_bigquery_client")
def test_get_clients_by_facility_access_cache_hit(
    mock_get_bigquery_client,
    mock_get_cache,
    mock_cache_set,
):
    fake_record = [MagicMock(spec=ClientDataRecord)]
    mock_get_cache.return_value = fake_record

    result = Queries.get_clients_by_facility_access("staff1", ["A", "B"])

    assert result == fake_record
    mock_get_bigquery_client.assert_not_called()
    mock_cache_set.assert_not_called()


# cache MISS → BigQuery queried, rows processed & cached
@patch("app.services.client_data.queries.cache_client_record")
@patch("app.services.client_data.queries.get_client_from_cache")
@patch("app.services.client_data.queries.get_bigquery_client")
@patch("app.services.client_data.queries.process_client_row")
def test_get_clients_by_facility_access_processes_bigquery_rows(
    mock_process_row,
    mock_get_bigquery_client,
    mock_get_cache,
    mock_cache_set,
):
    # Cache miss
    mock_get_cache.return_value = None

    # Mock BigQuery result
    mock_query_job = MagicMock()
    mock_get_bigquery_client.return_value.query.return_value = mock_query_job

    mock_rows = [
        Row(
            (
                "ext1",
                "p1",
                """{"given_names": "john", "surname": "doe", "middle_names": "", "name_suffix": ""}""",
                "1980-01-01",
                "US_AZ",
                ["l1"],
            ),
            {
                "external_client_id": 0,
                "pseudonymized_client_id": 1,
                "full_name": 2,
                "birthdate": 3,
                "state_code": 4,
                "location": 5,
            },
        )
    ]
    mock_query_job.result.return_value = mock_rows

    # Fake processed row
    full_name = FullNameModel(
        **{
            "given_names": "john",
            "surname": "doe",
            "middle_names": "",
            "name_suffix": "",
        }
    )
    mock_process_row.return_value = ClientDataRecord(
        external_client_id="ext1",
        pseudonymized_client_id="p1",
        full_name=full_name,
        birthdate="1980-01-01",
        state_code="US_AZ",
        location=["l1"],
    )

    result = Queries.get_clients_by_facility_access("staff1", ["l1"])

    assert len(result) == 1
    assert isinstance(result[0], ClientDataRecord)
    assert result[0].location == ["l1"]
    mock_cache_set.assert_called_once()


# Staff has facilities but BigQuery returns 0 matching clients → return empty list
@patch("app.services.client_data.queries.cache_client_record")
@patch("app.services.client_data.queries.get_client_from_cache")
@patch("app.services.client_data.queries.get_bigquery_client")
def test_get_clients_by_facility_access_no_matching_clients(
    mock_get_bigquery_client,
    mock_get_cache,
    mock_cache_set,
):
    # Cache miss
    mock_get_cache.return_value = None

    # BigQuery returns empty result set
    mock_query_job = MagicMock()
    mock_query_job.result.return_value = []
    mock_get_bigquery_client.return_value.query.return_value = mock_query_job

    result = Queries.get_clients_by_facility_access("staff123", ["A", "B"])

    assert result == []
    mock_cache_set.assert_called_once_with("clients_by_facility:staff123:A,B", [])
