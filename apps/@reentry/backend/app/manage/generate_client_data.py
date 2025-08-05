import json
import random
import uuid
from pathlib import Path

import redis
from faker import Faker
from google.cloud import bigquery

from app.core.config import settings

from .base import cli

# Path to the clients data directory
PROJECT_ROOT = Path(__file__).parent.parent.parent  # Gets to backend/ directory
EXAMPLES_DIR = PROJECT_ROOT / "data" / "examples"
CLIENTS_DATA_DIR = EXAMPLES_DIR / "clients"


def query_existing_table(client, table_id):
    """Query existing table to get sample data and row count"""
    try:
        # Get row count
        count_query = f"SELECT COUNT(*) as count FROM `{table_id}`"
        count_result = client.query(count_query).result()
        row_count = next(count_result).count

        # Get sample row
        sample_query = f"SELECT * FROM `{table_id}` LIMIT 1"
        sample_result = client.query(sample_query).result()
        sample_row = next(sample_result, None)

        return row_count, dict(sample_row) if sample_row else None
    except Exception:
        return None, None


def generate_schema_files():
    """Generate BigQuery schema files for each table"""

    # Case Manager schema
    case_manager_schema = [
        {"name": "state_code", "type": "STRING", "mode": "REQUIRED"},
        {"name": "external_id", "type": "STRING", "mode": "REQUIRED"},
        {"name": "pseudonymized_id", "type": "STRING", "mode": "REQUIRED"},
        {
            "name": "full_name",
            "type": "STRING",
            "mode": "REQUIRED",
            "description": "JSON string containing given_names, middle_names, surname, name_suffix",
        },
        {"name": "email", "type": "STRING", "mode": "REQUIRED"},
        {"name": "birthdate", "type": "DATE", "mode": "REQUIRED"},
        {"name": "client_ids", "type": "STRING", "mode": "REPEATED"},
    ]

    # Supervision Officer schema (same as case manager)
    supervision_officer_schema = case_manager_schema.copy()

    # Client schema
    client_schema = [
        {"name": "state_code", "type": "STRING", "mode": "REQUIRED"},
        {"name": "external_id", "type": "STRING", "mode": "REQUIRED"},
        {"name": "pseudonymized_id", "type": "STRING", "mode": "REQUIRED"},
        {"name": "staff_id", "type": "STRING", "mode": "REQUIRED"},
        {
            "name": "full_name",
            "type": "STRING",
            "mode": "REQUIRED",
            "description": "JSON string containing given_names, middle_names, surname, name_suffix",
        },
        {"name": "birthdate", "type": "DATE", "mode": "REQUIRED"},
    ]

    # Write schema files
    CLIENTS_DATA_DIR.mkdir(parents=True, exist_ok=True)

    with open(CLIENTS_DATA_DIR / "case_manager_schema.json", "w") as f:
        json.dump(case_manager_schema, f, indent=2)

    with open(CLIENTS_DATA_DIR / "supervision_officer_schema.json", "w") as f:
        json.dump(supervision_officer_schema, f, indent=2)

    with open(CLIENTS_DATA_DIR / "client_schema.json", "w") as f:
        json.dump(client_schema, f, indent=2)

    return (
        CLIENTS_DATA_DIR / "case_manager_schema.json",
        CLIENTS_DATA_DIR / "supervision_officer_schema.json",
        CLIENTS_DATA_DIR / "client_schema.json",
    )


