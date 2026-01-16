import structlog
from fastapi import HTTPException

from app.services.client_data.queries import Queries
from app.utils.string_utils import normalize_locations

logger = structlog.get_logger(__name__)


def check_access(client_pseudo_id, pseudonymized_staff_id, cpa_client_locations=None):
    """
    Validate whether the given staff member is allowed to access the specified client.
    First attempt a strict match via Queries.get_client_data_by_pseudonymized_id.
    If no match is found, fall back to checking location-based access.
    """
    # Step 1: Direct access check
    record = Queries.get_client_data_by_pseudonymized_id(
        pseudonymized_client_id=client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_staff_id,
    )

    # If the strict access check succeeded, return the record immediately
    if record:
        return record

    # Step 2: Fallback — staff may still be allowed via location-based access
    staff_record = Queries.get_caseworker_by_pseudonymized_id(pseudonymized_staff_id)
    client_record = Queries.get_client_by_pseudonymized_id_unsafe(client_pseudo_id)

    # If either staff or client does not exist, log and raise 404
    if not staff_record or not client_record:
        logger.warning(
            f"Access denied: Staff {pseudonymized_staff_id} attempted to access "
            f"nonexistent or invalid client {client_pseudo_id}"
        )
        raise HTTPException(status_code=404, detail="Client not found")

    # Step 3: Gather all staff locations
    locations = []
    if staff_record.locations:
        locations = staff_record.locations
    if cpa_client_locations:
        locations += cpa_client_locations
    staff_locations = normalize_locations(locations)

    # Step 4: Location-based access check
    # Ensure client has at least one location, and check if staff covers it
    client_locations = normalize_locations(client_record.location or [])
    client_location = client_locations[0] if client_locations else None
    if client_location and client_location in staff_locations:
        # Staff is allowed to access the client based on location
        return client_record

    # Step 5: Access denied
    logger.warning(
        f"Unauthorized access attempt: Staff {pseudonymized_staff_id} tried to access "
        f"client {client_pseudo_id} without proper permissions"
    )
    raise HTTPException(status_code=403, detail="Access denied")
