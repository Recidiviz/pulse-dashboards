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

"""Tests for client_data utils module."""

from datetime import date
from unittest.mock import patch

import pytest
from google.cloud.bigquery.table import Row

from app.services.client_data.types import ClientDataRecord, FullNameModel
from app.services.client_data.utils import (
    cache_client_record,
    format_name_capitalization,
    get_client_from_cache,
    process_client_row,
)


class TestFormatNameCapitalization:
    """Tests for the format_name_capitalization function."""

    @pytest.mark.parametrize(
        "input_data,expected_output,test_description",
        [
            # Basic dict inputs
            (
                {
                    "given_names": "john",
                    "middle_names": "robert",
                    "surname": "smith",
                    "name_suffix": "Jr.",
                },
                {
                    "given_names": "John",
                    "middle_names": "Robert",
                    "surname": "Smith",
                    "name_suffix": "Jr.",
                },
                "lowercase dict input",
            ),
            (
                {
                    "given_names": "mary",
                    "middle_names": "",
                    "surname": "o'brien-d'angelo",
                    "name_suffix": "",
                },
                {
                    "given_names": "Mary",
                    "middle_names": "",
                    "surname": "O'Brien-D'Angelo",
                    "name_suffix": "",
                },
                "dict with multiple apostrophes",
            ),
            # Empty and None fields
            (
                {
                    "given_names": "john",
                    "middle_names": "",
                    "surname": "doe",
                    "name_suffix": "",
                },
                {
                    "given_names": "John",
                    "middle_names": "",
                    "surname": "Doe",
                    "name_suffix": "",
                },
                "dict with empty fields",
            ),
            (
                {
                    "given_names": "john",
                    "middle_names": None,
                    "surname": "doe",
                    "name_suffix": None,
                },
                {
                    "given_names": "John",
                    "middle_names": "",
                    "surname": "Doe",
                    "name_suffix": "",
                },
                "dict with None fields",
            ),
            # Special characters
            (
                {
                    "given_names": "josé",
                    "middle_names": "maría",
                    "surname": "garcía-lópez",
                    "name_suffix": "",
                },
                {
                    "given_names": "José",
                    "middle_names": "María",
                    "surname": "García-López",
                    "name_suffix": "",
                },
                "dict with accented characters",
            ),
            # String dict inputs (valid JSON)
            (
                '{"given_names": "john", "middle_names": "", "surname": "smith", "name_suffix": ""}',
                {
                    "given_names": "John",
                    "middle_names": "",
                    "surname": "Smith",
                    "name_suffix": "",
                },
                "string dict - simple case",
            ),
            (
                '{"given_names": "sean", "middle_names": "", "surname": "o\'brien", "name_suffix": ""}',
                {
                    "given_names": "Sean",
                    "middle_names": "",
                    "surname": "O'Brien",
                    "name_suffix": "",
                },
                "string dict with escaped apostrophe in JSON",
            ),
            # String dict inputs (Python dict format with UNESCAPED apostrophes)
            # These represent real-world data coming from BigQuery - should handle correctly
            (
                "{'given_names': 'sean', 'middle_names': '', 'surname': 'o'brien', 'name_suffix': ''}",
                {
                    "given_names": "Sean",
                    "middle_names": "",
                    "surname": "O'Brien",
                    "name_suffix": "",
                },
                "python dict with unescaped apostrophe - O'Brien",
            ),
            (
                """{"given_names": "patrick", "middle_names": "", "surname": "o'neal", "name_suffix": ""}""",
                {
                    "given_names": "Patrick",
                    "middle_names": "",
                    "surname": "O'Neal",
                    "name_suffix": "",
                },
                "string dict with unescaped apostrophe - O'Neal",
            ),
            (
                "{'given_names': 'd'andre', 'middle_names': '', 'surname': 'smith', 'name_suffix': ''}",
                {
                    "given_names": "D'Andre",
                    "middle_names": "",
                    "surname": "Smith",
                    "name_suffix": "",
                },
                "string dict with unescaped apostrophe in first name - D'Andre",
            ),
            (
                "{'given_names': 'shea', 'middle_names': '', 'surname': 'odonnell, lean', 'name_suffix': ''}",
                {
                    "given_names": "Shea",
                    "middle_names": "",
                    "surname": "Odonnell, Lean",
                    "name_suffix": "",
                },
                "string dict with unescaped apostrophe - O'Donnell",
            ),
            # More problematic string dict cases
            (
                '{"given_names": "SEAN", "middle_names": "", "surname": "O\'BRIEN", "name_suffix": ""}',
                {
                    "given_names": "Sean",
                    "middle_names": "",
                    "surname": "O'Brien",
                    "name_suffix": "",
                },
                "string dict uppercase with escaped apostrophe - works with JSON",
            ),
            (
                "{'given_names': 'mary', 'middle_names': '', 'surname': 'o'brien-d'angelo', 'name_suffix': ''}",
                {
                    "given_names": "Mary",
                    "middle_names": "",
                    "surname": "O'Brien-D'Angelo",
                    "name_suffix": "",
                },
                "string dict with multiple unescaped apostrophes",
            ),
        ],
    )
    def test_format_name_various_inputs(
        self, input_data, expected_output, test_description
    ):
        """Test name formatting with various input formats."""
        result = format_name_capitalization(input_data)

        # Check that result equals expected dict exactly (no extra fields)
        assert (
            result == expected_output
        ), f"Failed for {test_description}: expected {expected_output}, got {result}"

    @pytest.mark.parametrize(
        "invalid_input,test_description",
        [
            # Malformed string dictionaries
            (
                "{'given_names': 'john', 'surname': 'incomplete",
                "incomplete string dict",
            ),
            # SQL injection attempts (treated as invalid syntax)
            (
                "'; DROP TABLE users; --",
                "SQL injection attempt - not a dict",
            ),
            (
                "{'given_names': 'admin', 'surname': 'user'}; DROP TABLE--",
                "SQL injection after dict string",
            ),
        ],
    )
    def test_format_name_with_invalid_input(self, invalid_input, test_description):
        """Test with invalid input - should raise exception.

        This includes malformed strings and SQL injection attempts.
        Note: SQLModel/SQLAlchemy handles SQL injection prevention via
        parameterized queries, so we don't need special validation here.
        """
        # Should raise an exception for unparseable input
        with pytest.raises(ValueError):
            format_name_capitalization(invalid_input)

    @pytest.mark.parametrize(
        "input_data,expected_output,test_description",
        [
            # Dict with optional keys missing (middle_names, name_suffix) - should work
            (
                {
                    "given_names": "john",
                    "surname": "smith",
                    # "middle_names" key is completely missing (OK, it's optional)
                    # "name_suffix" key is completely missing (OK, it's optional)
                },
                {
                    "given_names": "John",
                    "middle_names": "",
                    "surname": "Smith",
                    "name_suffix": "",
                },
                "dict missing optional middle_names and name_suffix keys - OK",
            ),
            (
                {
                    "given_names": "John",
                    "middle_names": None,
                    "surname": "Smith",
                    "name_suffix": None,
                },
                {
                    "given_names": "John",
                    "middle_names": "",
                    "surname": "Smith",
                    "name_suffix": "",
                },
                "dict missing optional middle_names and name_suffix keys - OK",
            ),
            (
                {
                    "given_names": "sean",
                    "surname": "o'brien",
                    # "middle_names" and "name_suffix" keys missing (OK, they're optional)
                },
                {
                    "given_names": "Sean",
                    "middle_names": "",
                    "surname": "O'Brien",
                    "name_suffix": "",
                },
                "dict with apostrophe name, missing optional keys - OK",
            ),
            # String dict with optional keys missing - should work
            (
                '{"given_names": "john", "surname": "smith"}',
                {
                    "given_names": "John",
                    "middle_names": "",
                    "surname": "Smith",
                    "name_suffix": "",
                },
                "string dict JSON missing optional keys - OK",
            ),
            (
                "{'given_names': 'john', 'surname': 'smith', 'name_suffix': 'iii'}",
                {
                    "given_names": "John",
                    "middle_names": "",
                    "surname": "Smith",
                    "name_suffix": "III",
                },
                "string dict with apostrophe and missing optional keys - OK",
            ),
        ],
    )
    def test_format_name_with_missing_optional_keys(
        self, input_data, expected_output, test_description
    ):
        """Test name formatting with missing optional keys (middle_names, name_suffix).

        These should work fine - only given_names and surname are required.
        """
        result = format_name_capitalization(input_data)

        # Check that result equals expected dict exactly (no extra fields)
        assert (
            result == expected_output
        ), f"Failed for {test_description}: expected {expected_output}, got {result}"

    @pytest.mark.parametrize(
        "input_data,test_description",
        [
            # Dict missing required keys - should raise error
            (
                {
                    "given_names": "john",
                    # "surname" is REQUIRED and missing
                },
                "dict missing required surname key",
            ),
            (
                {
                    "surname": "smith",
                    # "given_names" is REQUIRED and missing
                },
                "dict missing required given_names key",
            ),
            (
                {},
                "completely empty dict - missing both required keys",
            ),
            # String dict missing required keys - should raise error
            (
                "{'surname': 'smith'}",
                "string dict Python format missing required given_names key",
            ),
            (
                "{'given_names': 'sean'}",
                "string dict missing required surname key",
            ),
        ],
    )
    def test_format_name_with_missing_required_keys_raises_error(
        self, input_data, test_description
    ):
        """Test that missing required keys (given_names or surname) raise an error.

        The function should fail fast when required data is missing.
        """
        with pytest.raises(Exception) as exc_info:
            format_name_capitalization(input_data)

        # Verify that an error was raised (could be KeyError, ValueError, or any Exception)
        assert exc_info.value is not None, f"Expected error for {test_description}"

    @pytest.mark.parametrize(
        "input_data,expected_output,test_description",
        [
            # Dict with extra keys that should be dropped
            (
                {
                    "given_names": "john",
                    "middle_names": "robert",
                    "surname": "smith",
                    "name_suffix": "Jr.",
                    "extra_field": "should be ignored",
                    "another_field": 123,
                },
                {
                    "given_names": "John",
                    "middle_names": "Robert",
                    "surname": "Smith",
                    "name_suffix": "Jr.",
                },
                "dict with extra fields",
            ),
        ],
    )
    def test_format_name_with_extra_keys(
        self, input_data, expected_output, test_description
    ):
        """Test name formatting with extra keys that should be dropped.

        The function should only return the expected four fields and drop any extras.
        """
        result = format_name_capitalization(input_data)

        # Check that result equals expected dict exactly (no extra fields)
        assert (
            result == expected_output
        ), f"Failed for {test_description}: expected {expected_output}, got {result}"


