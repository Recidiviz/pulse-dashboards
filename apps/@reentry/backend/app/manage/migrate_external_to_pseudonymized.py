import structlog
from google.cloud import bigquery
from sqlmodel import select

from app.core.config import settings
from app.core.db import AsyncSession, get_session_async_manager
from app.models.assessment import Assessment
from app.models.intake import Intake
from app.models.models import Plan
from app.models.recording import RecordingSession
from app.services.client_data.types import ClientDataRecord
from app.services.client_data.utils import get_bigquery_client, process_client_row

from .base import cli

logger = structlog.get_logger(__name__)


# This command should only be used once,
# it populates client_pseudo_id for all from the current client_id (external_id) (with risks of collisions)
# to the pseudonymized_id which should be collision-free.
STAGING_CLIENT_MAPPING = {
    "119793": "US_IX",
    "128085": "US_AZ",
    "125178": "US_AZ",
    "117406": "US_IX",
    "103047": "US_AZ",
    "107794": "US_IX",
    "108087": "US_IX",
    "111220": "US_AZ",
    "103288": "US_IX",
    "123559": "US_UT",
    "130553": "US_IX",
    "104932": "US_IX",
    "131729": "US_IX",
    "12467": "US_UT",
    "100968": "US_IX",
    "105589": "US_IX",
    "140501": "US_IX",
    "58375": "US_IX",
    "119708": "US_IX",
    "151519": "US_IX",
    "119127": "US_IX",
    "106153": "US_IX",
    "103214": "US_IX",
    "109678": "US_IX",
    "104511": "US_IX",
    "100692": "US_IX",
    "100762": "US_IX",
    "100438": "US_IX",
    "100814": "US_IX",
    "101982": "US_IX",
    "107206": "US_IX",
    "107636": "US_IX",
    "121974": "US_UT",
    "106104": "US_AZ",
    "115219": "US_IX",
    "102329": "US_AZ",
    "127907": "US_IX",
    "2196314": "US_AZ",
    "198017": "US_AZ",
    "115239": "US_AZ",
    "185329": "US_AZ",
    "2248149": "US_AZ",
    "107009": "US_AZ",
    "135773": "US_AZ",
    "127421": "US_AZ",
    "139352": "US_AZ",
    "103744": "US_IX",
    "101824": "US_AZ",
    "144432": "US_IX",
    "161985": "US_AZ",
    "120602": "US_AZ",
    "104264": "US_IX",
    "147512": "US_AZ",
    "116059": "US_AZ",
}


PROD_CLIENT_MAPPING = CLIENT_MAPPING = {
    "94674": "US_IX",
    "174794": "US_UT",
    "226146": "US_UT",
    "155529": "US_UT",
    "151077": "US_UT",
    "37138": "US_IX",
    "90392": "US_IX",
    "102131": "US_IX",
    "173466": "US_UT",
    "132454": "US_IX",
    "160855": "US_IX",
    "76855": "US_IX",
    "262576": "US_UT",
    "154056": "US_IX",
    "57944": "US_IX",
    "159629": "US_IX",
    "227791": "US_UT",
    "158096": "US_IX",
    "144608": "US_IX",
    "235534": "US_UT",
    "2324220": "US_AZ",
    "2194285": "US_AZ",
    "2302478": "US_AZ",
    "2233615": "US_AZ",
}


