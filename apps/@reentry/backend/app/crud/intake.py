from typing import Literal, Optional, Tuple, overload
from uuid import UUID

import structlog
from sqlalchemy.orm import joinedload, selectinload
from sqlmodel import and_, not_, select
from sqlmodel.sql.expression import SelectOfScalar

from app.core.db import AsyncSession
from app.crud.utils import statement_or_result
from app.models.base import IntakeStatus
from app.models.intake import (
    Intake,
    IntakeMessage,
    IntakeToken,
    IntakeType,
)
from app.models.intake_sections import (
    ClientIntakeSection,
)
from app.services.client_data.queries import Queries
from app.utils.config_loader import ConfigLoader

logger = structlog.get_logger(__name__)


@overload
async def get_intake_by_id(
    session: AsyncSession, intake_id: UUID | str, *, query_only: Literal[True]
) -> SelectOfScalar[Intake]: ...


@overload
async def get_intake_by_id(
    session: AsyncSession, intake_id: UUID | str, *, query_only: Literal[False] = False
) -> Intake | None: ...


@statement_or_result(first_only=True)
async def get_intake_by_id(
    session: AsyncSession, intake_id: UUID | str, *, query_only: bool = False
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


@overload
async def get_intake_with_address_and_recording(
    session: AsyncSession, intake_id: UUID | str, *, query_only: Literal[True]
) -> SelectOfScalar[Intake]: ...


@overload
async def get_intake_with_address_and_recording(
    session: AsyncSession, intake_id: UUID | str, *, query_only: Literal[False] = False
) -> Intake | None: ...


@statement_or_result(first_only=True)
async def get_intake_with_address_and_recording(
    session: AsyncSession, intake_id: UUID | str, *, query_only: bool = False
) -> SelectOfScalar[Intake] | Intake | None:
    """
    Get intake by ID with address and recording_session relationships eagerly loaded.
    Used for transcription completion operations.
    """
    return (
        select(Intake)
        .where(Intake.id == intake_id)
        .options(
            selectinload(Intake.address),
            selectinload(Intake.recording_session),
        )
    )


@overload
async def get_latest_active_conversation_intake(
    session: AsyncSession,
    client_pseudo_id: str,
    token: str | None = None,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[Intake]: ...


@overload
async def get_latest_active_conversation_intake(
    session: AsyncSession,
    client_pseudo_id: str,
    token: str | None = None,
    *,
    query_only: Literal[False] = False,
) -> Intake | None: ...


@statement_or_result(first_only=True)
async def get_latest_active_conversation_intake(
    session: AsyncSession,
    client_pseudo_id: str,
    token: str | None = None,
    *,
    query_only: bool = False,
) -> SelectOfScalar[Intake] | Intake | None:
    """
    Get the latest CREATED or IN_PROGRESS CONVERSATION intake for a client.
    Orders by created_at DESC to get the most recent one.
    Filters by IntakeType.CONVERSATION to ensure only conversation intakes are returned.
    Supports multiple intakes per client by returning the latest active one.
    """
    stmt = (
        select(Intake)
        .options(
            joinedload(Intake.client_intake_sections),
            joinedload(Intake.client_intake_sections).joinedload(
                ClientIntakeSection.intake_section
            ),
            joinedload(Intake.client_intake_sections).joinedload(
                ClientIntakeSection.intake_section_revision
            ),
            selectinload(Intake.intake_token),
            selectinload(Intake.address),
            selectinload(Intake.survey),
        )
        .where(
            and_(
                Intake.client_pseudo_id == client_pseudo_id,
                Intake.status.in_([IntakeStatus.CREATED, IntakeStatus.IN_PROGRESS]),
                Intake.intake_type == IntakeType.CONVERSATION.value,
            )
        )
        .order_by(Intake.created_at.desc())
    )
    # TODO if re-enable token - check for token

    return stmt


@overload
async def get_active_intake_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[Intake]: ...


@overload
async def get_active_intake_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: Literal[False] = False,
) -> Intake | None: ...


@statement_or_result(first_only=True)
async def get_active_intake_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: bool = False,
) -> SelectOfScalar[Intake] | Intake | None:
    """
    Get any CREATED or IN_PROGRESS intake for a client, regardless of intake type.
    Returns the most recent one ordered by created_at DESC.
    Used to check if a client has any active intake before creating a new one.
    """
    return (
        select(Intake)
        .where(
            and_(
                Intake.client_pseudo_id == client_pseudo_id,
                Intake.status.in_([IntakeStatus.CREATED, IntakeStatus.IN_PROGRESS]),
            )
        )
        .order_by(Intake.created_at.desc())
    )


@overload
async def get_all_intakes_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[Intake]: ...


@overload
async def get_all_intakes_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: Literal[False] = False,
) -> list[Intake]: ...


@statement_or_result(first_only=False)
async def get_all_intakes_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: bool = False,
) -> SelectOfScalar[Intake] | list[Intake]:
    """
    Get all intakes for a client, ordered by created_at DESC (newest first).
    Returns all statuses, not just active ones.
    Eagerly loads the assessment_config relationship for displaying config info.
    """
    return (
        select(Intake)
        .options(
            selectinload(Intake.assessment_config),
        )
        .where(Intake.client_pseudo_id == client_pseudo_id)
        .order_by(Intake.created_at.desc())
    )


@overload
async def get_latest_completed_intake_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: Literal[True],
) -> SelectOfScalar[Intake]: ...


@overload
async def get_latest_completed_intake_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: Literal[False] = False,
) -> Intake | None: ...


@statement_or_result(first_only=True)
async def get_latest_completed_intake_by_client_pseudo_id(
    session: AsyncSession,
    client_pseudo_id: str,
    *,
    query_only: bool = False,
) -> SelectOfScalar[Intake] | Intake | None:
    """
    Get the latest completed intake for a client.
    Orders by created_at DESC to get the most recent one.
    Eagerly loads the address relationship for accessing client address.
    """
    return (
        select(Intake)
        .options(
            selectinload(Intake.address),
        )
        .where(
            and_(
                Intake.client_pseudo_id == client_pseudo_id,
                Intake.status == IntakeStatus.COMPLETED,
            )
        )
        .order_by(Intake.created_at.desc())
    )


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
    session: AsyncSession,
    client_pseudo_id: str,
    assessment_config_id: UUID,
    status: IntakeStatus | None = None,
) -> Intake:
    """Create a new intake record with assessment_config_id."""

    # Get client state from BigQuery
    client_record = Queries.get_client_by_pseudonymized_id_unsafe(client_pseudo_id)

    if not client_record:
        raise ValueError(
            f"No client record found for client_pseudo_id: {client_pseudo_id}"
        )

    # Get active assessment config for state
    assessment_config = await ConfigLoader.load_assessment_config(
        assessment_config_id, session
    )

    if not assessment_config:
        raise ValueError("No active assessment config found")

    intake = Intake(
        client_pseudo_id=client_pseudo_id,
        status=status if status else IntakeStatus.CREATED,
        internal_access=True,
        intake_type=assessment_config.intake.intake_type,
        assessment_config_id=assessment_config_id,
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
    """
    DEPRECATED: Use update_internal_access_by_intake_id instead.
    This function doesn't work correctly with multiple intakes per client.
    """
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


async def update_internal_access_by_intake_id(
    session: AsyncSession,
    intake_id: UUID,
    internal_access: bool,
) -> Intake | None:
    """Update the internal_access field for a specific intake."""
    intake = await get_intake_by_id(session, intake_id)

    if not intake:
        return None

    intake.internal_access = internal_access
    session.add(intake)

    await session.commit()
    await session.refresh(intake)

    return intake