class TestGetClientFromCache:
    """Tests for the get_client_from_cache function."""

    @patch("app.services.client_data.utils.redis_client")
    def test_cache_hit_returns_client_record(self, mock_redis):
        """Test successful cache retrieval."""
        # Create a mock client record
        full_name = FullNameModel(
            given_names="John",
            middle_names="",
            surname="Doe",
            name_suffix="",
        )
        mock_client = ClientDataRecord(
            external_client_id="ext123",
            pseudonymized_client_id="pseudo123",
            full_name=full_name,
            birthdate=date(1990, 1, 1),
            state_code="US_CA",
            location=["loc1"],
        )

        # Mock Redis to return JSON data
        mock_redis.get.return_value = mock_client.model_dump_json().encode("utf-8")

        result = get_client_from_cache("test_cache_key")

        assert result is not None
        assert result.external_client_id == "ext123"
        assert result.pseudonymized_client_id == "pseudo123"
        mock_redis.get.assert_called_once_with("test_cache_key")

    @patch("app.services.client_data.utils.redis_client")
    def test_cache_miss_returns_none(self, mock_redis):
        """Test cache miss returns None."""
        mock_redis.get.return_value = None

        result = get_client_from_cache("nonexistent_key")

        assert result is None
        mock_redis.get.assert_called_once_with("nonexistent_key")

    @patch("app.services.client_data.utils.redis_client")
    def test_cache_deserialization_error_returns_none(self, mock_redis):
        """Test that deserialization errors are handled gracefully."""
        # Return corrupted data that can't be parsed as JSON
        mock_redis.get.return_value = b"corrupted_data"

        result = get_client_from_cache("bad_data_key")

        assert result is None


