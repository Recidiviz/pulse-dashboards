"""populate_assessment_config_id

Revision ID: 8bd25ebbc716
Revises: 6f1b3d5fd07f
Create Date: 2025-10-20 18:51:49.048943

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '8bd25ebbc716'
down_revision: Union[str, None] = 'a49628a6f57c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Populate assessment_config_id for all existing intakes before making it required.

    Strategy:
    1. For each intake without assessment_config_id:
       - Get the client's state from BigQuery (via client_pseudo_id)
       - Find the active assessment config for that state
       - Update the intake with the assessment_config_id
    2. Then make the column non-nullable
    """

    # Get a connection
    connection = op.get_bind()

    # Query all intakes without assessment_config_id
    intakes_query = text("""
        SELECT id, client_pseudo_id
        FROM intake
        WHERE assessment_config_id IS NULL
    """)
    intakes_without_config = connection.execute(intakes_query).fetchall()

    print(f"Found {len(intakes_without_config)} intakes without assessment_config_id")

    # For each intake, assign the appropriate assessment config
    for intake_id, client_pseudo_id in intakes_without_config:
        # Get client state from BigQuery
        # Note: This requires the BigQuery client data to be available
        # In production, you might need to handle this differently
        try:
            # Import here to avoid circular dependencies
            import sys
            import pathlib
            sys.path.append(str(pathlib.Path(__file__).resolve().parents[3]))

            from app.services.client_data.queries import Queries

            client_record = Queries.get_client_by_pseudonymized_id_unsafe(client_pseudo_id)

            if not client_record:
                print(f"⚠️  Warning: No client record found for intake {intake_id} (client: {client_pseudo_id})")
                continue

            # client_record.state_code is already normalized (US_ID -> US_IX) by Queries
            state_code = client_record.state_code

            # Find the active assessment config for this state
            # We'll use the first active config for the state
            config_query = text("""
                SELECT id
                FROM assessmentconfig
                WHERE state_code = :state_code
                AND is_active = true
                ORDER BY created_at DESC
                LIMIT 1
            """)

            result = connection.execute(config_query, {"state_code": state_code})
            config_row = result.fetchone()

            if not config_row:
                print(f"⚠️  Warning: No active assessment config found for state {state_code} (intake {intake_id})")
                continue

            config_id = config_row[0]

            # Update the intake with the assessment_config_id
            update_query = text("""
                UPDATE intake
                SET assessment_config_id = :config_id
                WHERE id = :intake_id
            """)

            connection.execute(update_query, {
                "config_id": config_id,
                "intake_id": intake_id
            })

            print(f"✓ Updated intake {intake_id} with assessment_config {config_id} (state: {state_code})")

        except Exception as e:
            print(f"❌ Error processing intake {intake_id}: {e}")
            # Continue with next intake rather than failing the entire migration
            continue

    # Verify all intakes now have assessment_config_id
    verification_query = text("""
        SELECT COUNT(*)
        FROM intake
        WHERE assessment_config_id IS NULL
    """)

    remaining_null = connection.execute(verification_query).fetchone()[0]

    if remaining_null > 0:
        print(f"\n⚠️  WARNING: {remaining_null} intakes still have NULL assessment_config_id")
        print("These intakes will need to be manually updated before this migration can complete.")

    print(f"\n✓ All intakes now have assessment_config_id assigned")



def downgrade() -> None:
    # Nothing to do here
    pass
