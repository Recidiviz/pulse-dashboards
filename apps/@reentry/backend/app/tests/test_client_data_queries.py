from unittest.mock import MagicMock, patch

from google.cloud.bigquery.table import Row

from app.services.client_data.queries import Queries
from app.services.client_data.types import CaseWorkerDataRecord, FullNameModel


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
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "email": 2,
                "full_name": 3,
                "client_ids": 4,
                "state_code": 5,
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
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "email": 2,
                "full_name": 3,
                "client_ids": 4,
                "state_code": 5,
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
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "email": 2,
                "full_name": 3,
                "client_ids": 4,
                "state_code": 5,
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

    # Check that data is cached
    mock_redis_client.setex.assert_called_once()