class TestProcessClientRow:
    """Tests for the process_client_row function."""

    def test_process_valid_row(self):
        """Test processing a valid BigQuery row."""
        mock_row = Row(
            (
                "ext123",
                "pseudo123",
                '{"given_names": "john", "middle_names": "", "surname": "doe", "name_suffix": ""}',
                date(1990, 1, 1),
                "US_CA",
                ["loc1", "loc2"],
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "full_name": 2,
                "birthdate": 3,
                "state_code": 4,
                "location": 5,
            },
        )

        result = process_client_row(mock_row)

        assert result is not None
        assert isinstance(result, ClientDataRecord)
        assert result.external_client_id == "ext123"
        assert result.pseudonymized_client_id == "pseudo123"
        assert result.full_name.given_names == "John"
        assert result.full_name.surname == "Doe"
        assert result.state_code == "US_CA"
        assert result.location == ["loc1", "loc2"]

    def test_process_row_with_apostrophe_name(self):
        """Test processing a row with a name containing an apostrophe."""
        mock_row = Row(
            (
                "ext456",
                "pseudo456",
                '{"given_names": "sean", "middle_names": "", "surname": "o\'brien", "name_suffix": ""}',
                date(1985, 5, 15),
                "US_NY",
                ["loc3"],
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "full_name": 2,
                "birthdate": 3,
                "state_code": 4,
                "location": 5,
            },
        )

        result = process_client_row(mock_row)

        assert result is not None
        assert result.full_name.given_names == "Sean"
        assert result.full_name.surname == "O'Brien"

    def test_process_row_missing_location_attribute(self):
        """Test processing a row without location attribute."""
        mock_row = Row(
            (
                "ext789",
                "pseudo789",
                '{"given_names": "jane", "middle_names": "", "surname": "smith", "name_suffix": ""}',
                date(1992, 3, 20),
                "US_TX",
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "full_name": 2,
                "birthdate": 3,
                "state_code": 4,
            },
        )

        result = process_client_row(mock_row)

        assert result is not None
        assert result.location == []

    def test_process_row_with_invalid_full_name(self):
        """Test processing a row with invalid full_name data."""
        mock_row = Row(
            (
                "ext999",
                "pseudo999",
                "invalid_name_format",  # Invalid format
                date(1990, 1, 1),
                "US_FL",
                ["loc5"],
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "full_name": 2,
                "birthdate": 3,
                "state_code": 4,
                "location": 5,
            },
        )

        result = process_client_row(mock_row)

        # Should return None due to processing error
        assert result is None

    def test_process_row_with_state_code_normalization(self):
        """Test that state codes are passed through normalize_state_code."""
        mock_row = Row(
            (
                "ext111",
                "pseudo111",
                '{"given_names": "test", "middle_names": "", "surname": "user", "name_suffix": ""}',
                date(1995, 6, 10),
                "US_ID",  # Should be normalized to US_IX
                ["loc6"],
            ),
            {
                "external_id": 0,
                "pseudonymized_id": 1,
                "full_name": 2,
                "birthdate": 3,
                "state_code": 4,
                "location": 5,
            },
        )

        result = process_client_row(mock_row)

        assert result is not None
        # normalize_state_code converts US_ID to US_IX
        assert result.state_code == "US_IX"