def get_clients_by_external_id(external_id: str) -> list[ClientDataRecord]:
    """
    Retrieve all client records from BigQuery by external ID.
    Args:
        external_id: The external client ID to retrieve.
    Returns:
        A list of client records with the specified external ID, or an empty list if none are found.
    """
    if not external_id:
        return []

    # Construct the BigQuery query to fetch clients by external_id
    query = f"""
    SELECT
    external_id,
    pseudonymized_id,
    full_name,
    birthdate,
    state_code
    FROM
    `{settings.BQ_PROJECT_ID}.{settings.BQ_DATASET}.{settings.BQ_CLIENT_TABLE}`
    WHERE
    external_id = @external_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("external_id", "STRING", external_id),
        ]
    )

    try:
        client = get_bigquery_client()
        query_job = client.query(query, job_config=job_config)
        results = query_job.result()
        client_records_nn = [process_client_row(row) for row in results]
        client_records = [cr for cr in client_records_nn if cr]
        return client_records
    except Exception as e:
        logger.error(f"Error fetching clients by external ID: {str(e)}")
        return []


async def _update_client_ids(session: AsyncSession, client_record: ClientDataRecord):
    """
    Update all resources (Intake, Plan, Recording, Assessment) with the pseudonymized client ID.
    """
    """
    Update all resources (Intake, Plan, Recording, Assessment) with the pseudonymized client ID.
    """
    for model in [Intake, Plan, RecordingSession, Assessment]:
        records = await session.exec(
            select(model).where(model.client_id == client_record.external_client_id)
        )
        records_list = list(records)
        if len(records_list) > 1:
            logger.warning(
                f"Multiple records found in model {model.__name__} for client_id {client_record.external_client_id}"
            )
        for record in records_list:
            logger.info(
                f"Updating client_id {record.client_id} to {client_record.pseudonymized_client_id} in model {model.__name__}"
            )
            record.client_pseudo_id = client_record.pseudonymized_client_id
            session.add(record)


async def _migrate_ids(session: AsyncSession, client_mapping):
    logger.info("Starting migration of external IDs to pseudonymized IDs.")

    # Extract all client_ids from intake
    intake_client_ids = {row for row in await session.exec(select(Intake.client_id))}
    # Check for duplicates and log and exit if any found
    duplicate_client_ids = {
        client_id
        for client_id in intake_client_ids
        if list(intake_client_ids).count(client_id) > 1
    }
    if duplicate_client_ids:
        logger.error(f"Duplicate client IDs found in intake: {duplicate_client_ids}")
        return
    logger.info(f"Found {len(intake_client_ids)} client IDs in intake.")

    # Count leftover client_ids in assessment, recording, and plan
    assessment_client_ids = {
        row for row in await session.exec(select(Assessment.client_id))
    }
    recording_client_ids = {
        row for row in await session.exec(select(RecordingSession.client_id))
    }
    plan_client_ids = {row for row in await session.exec(select(Plan.client_id))}

    leftover_assessment_ids = assessment_client_ids - intake_client_ids
    leftover_recording_ids = recording_client_ids - intake_client_ids
    leftover_plan_ids = plan_client_ids - intake_client_ids

    logger.info(f"Leftover client IDs in assessment: {len(leftover_assessment_ids)}")
    logger.info(f"Leftover client IDs in recording: {len(leftover_recording_ids)}")
    logger.info(f"Leftover client IDs in plan: {len(leftover_plan_ids)}")

    for client_id in intake_client_ids:
        # Fetch the client records by external ID from BigQuery
        client_records = get_clients_by_external_id(client_id)

        if not client_records:
            logger.warning(f"No records found for client_id: {client_id} in BigQuery")
            continue

        if len(client_records) == 1:
            # Single record, perform the update
            client_record = client_records[0]
            # Update all the resources with client_ids
            await _update_client_ids(session, client_record)
        else:
            # Multiple records, log a warning and select based on FALLBACK_STATE
            logger.warning(
                f"Multiple records found for client_id: {client_id}. Records: {client_records}."
            )
            fallback_client_record = None
            for record in client_records:
                if record.state_code == client_mapping[record.external_client_id]:
                    fallback_client_record = record
                    break

            if fallback_client_record:
                # Update all the resources with client_ids for the fallback record
                await _update_client_ids(session, fallback_client_record)
            else:
                logger.error("Client external ID not found in client mapping")

    logger.info("Migration completed successfully.")
    await session.commit()


@cli.command()
async def migrate_ids():
    async with get_session_async_manager() as session:
        await _migrate_ids(session, PROD_CLIENT_MAPPING)
