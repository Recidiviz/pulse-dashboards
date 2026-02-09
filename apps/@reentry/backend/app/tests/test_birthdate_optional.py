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
"""
Tests for optional birthdate functionality
"""

from datetime import date

from app.auth.intake.utils import validate_credentials_and_dob
from app.services.client_data.types import ClientDataRecord, FullNameModel


def test_validate_credentials_fails_when_birthdate_missing():
    """Test that authentication fails when client has no birthdate on record"""
    # Create a client record without birthdate
    client_record = ClientDataRecord(
        external_client_id="ext-123",
        pseudonymized_client_id="pseudo-123",
        full_name=FullNameModel(given_names="John", surname="Doe"),
        birthdate=None,  # No birthdate on record
        state_code="US_UT",
    )

    # Try to authenticate with a birthdate
    provided_dob = date(1990, 1, 1)
    is_valid, record = validate_credentials_and_dob(
        record=client_record, date_of_birth=provided_dob
    )

    # Authentication should fail
    assert is_valid is False
    assert record is None


def test_validate_credentials_fails_when_birthdate_wrong():
    """Test that authentication fails when birthdate doesn't match"""
    # Create a client record with birthdate
    client_record = ClientDataRecord(
        external_client_id="ext-123",
        pseudonymized_client_id="pseudo-123",
        full_name=FullNameModel(given_names="John", surname="Doe"),
        birthdate=date(1985, 5, 15),
        state_code="US_UT",
    )

    # Try to authenticate with wrong birthdate
    provided_dob = date(1990, 1, 1)
    is_valid, record = validate_credentials_and_dob(
        record=client_record, date_of_birth=provided_dob
    )

    # Authentication should fail
    assert is_valid is False
    assert record is None


def test_validate_credentials_succeeds_when_birthdate_matches():
    """Test that authentication succeeds when birthdate matches"""
    # Create a client record with birthdate
    correct_dob = date(1985, 5, 15)
    client_record = ClientDataRecord(
        external_client_id="ext-123",
        pseudonymized_client_id="pseudo-123",
        full_name=FullNameModel(given_names="John", surname="Doe"),
        birthdate=correct_dob,
        state_code="US_UT",
    )

    # Try to authenticate with correct birthdate
    is_valid, record = validate_credentials_and_dob(
        record=client_record, date_of_birth=correct_dob
    )

    # Authentication should succeed
    assert is_valid is True
    assert record is not None
    assert record.pseudonymized_client_id == "pseudo-123"


def test_client_data_record_accepts_none_birthdate():
    """Test that ClientDataRecord can be created without birthdate"""
    client_record = ClientDataRecord(
        external_client_id="ext-123",
        pseudonymized_client_id="pseudo-123",
        full_name=FullNameModel(given_names="Jane", surname="Smith"),
        birthdate=None,
        state_code="US_AZ",
    )

    assert client_record.birthdate is None
    assert client_record.external_client_id == "ext-123"
    assert client_record.full_name.given_names == "Jane"