class TestCacheClientRecord:
    """Tests for the cache_client_record function."""

    @patch("app.services.client_data.utils.redis_client")
    def test_successful_cache_storage(self, mock_redis):
        """Test successful caching of a client record."""
        full_name = FullNameModel(
            given_names="John",
            middle_names="",
            surname="Doe",
            name_suffix="",
        )
        client_record = ClientDataRecord(
            external_client_id="ext123",
            pseudonymized_client_id="pseudo123",
            full_name=full_name,
            birthdate=date(1990, 1, 1),
            state_code="US_CA",
            location=["loc1"],
        )

        mock_redis.setex.return_value = True

        result = cache_client_record("cache_key", client_record)

        assert result is True
        mock_redis.setex.assert_called_once()
        call_args = mock_redis.setex.call_args[0]
        assert call_args[0] == "cache_key"
        assert call_args[1] == 21600  # CACHE_TTL

    @patch("app.services.client_data.utils.redis_client")
    def test_cache_storage_failure(self, mock_redis):
        """Test handling of cache storage failures."""
        full_name = FullNameModel(
            given_names="John",
            middle_names="",
            surname="Doe",
            name_suffix="",
        )
        client_record = ClientDataRecord(
            external_client_id="ext123",
            pseudonymized_client_id="pseudo123",
            full_name=full_name,
            birthdate=date(1990, 1, 1),
            state_code="US_CA",
            location=["loc1"],
        )

        # Simulate Redis error
        mock_redis.setex.side_effect = Exception("Redis connection error")

        result = cache_client_record("cache_key", client_record)

        assert result is False


class TestEdgeCases:
    """Additional edge case tests for production issues."""

    def test_name_with_multiple_spaces(self):
        """Test names with multiple spaces."""
        name_dict = {
            "given_names": "mary  jane",  # double space
            "middle_names": "",
            "surname": "smith",
            "name_suffix": "",
        }
        result = format_name_capitalization(name_dict)

        # .title() handles multiple spaces
        assert result["given_names"] == "Mary  Jane"

    def test_name_with_numbers(self):
        """Test names with numbers (rare but possible)."""
        name_dict = {
            "given_names": "john3",
            "middle_names": "",
            "surname": "smith2",
            "name_suffix": "",
        }
        result = format_name_capitalization(name_dict)

        assert result["given_names"] == "John3"
        assert result["surname"] == "Smith2"

    def test_very_long_name(self):
        """Test with very long name."""
        long_name = "a" * 1000
        name_dict = {
            "given_names": long_name,
            "middle_names": "",
            "surname": "smith",
            "name_suffix": "",
        }
        result = format_name_capitalization(name_dict)

        # Should still process without error
        assert result["given_names"].startswith("A")
        assert len(result["given_names"]) == 1000

    def test_name_with_only_special_characters(self):
        """Test names that are only special characters."""
        name_dict = {
            "given_names": "---",
            "middle_names": "",
            "surname": "+++",
            "name_suffix": "",
        }
        result = format_name_capitalization(name_dict)

        # Should return as-is since .title() doesn't affect non-letters
        assert result["given_names"] == "---"
        assert result["surname"] == "+++"
