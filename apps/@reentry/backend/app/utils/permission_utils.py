from fastapi import HTTPException

from app.services.client_data.queries import Queries


def check_access(client_pseudo_id, pseudonymized_staff_id):
    # Verify client access
    record = Queries.get_client_data_by_pseudonymized_id(
        pseudonymized_client_id=client_pseudo_id,
        pseudonymized_staff_id=pseudonymized_staff_id,
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Client not found")
