import logging
from typing import Literal, Optional, Tuple, overload
from uuid import UUID

from sqlalchemy.orm import joinedload, selectinload
from sqlmodel import and_, not_, select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.intake import (
    ClientAddress,
    Intake,
    IntakeMessage,
    IntakeStatus,
    IntakeToken,
    IntakeType,
)
from app.models.intake_sections import (
    ClientIntakeSection,
)
from app.routes.shared_models import AddressSubmission

logger = logging.getLogger(__name__)


@overload
async def get_intake_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    token: str | None = None,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[Intake]: ...


@overload
async def get_intake_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    token: str | None = None,
    *,
    query_only: Literal[False] = False,
) -> Intake | None: ...


@statement_or_result(first_only=True)
async def get_intake_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    token: str | None = None,
    *,
    query_only: bool = False,
) -> SelectOfScalar[Intake] | Intake | None:
    stmt = (
        select(Intake)
        .options(
            joinedload(Intake.client_intake_sections).joinedload(
                ClientIntakeSection.intake_section
            ),
            joinedload(Intake.client_intake_sections).joinedload(
                ClientIntakeSection.intake_section_revision
            ),
            selectinload(Intake.intake_token),
            selectinload(Intake.address),
        )
        .where(Intake.client_pseudo_id == client_pseudo_id)
    )

    result = await session.execute(
        select(Intake.internal_access).where(
            Intake.client_pseudo_id == client_pseudo_id
        )
    )
    intake_row = result.first()
    internal_access = intake_row.internal_access if intake_row else None

    if token and not internal_access:
        stmt = stmt.where(IntakeToken.token == token)

    return stmt


@overload
async def get_intake_by_id(
    session: AsyncSession, intake_id: str, *, query_only: Literal[True]
) -> SelectOfScalar[Intake]: ...


@overload
async def get_intake_by_id(
    session: AsyncSession, intake_id: str, *, query_only: Literal[False] = False
) -> Intake | None: ...


@statement_or_result(first_only=True)
async def get_intake_by_id(
    session: AsyncSession, intake_id: str, *, query_only: bool = False
) -> SelectOfScalar[Intake] | Intake | None:
    return (
        select(Intake)
        .options(
            joinedload(Intake.client_intake_sections).joinedload(
                ClientIntakeSection.intake_section
            )
        )
        .where(Intake.id == intake_id)
    )


@statement_or_result(first_only=False)
async def get_current_section_title(session: AsyncSession, intake_id: UUID) -> str:
    """
    Get the title (string) of the first in_progress section of the ClientIntakeSections or the last section title
    """

    from app.utils.intake.constants import CompletionStatus

    # First try to find an in-progress section
    in_progress_query = (
        select(ClientIntakeSection)
        .options(joinedload(ClientIntakeSection.intake_section))
        .where(
            ClientIntakeSection.intake_id == intake_id,
            ClientIntakeSection.completion_status == CompletionStatus.IN_PROGRESS.value,
        )
        .order_by(ClientIntakeSection.order)
    )

    result = await session.exec(in_progress_query)
    in_progress_section = result.first()

    if in_progress_section:
        # Return the title as a string, not the entire object
        return in_progress_section.intake_section.title

    # If no in-progress section found, get the last section by order
    last_section_query = (
        select(ClientIntakeSection)
        .options(joinedload(ClientIntakeSection.intake_section))
        .where(ClientIntakeSection.intake_id == intake_id)
        .order_by(ClientIntakeSection.order.desc())
        .limit(1)
    )

    result = await session.exec(last_section_query)
    last_section = result.first()

    if last_section:
        # Return the title as a string, not the entire object
        return last_section.intake_section.title

    # If no sections at all, return a default
    return "Closing"


