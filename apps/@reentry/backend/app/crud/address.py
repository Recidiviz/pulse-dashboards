import logging
from typing import Literal, Optional, overload
from uuid import UUID

from sqlmodel import select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.intake import ClientAddress, Intake
from app.routes.shared_models import AddressSubmission

logger = logging.getLogger(__name__)


async def get_collected_address_for_intake(
    session: AsyncSession, intake_id: UUID
) -> Optional[ClientAddress]:
    """Get collected address for an intake using the intake.address relationship"""
    intake = await session.get(Intake, intake_id)
    if not intake:
        return None

    # Load the address relationship if not already loaded
    if intake.address is None:
        await session.refresh(intake, ["address"])

    return intake.address


async def update_intake_address(
    session: AsyncSession,
    intake_id: str | UUID,
    address_data: AddressSubmission,
):
    # First check if an address already exists for this intake
    existing_address_stmt = select(ClientAddress).where(
        ClientAddress.intake_id == intake_id
    )
    existing_address_result = await session.exec(existing_address_stmt)
    existing_address = existing_address_result.first()

    # Get the intake to verify it exists
    intake_stmt = select(Intake).where(Intake.id == intake_id)
    intake_result = await session.exec(intake_stmt)
    intake = intake_result.first()

    if not intake:
        return None

    if existing_address:
        # Update existing address
        existing_address.city = address_data.city
        existing_address.state = address_data.state
        existing_address.street_address = address_data.street_address
        session.add(existing_address)
        await session.commit()
        await session.refresh(existing_address)
        return existing_address
    else:
        # Create new address
        new_address = ClientAddress(
            intake_id=intake.id,
            city=address_data.city,
            state=address_data.state,
            street_address=address_data.street_address,
        )
        session.add(new_address)
        await session.commit()
        await session.refresh(new_address)
        return new_address


@overload
async def get_latest_address_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[ClientAddress]: ...


@overload
async def get_latest_address_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: Literal[False] = False,
) -> ClientAddress | None: ...


@statement_or_result(first_only=True)
async def get_latest_address_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: bool = False,
) -> SelectOfScalar[ClientAddress] | ClientAddress | None:
    """
    Get the latest address linked to any intake for a client.
    Returns the address that was most recently updated.
    """
    return (
        select(ClientAddress)
        .join(Intake, ClientAddress.intake_id == Intake.id)
        .where(Intake.client_pseudo_id == client_pseudo_id)
        .order_by(ClientAddress.updated_at.desc())
    )