@cli.command()
def generate_client_data(
    mode: str = "demo",
    env: str = "dev",
):
    """
    Generate sample client, case manager, and supervision officer data as JSON files for BigQuery.

    Args:
        mode: Data generation mode - 'demo' creates UXR users, other values generate fake names
        env: Environment - 'dev' uses dev tables, 'demo' uses demo tables
    """

    # Initialize BigQuery client
    client = bigquery.Client(project=settings.BQ_PROJECT_ID)

    # Get table names based on env
    if env == "demo":
        case_manager_table = "case_manager_demo"
        supervision_officer_table = "supervision_officer_demo"
        client_table = "client_demo"
    else:  # dev env
        case_manager_table = "case_manager_dev"
        supervision_officer_table = "supervision_officer_dev"
        client_table = "client_dev"

    # Full table IDs
    case_manager_table_id = (
        f"{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{case_manager_table}"
    )
    supervision_officer_table_id = (
        f"{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{supervision_officer_table}"
    )
    client_table_id = f"{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{client_table}"

    # Full table IDs for commands
    case_manager_table_id_command = (
        f"{settings.BQ_PROJECT_ID}:{settings.BQ_DATASET}.{case_manager_table}"
    )
    supervision_officer_table_id_command = (
        f"{settings.BQ_PROJECT_ID}:{settings.BQ_DATASET}.{supervision_officer_table}"
    )
    client_table_id_command = (
        f"{settings.BQ_PROJECT_ID}:{settings.BQ_DATASET}.{client_table}"
    )

    print(f"=== BigQuery Table Status for {env.upper()} environment ===")

    # Check each table
    tables_info = [
        ("Case Manager", case_manager_table_id),
        ("Supervision Officer", supervision_officer_table_id),
        ("Client", client_table_id),
    ]

    for table_name, table_id in tables_info:
        print(f"\n{table_name} Table ({table_id}):")
        row_count, sample_row = query_existing_table(client, table_id)

        if row_count is not None:
            print(f"  Rows: {row_count}")
            if sample_row:
                print(f"  Sample row: {json.dumps(sample_row, indent=2, default=str)}")
        else:
            print(
                "  Table does not exist (will be created automatically by bq load --autodetect)"
            )

    # Print delete commands
    print("\n=== Commands to delete current data ===")
    print(
        f"bq query --use_legacy_sql=false 'DELETE FROM `{case_manager_table_id}` WHERE TRUE'"
    )
    print(
        f"bq query --use_legacy_sql=false 'DELETE FROM `{supervision_officer_table_id}` WHERE TRUE'"
    )
    print(
        f"bq query --use_legacy_sql=false 'DELETE FROM `{client_table_id}` WHERE TRUE'"
    )

    print("\n=== Commands to delete tables (if you encounter schema issues) ===")
    print(f"bq rm -f {case_manager_table_id_command}")
    print(f"bq rm -f {supervision_officer_table_id_command}")
    print(f"bq rm -f {client_table_id_command}")

    # Generate data (keeping existing logic)
    print(f"\n=== Generating {mode.upper()} data ===")

    # Initialize Faker
    fake = Faker()
    Faker.seed(42)  # For reproducibility
    random.seed(42)

    # State-specific address generation (same as original)
    def generate_address_for_state(state_code: str) -> str:
        """Generate an address appropriate for the given state code."""
        state_data = {
            "US_ID": {
                "cities": [
                    "Boise",
                    "Meridian",
                    "Nampa",
                    "Idaho Falls",
                    "Pocatello",
                    "Caldwell",
                    "Coeur d'Alene",
                    "Twin Falls",
                ],
                "zip_ranges": [(83001, 83899)],
                "state_abbr": "ID",
            },
            "US_AZ": {
                "cities": [
                    "Phoenix",
                    "Tucson",
                    "Mesa",
                    "Chandler",
                    "Scottsdale",
                    "Glendale",
                    "Gilbert",
                    "Tempe",
                ],
                "zip_ranges": [(85001, 86599)],
                "state_abbr": "AZ",
            },
            "US_UT": {
                "cities": [
                    "Salt Lake City",
                    "West Valley City",
                    "Provo",
                    "West Jordan",
                    "Orem",
                    "Sandy",
                    "Ogden",
                    "St. George",
                ],
                "zip_ranges": [(84001, 84799)],
                "state_abbr": "UT",
            },
        }

        if state_code not in state_data:
            return fake.address().replace("\n", ", ")

        state_info = state_data[state_code]
        city = random.choice(state_info["cities"])
        street_number = fake.building_number()
        street_name = fake.street_name()
        zip_start, zip_end = state_info["zip_ranges"][0]
        zip_code = random.randint(zip_start, zip_end)

        return f"{street_number} {street_name}, {city}, {state_info['state_abbr']} {zip_code}"

    # Special pseudonymized ID for dev environment testing
    DEV_PSEUDONYMIZED_ID = "abcd1234"

    # Create 3 case managers
    case_managers = []
    for i in range(3):
        staff_id = f"CM-{i + 1:03d}"

        # First case manager gets the special pseudonymized ID and all clients
        if i == 0:
            # For demo mode, use US_ID, for non-demo decide based on distribution
            if mode == "demo":
                state_code = "US_ID"
            else:
                # First case manager gets Arizona (half the staff will be in AZ)
                state_code = "US_AZ"

            # Generate name with state suffix for non-demo
            given_name = "Dev"
            surname = "Test User"
            if mode != "demo":
                state_letter = state_code.split("_")[-1]  # Gets 'AZ', 'ID', or 'UT'
                surname = f"Test User {state_letter}"

            case_managers.append(
                {
                    "state_code": state_code,
                    "external_id": staff_id,
                    "pseudonymized_id": DEV_PSEUDONYMIZED_ID,
                    "full_name": json.dumps(
                        {
                            "given_names": given_name,
                            "middle_names": "",
                            "surname": surname,
                            "name_suffix": "",
                        }
                    ),
                    "email": "dev.test@example.com",
                    "birthdate": fake.date_of_birth(
                        minimum_age=25, maximum_age=65
                    ).strftime("%Y-%m-%d"),
                    "client_ids": [f"CLIENT-{j + 1:03d}" for j in range(10)],
                }
            )
        else:
            first_name = fake.first_name()
            last_name = fake.last_name()
            name_suffix = (
                random.choice(["", "Jr.", "Sr.", "III", "IV"])
                if random.random() > 0.8
                else ""
            )

            # For non-demo mode: distribute states with half in Arizona
            if mode == "demo":
                state_code = random.choice(["US_ID", "US_AZ", "US_UT"])
            else:
                # Second case manager gets non-Arizona state (other half)
                state_code = random.choice(["US_ID", "US_UT"])
                # Add state letter to surname for non-demo
                state_letter = state_code.split("_")[-1]
                last_name = f"{last_name} {state_letter}"

            case_managers.append(
                {
                    "state_code": state_code,
                    "external_id": staff_id,
                    "pseudonymized_id": str(uuid.uuid4()),
                    "full_name": json.dumps(
                        {
                            "given_names": first_name,
                            "middle_names": "",
                            "surname": last_name,
                            "name_suffix": name_suffix,
                        }
                    ),
                    "email": fake.email(),
                    "birthdate": fake.date_of_birth(
                        minimum_age=25, maximum_age=65
                    ).strftime("%Y-%m-%d"),
                    "client_ids": [],
                }
            )

    # Create 3 supervision officers
    supervision_officers = []
    for i in range(3):
        staff_id = f"SO-{i + 1:03d}"
        first_name = fake.first_name()
        last_name = fake.last_name()
        middle_name = fake.first_name() if random.random() > 0.7 else ""
        name_suffix = (
            random.choice(["", "Jr.", "Sr.", "III", "IV"])
            if random.random() > 0.8
            else ""
        )

        # For non-demo mode: distribute states with roughly half in Arizona
        if mode == "demo":
            state_code = random.choice(["US_ID", "US_AZ", "US_UT"])
        else:
            # Distribute: first SO gets AZ, others get non-AZ states
            if i == 0:
                state_code = "US_AZ"
            else:
                state_code = random.choice(["US_ID", "US_UT"])
            # Add state letter to surname for non-demo
            state_letter = state_code.split("_")[-1]
            last_name = f"{last_name} {state_letter}"

        supervision_officers.append(
            {
                "state_code": state_code,
                "external_id": staff_id,
                "pseudonymized_id": str(uuid.uuid4()),
                "full_name": json.dumps(
                    {
                        "given_names": first_name,
                        "middle_names": middle_name,
                        "surname": last_name,
                        "name_suffix": name_suffix,
                    }
                ),
                "email": fake.email(),
                "birthdate": fake.date_of_birth(
                    minimum_age=25, maximum_age=65
                ).strftime("%Y-%m-%d"),
                "client_ids": [],
            }
        )

    # Get the special staff member (first case manager)
    special_staff = case_managers[0]

    # Create 10 clients - all assigned to the special staff member
    clients = []
    for i in range(10):
        client_id = f"CLIENT-1{i + 1:03d}"

        # Use mode to determine name generation and state distribution
        first_name = "UXR" if mode == "demo" else fake.first_name()
        last_name = f"User #{i + 1}" if mode == "demo" else fake.last_name()
        middle_name = fake.first_name() if random.random() > 0.7 else ""
        name_suffix = (
            random.choice(["", "Jr.", "Sr.", "III", "IV"])
            if random.random() > 0.8
            else ""
        )

        # State distribution based on mode
        if mode == "demo":
            state_code = "US_ID"
        else:
            # For non-demo: half in Arizona (first 5), half in other states (last 5)
            if i < 5:
                state_code = "US_AZ"
            else:
                state_code = random.choice(["US_ID", "US_UT"])
            # Add state letter to surname for non-demo
            state_letter = state_code.split("_")[-1]
            last_name = f"{last_name} {state_letter}"

        clients.append(
            {
                "state_code": state_code,
                "external_id": client_id,
                "pseudonymized_id": str(uuid.uuid4()),
                "staff_id": special_staff[
                    "external_id"
                ],  # All clients assigned to special staff
                "full_name": json.dumps(
                    {
                        "given_names": first_name,
                        "middle_names": middle_name,
                        "surname": last_name,
                        "name_suffix": name_suffix,
                    }
                ),
                "birthdate": "1990-01-01"
                if mode == "demo"
                else fake.date_of_birth(minimum_age=18, maximum_age=65).strftime(
                    "%Y-%m-%d"
                ),
            }
        )

    # Create the clients data directory if it doesn't exist
    CLIENTS_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Generate schema files
    case_manager_schema_path, supervision_officer_schema_path, client_schema_path = (
        generate_schema_files()
    )

    # Export to JSON files
    case_manager_path = CLIENTS_DATA_DIR / f"case_manager_data_{env}_{mode}.json"
    supervision_officer_path = (
        CLIENTS_DATA_DIR / f"supervision_officer_data_{env}_{mode}.json"
    )
    client_path = CLIENTS_DATA_DIR / f"client_data_{env}_{mode}.json"

    # Write nicely formatted JSON files (newline-delimited for BigQuery)
    with open(case_manager_path, "w") as f:
        for record in case_managers:
            f.write(json.dumps(record) + "\n")

    with open(supervision_officer_path, "w") as f:
        for record in supervision_officers:
            f.write(json.dumps(record) + "\n")

    with open(client_path, "w") as f:
        for record in clients:
            f.write(json.dumps(record) + "\n")

    print(
        f"\nGenerated {len(case_managers)} case managers, {len(supervision_officers)} supervision officers, {len(clients)} clients"
    )
    print(f"\nJSON files created in {CLIENTS_DATA_DIR}:")
    print(f"- {case_manager_path.name}")
    print(f"- {supervision_officer_path.name}")
    print(f"- {client_path.name}")
    print(f"- {case_manager_schema_path.name}")
    print(f"- {supervision_officer_schema_path.name}")
    print(f"- {client_schema_path.name}")

    # Print load commands with explicit schema
    print("\n=== Commands to load JSON data to BigQuery ===")
    print(
        f"bq load --source_format=NEWLINE_DELIMITED_JSON --schema={case_manager_schema_path} {case_manager_table_id_command} {case_manager_path}"
    )
    print(
        f"bq load --source_format=NEWLINE_DELIMITED_JSON --schema={supervision_officer_schema_path} {supervision_officer_table_id_command} {supervision_officer_path}"
    )
    print(
        f"bq load --source_format=NEWLINE_DELIMITED_JSON --schema={client_schema_path} {client_table_id_command} {client_path}"
    )

    print(
        f"\n[INFO] All clients are assigned to case manager '{special_staff['external_id']}' with pseudonymized_id='{DEV_PSEUDONYMIZED_ID}'"
    )
    print(
        "For Auth0 testing, set the app_metadata pseudonymized_id to this value to access all clients."
    )


@cli.command("reset-client-cache")
def reset_client_cache():
    """
    Clear Redis cache entries for client data.
    """
    try:
        redis_client = redis.from_url(settings.REDIS_URL)

        # Get all keys matching client data patterns
        client_keys = redis_client.keys("client:*")
        staff_client_keys = redis_client.keys("staff_clients:*")
        caseworker_keys = redis_client.keys("caseworker:*")

        all_keys = client_keys + staff_client_keys + caseworker_keys

        if all_keys:
            # Delete all matched keys
            redis_client.delete(*all_keys)
            print(f"Cleared {len(all_keys)} Redis cache entries")
        else:
            print("No Redis cache entries found to clear")

    except Exception as e:
        print(f"Error clearing Redis cache: {e}")