@overload
async def get_intake_messages(
    session: AsyncSession, intake_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[IntakeMessage]: ...


@overload
async def get_intake_messages(
    session: AsyncSession, intake_id: UUID, *, query_only: Literal[False] = False
) -> list[IntakeMessage]: ...


@statement_or_result()
async def get_intake_messages(
    session: AsyncSession, intake_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[IntakeMessage] | list[IntakeMessage]:
    """
    Get all messages for a specific intake ordered by creation time.
    """
    return (
        select(IntakeMessage)
        .where(IntakeMessage.intake_id == intake_id)
        .order_by(IntakeMessage.created_at)
    )


@overload
async def get_intake_section_messages(
    session: AsyncSession, intake_id: UUID, section: str, *, query_only: Literal[True]
) -> SelectOfScalar[IntakeMessage]: ...


@overload
async def get_intake_section_messages(
    session: AsyncSession,
    intake_id: UUID,
    section: str,
    *,
    query_only: Literal[False] = False,
) -> list[IntakeMessage]: ...


@statement_or_result()
async def get_intake_section_messages(
    session: AsyncSession, intake_id: UUID, section: str, *, query_only: bool = False
) -> SelectOfScalar[IntakeMessage] | list[IntakeMessage]:
    """
    Get only the message content, from_role, and updated_at for a specific intake section.
    """
    stmt = (
        select(IntakeMessage)
        .where(
            and_(IntakeMessage.intake_id == intake_id, IntakeMessage.section == section)
        )
        .order_by(IntakeMessage.created_at)
    )
    return stmt


WELCOME_BACK_TEST_STRING = "thanks for joining again"


@overload
async def get_latest_not_welcome_message(
    session: AsyncSession, intake_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[IntakeMessage]: ...


@overload
async def get_latest_not_welcome_message(
    session: AsyncSession, intake_id: UUID, *, query_only: Literal[False] = False
) -> IntakeMessage | None: ...


@statement_or_result(first_only=True)
async def get_latest_not_welcome_message(
    session: AsyncSession, intake_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[IntakeMessage] | IntakeMessage | None:
    """
    Get the most recent message for a specific intake.
    """
    return (
        select(IntakeMessage)
        .where(IntakeMessage.intake_id == intake_id)
        .filter(not_(IntakeMessage.content.icontains(WELCOME_BACK_TEST_STRING)))
        .order_by(IntakeMessage.created_at.desc())
        .limit(1)
    )


@overload
async def get_latest_message(
    session: AsyncSession, intake_id: UUID, *, query_only: Literal[True]
) -> SelectOfScalar[IntakeMessage]: ...


@overload
async def get_latest_message(
    session: AsyncSession, intake_id: UUID, *, query_only: Literal[False] = False
) -> IntakeMessage | None: ...


@statement_or_result(first_only=True)
async def get_latest_message(
    session: AsyncSession, intake_id: UUID, *, query_only: bool = False
) -> SelectOfScalar[IntakeMessage] | IntakeMessage | None:
    """
    Get the most recent message for a specific intake.
    """
    return (
        select(IntakeMessage)
        .where(IntakeMessage.intake_id == intake_id)
        .order_by(IntakeMessage.created_at.desc())
        .limit(1)
    )


async def create_intake(
    session: AsyncSession, client_pseudo_id: str, intake_type: IntakeType
) -> Intake:
    """Create a new intake record."""
    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=IntakeStatus.CREATED.value,
        internal_access=True,
        intake_type=intake_type.value,
    )
    session.add(intake)
    await session.commit()
    await session.refresh(intake)
    return intake


async def get_or_create_token(
    session: AsyncSession, intake_id: UUID
) -> Tuple[IntakeToken, str]:
    """Get existing token or create a new one for an intake."""
    token_result = await session.exec(
        select(IntakeToken).where(IntakeToken.intake_id == intake_id)
    )
    token_entry = token_result.first()

    if not token_entry:
        token_entry, raw_token = IntakeToken.generate_token(intake_id)
        session.add(token_entry)
        await session.commit()
        return token_entry, raw_token
    else:
        return token_entry, token_entry.token


async def get_intake_token(session: AsyncSession, token: str) -> Optional[IntakeToken]:
    """Get intake token by token string."""
    query = select(IntakeToken).where(IntakeToken.token == token)
    result = await session.execute(query)
    return result.scalars().first()


async def get_intake_by_token(
    session: AsyncSession, token: str
) -> Tuple[Optional[IntakeToken], Optional[Intake]]:
    """Get intake token and intake by token string."""
    token_obj = await get_intake_token(session, token)
    if not token_obj:
        return None, None

    parent_query = select(Intake).where(Intake.id == token_obj.intake_id)
    parent_result = await session.execute(parent_query)
    intake = parent_result.scalars().first()

    return token_obj, intake


async def update_internal_access_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    internal_access: bool,
) -> Intake | None:
    result = await session.execute(
        select(Intake).where(Intake.client_pseudo_id == client_pseudo_id)
    )
    intake = result.scalar_one_or_none()

    if not intake:
        return None

    intake.internal_access = internal_access
    session.add(intake)

    await session.commit()
    await session.refresh(intake)

    return intake


# Address-related CRUD operations using intake.address relationship


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


async def get_collected_address_for_client(
    session: AsyncSession, client_pseudo_id: str
) -> Optional[ClientAddress]:
    """Get collected address for a client by client_pseudo_id using the intake.address relationship"""
    # Get the intake with address relationship
    statement = (
        select(Intake)
        .options(selectinload(Intake.address))
        .where(Intake.client_pseudo_id == client_pseudo_id)
    )
    result = await session.exec(statement)
    intake = result.first()

    if not intake:
        return None

    return intake.address


async def update_client_address(
    session: AsyncSession,
    client_pseudo_id: str,
    address_data: AddressSubmission,
):
    statement = (
        select(Intake)
        .options(selectinload(Intake.address))
        .where(Intake.client_pseudo_id == client_pseudo_id)
    )
    result = await session.exec(statement)
    intake = result.first()

    if not intake:
        return None

    if intake.address:
        intake.address.city = address_data.city
        intake.address.state = address_data.state
        intake.address.street_address = address_data.street_address
        session.add(intake.address)
    else:
        new_address = ClientAddress(
            intake_id=intake.id,
            city=address_data.city,
            state=address_data.state,
            street_address=address_data.street_address,
        )
        session.add(new_address)

    await session.commit()
    await session.refresh(intake)

    return intake.address
