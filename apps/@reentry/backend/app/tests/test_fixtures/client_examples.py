"""
Provides standardized client examples for use in tests.
This ensures consistency across test files and makes it easier to update client data structures.
"""

import random
from datetime import date

from app.services.client_data.types import (
    CaseWorkerDataRecord,
    ClientDataRecord,
    FullNameModel,
)

# Client examples


def create_john_doe():
    """Return a standard John Doe client example."""
    return ClientDataRecord(
        external_client_id="client-001ex",
        pseudonymized_client_id="client-001ps",
        full_name=FullNameModel(
            given_names="John", middle_names="", surname="Doe", name_suffix=""
        ),
        birthdate=date(1985, 1, 1),
        state_code="US_IX",
    )


def create_jane_smith():
    """Return a standard Jane Smith client example."""
    return ClientDataRecord(
        external_client_id="client-002ex",
        pseudonymized_client_id="client-002ps",
        full_name=FullNameModel(
            given_names="Jane", middle_names="", surname="Smith", name_suffix=""
        ),
        birthdate=date(1990, 5, 15),
        state_code="US_AZ",
    )


def create_robert_johnson():
    """Return a standard Robert Johnson client example with middle name and suffix."""
    return ClientDataRecord(
        external_client_id="client-003ex",
        pseudonymized_client_id="client-003ps",
        full_name=FullNameModel(
            given_names="Robert",
            middle_names="Alan",
            surname="Johnson",
            name_suffix="Jr.",
        ),
        birthdate=date(1978, 8, 12),
        state_code="US_UT",
    )


def create_alice_williams():
    """Return a standard Alice Williams client example."""
    return ClientDataRecord(
        external_client_id="client-004ex",
        pseudonymized_client_id="client-004ps",
        full_name=FullNameModel(
            given_names="Alice", middle_names="", surname="Williams", name_suffix=""
        ),
        birthdate=date(1988, 3, 20),
        state_code="US_IX",
    )


def create_test_client():
    """Return a generic test client."""
    states_codes = ["US_IX", "US_AZ", "US_UT"]

    return ClientDataRecord(
        external_client_id="client-001ex",
        pseudonymized_client_id="client-001ps",
        full_name=FullNameModel(
            given_names="Test", middle_names="", surname="Client", name_suffix=""
        ),
        birthdate=date(1985, 1, 1),
        state_code=random.choice(states_codes),
    )


# Staff examples


def create_case_manager():
    """Return a standard case manager."""
    return CaseWorkerDataRecord(
        external_staff_id="staff-001",
        pseudonymized_staff_id="test-pseudonymized-id",
        email="staff@example.com",
        full_name=FullNameModel(
            given_names="Case", middle_names="", surname="Manager", name_suffix=""
        ),
        external_client_ids=["client-001ex", "client-002ex"],
        state_code="US_IX",
    )


def create_supervision_officer():
    """Return a standard supervision officer."""
    return CaseWorkerDataRecord(
        external_staff_id="staff-002",
        pseudonymized_staff_id="supervisor-id",
        email="supervisor@example.com",
        full_name=FullNameModel(
            given_names="Susan", middle_names="", surname="Supervisor", name_suffix=""
        ),
        external_client_ids=["client-003ex"],
        state_code="US_AZ",
    )


# Collections for convenience


def get_standard_clients():
    """Return a list of all standard clients."""
    return [
        create_john_doe(),
        create_jane_smith(),
        create_robert_johnson(),
    ]


def get_client_dict():
    """Return a dictionary of clients by their external ID."""
    clients = get_standard_clients()
    return {client.external_client_id: client for client in clients}


def get_staff_members():
    """Return a list of all standard staff members."""
    return [
        create_case_manager(),
        create_supervision_officer(),
    ]
