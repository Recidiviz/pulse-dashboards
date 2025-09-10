"""
Manages persistent conversation data in the database.
This manager is focused solely on database operations and data persistence.
"""

import logging
import traceback
from typing import Dict, List, Literal, Optional
from uuid import UUID

from sqlmodel import and_, select

from app.core.db import get_session_async_manager
from app.crud.intake import (
    get_current_section_title,
    get_intake_by_client_pseudo_id,
    get_latest_message,
    get_latest_not_welcome_message,
)
from app.models.intake import (
    Intake,
    IntakeMessage,
    IntakeMessageRole,
)
from app.services.client_data.queries import ClientDataRecord
from app.utils.intake.constants import IntakeStatus

logger = logging.getLogger(__name__)


class DatabaseManager:
    def __init__(self, session=None) -> None:
        """
        Initialize the database manager.

        Args:
            session: Optional SQLAlchemy session to use for testing.
                    If provided, this will be used for all operations.
        """
        self.test_session = session

    async def _get_session(self):
        """
        Gets a session context manager either from the test session
        or by creating a new session.

        Returns:
            An async context manager that yields a database session.
        """
        if self.test_session:
            # Return a simple context manager that yields the test session
            class TestSessionContext:
                def __init__(self, session):
                    self.session = session

                async def __aenter__(self):
                    return self.session

                async def __aexit__(self, exc_type, exc_val, exc_tb):
                    # Don't close the test session as it's managed elsewhere
                    pass

            return TestSessionContext(self.test_session)
        else:
            # Return the regular session manager
            return get_session_async_manager()

    async def get_latest_message(
        self, client_pseudo_id: str
    ) -> Optional[IntakeMessage]:
        try:
            # First get the intake ID using our existing method
            intake_id = await self.get_intake_id_by_client_pseudo_id(client_pseudo_id)
            if not intake_id:
                logger.error(f"No intake found for client {client_pseudo_id}")
                return None

            async with await self._get_session() as session:
                # Properly await the get_latest_message coroutine
                return await get_latest_message(session, intake_id)

        except Exception as e:
            logger.error(f"Error getting latest message: {e}")
            traceback.print_exc()
            return None

    async def get_latest_non_welcome_ai_message(
        self, client_pseudo_id: str
    ) -> Optional[IntakeMessage]:
        try:
            # First get the intake ID using our existing method
            intake_id = await self.get_intake_id_by_client_pseudo_id(client_pseudo_id)
            if not intake_id:
                logger.error(f"No intake found for client {client_pseudo_id}")
                return None

            async with await self._get_session() as session:
                # Properly await the get_latest_message coroutine
                return await get_latest_not_welcome_message(session, intake_id)

        except Exception as e:
            logger.error(f"Error getting latest message: {e}")
            traceback.print_exc()
            return None

    async def store_message(
        self,
        from_role: IntakeMessageRole,
        content: str,
        client_pseudo_id: str,
    ) -> Optional[IntakeMessage]:
        """Store a message in the database."""
        async with await self._get_session() as session:
            try:
                intake: Intake | None = await get_intake_by_client_pseudo_id(
                    session, client_pseudo_id
                )

                if not intake:
                    return None
                # Allow saving messages for all statuses, including COMPLETED and ERROR
                # This ensures closing remarks and error messages can be saved
                current_section = intake.current_section
                if not current_section:
                    # For completed intakes or when current_section is None, we use a string value
                    # Either get the last active section or use a default value
                    try:
                        current_section = await get_current_section_title(
                            session, intake.id
                        )
                    except Exception as e:
                        # Re-raise the error after logging
                        logger.error(f"Error getting current section title: {e}")
                        raise

                message = IntakeMessage(
                    intake_id=intake.id,
                    from_role=from_role,
                    content=content,
                    section=current_section,
                )

                session.add(message)
                await session.commit()
                await session.refresh(message)

                return message
            except Exception as e:
                traceback.print_exc()
                logger.error(f"Error storing message: {e}")
                return None

    async def complete_section(
        self, client_pseudo_id: str
    ) -> str | None | Literal["error"]:
        """
        Marks the current section as complete and goes to next section.
        Returns the next section title (or special title COMPLETE)
        """
        try:
            async with await self._get_session() as session:
                intake: Intake | None = await get_intake_by_client_pseudo_id(
                    session, client_pseudo_id
                )
                if not intake:
                    return "error"
                intake = await intake.next_section(session)

                return intake.current_section

        except Exception as e:
            logger.error(f"Error completing section: {e}")
            return "error"

    async def get_section_messages(
        self, intake_id: UUID, section_title: str
    ) -> List[Dict]:
        """Get all messages for a specific section of an intake."""
        try:
            async with await self._get_session() as session:
                messages_stmt = (
                    select(IntakeMessage)
                    .where(
                        and_(
                            IntakeMessage.intake_id == intake_id,
                            IntakeMessage.section == section_title,
                        )
                    )
                    .order_by(IntakeMessage.created_at)
                )

                result = await session.execute(messages_stmt)
                messages = result.scalars().all()

                formatted_messages = [
                    {
                        "id": str(message.id),
                        "role": message.from_role.value,
                        "content": message.content,
                        "section": message.section,
                        "timestamp": message.created_at.isoformat(),
                    }
                    for message in messages
                ]

                return formatted_messages
        except Exception as e:
            logger.error(f"Error getting section messages: {e}")
            return []

    async def get_intake_id_by_client_pseudo_id(
        self, client_pseudo_id: str
    ) -> Optional[UUID]:
        try:
            async with await self._get_session() as session:
                query = select(Intake.id).where(
                    Intake.client_pseudo_id == str(client_pseudo_id)
                )

                result = await session.execute(query)
                intake_id = result.scalar_one_or_none()

                return intake_id

        except Exception as e:
            logger.error(f"Error retrieving intake for client {client_pseudo_id}: {e}")
            return None

    async def get_talking_turn(self, client_pseudo_id: str) -> IntakeMessageRole | None:
        """
        Determine whose turn it is to talk based on the last message.
        If the last message was from the client, it's the caseworker's turn.
        If the last message was from the caseworker, it's the client's turn.
        If there are no messages, default to caseworker to start the conversation.

        Args:
            client_pseudo_id: Client identifier

        Returns:
            IntakeMessageRole: The role that should speak next, or None if there's an error
        """
        intake_id = await self.get_intake_id_by_client_pseudo_id(client_pseudo_id)
        if not intake_id:
            logger.error(f"No intake found for client {client_pseudo_id}")
            return None

        try:
            from app.crud.intake import get_latest_message

            async with await self._get_session() as session:
                latest_message = await get_latest_message(session, intake_id)

                if not latest_message:
                    # If there are no messages yet, caseworker should start
                    return IntakeMessageRole.CASEWORKER

                if latest_message.from_role == IntakeMessageRole.CLIENT.value:
                    return IntakeMessageRole.CASEWORKER
                else:
                    return IntakeMessageRole.CLIENT
        except Exception as e:
            logger.error(
                f"Error determining talking turn for client {client_pseudo_id}: {e}"
            )
            return None

    async def all_messages_by_time(self, client_pseudo_id: str) -> list[IntakeMessage]:
        """
        Fetch all messages for a client, sorted with most recent last.

        Args:
            client_pseudo_id (str): The client's identifier

        Returns:
            List[IntakeMessage]: A list of IntakeMessage objects sorted by creation time
        """
        try:
            intake_id = await self.get_intake_id_by_client_pseudo_id(client_pseudo_id)

            if not intake_id:
                logger.error(f"No intake found for client {client_pseudo_id}")
                return []

            async with await self._get_session() as session:
                messages_stmt = (
                    select(IntakeMessage)
                    .where(IntakeMessage.intake_id == intake_id)
                    .order_by(IntakeMessage.created_at)
                )

                result = await session.execute(messages_stmt)
                messages = result.scalars().all()

                return messages

        except Exception as e:
            logger.error(
                f"Error fetching all messages for client {client_pseudo_id}: {e}"
            )
            return []

    def get_client(self, client_pseudo_id: str) -> Optional[ClientDataRecord]:
        """
        Loads client data from BigQuery for the given client ID.

        Args:
            client_pseudo_id (str): The client's identifier

        Returns:
            Optional[ClientDataRecord]: The client data from BigQuery or None if not found
        """
        try:
            from app.services.client_data.queries import Queries

            return Queries.get_client_by_pseudonymized_id_unsafe(client_pseudo_id)

        except Exception as e:
            logger.error(
                f"Error retrieving client data from BigQuery for client {client_pseudo_id}: {e}"
            )
            return None

    async def get_intake(
        self, client_pseudo_id: str, token_from_url: Optional[str] = None
    ) -> Optional[Intake]:
        """
        Retrieves the Intake model with associated sections for the given client ID.

        Args:
            client_pseudo_id (str): The client's identifier

        Returns:
            Optional[Intake]: The Intake model with associated resources or None if not found
        """
        try:
            async with await self._get_session() as session:
                return await get_intake_by_client_pseudo_id(
                    session, client_pseudo_id, token_from_url
                )

        except Exception as e:
            logger.error(f"Error retrieving intake for client {client_pseudo_id}: {e}")
            return None

    async def update_intake_status(
        self, client_pseudo_id: str, status: IntakeStatus
    ) -> Optional[Intake]:
        try:
            async with await self._get_session() as session:
                intake: Intake | None = await get_intake_by_client_pseudo_id(
                    session, client_pseudo_id
                )
                if not intake:
                    logger.error("Intake not found")
                    return None
                return await intake.update_status(session, status)

        except Exception as e:
            logger.error(f"Error retrieving intake for client {client_pseudo_id}: {e}")
            return None

    async def is_internal_intake(self, client_pseudo_id: str) -> bool:
        try:
            async with await self._get_session() as session:
                query = select(Intake.internal_access).where(
                    Intake.client_pseudo_id == str(client_pseudo_id)
                )

                result = await session.execute(query)
                internal_access = result.scalar_one_or_none()

                return bool(internal_access) if internal_access is not None else False

        except Exception as e:
            logger.error(
                f"Error checking if intake is internal for client {client_pseudo_id}: {e}"
            )
            traceback.print_exc()
            return False

    async def has_address(self, client_pseudo_id: str) -> bool:
        """Check if intake has collected address"""
        try:
            async with await self._get_session() as session:
                # First get the intake
                intake = await get_intake_by_client_pseudo_id(session, client_pseudo_id)
                if not intake:
                    return False

                return intake.has_address is not None

        except Exception as e:
            logger.error(f"Error checking address for client {client_pseudo_id}: {e}")
            traceback.print_exc()
            return False

    async def get_section_titles(self, client_pseudo_id: str) -> list[str]:
        try:
            async with await self._get_session() as session:
                intake: Intake | None = await get_intake_by_client_pseudo_id(
                    session, client_pseudo_id
                )
                if intake:
                    return [cis.section_title for cis in intake.client_intake_sections]
                else:
                    raise ValueError("Intake not found")
        except Exception as e:
            raise e
