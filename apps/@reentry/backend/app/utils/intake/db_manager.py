"""
Manages persistent conversation data in the database.
This manager is focused solely on database operations and data persistence.
"""

import structlog
import traceback
from typing import Dict, List, Literal, Optional
from uuid import UUID

from sqlmodel import and_, select

from app.core.data_config.assessment_configs.assessment_config import (
    IntakeConfigConversation,
)
from app.core.db import get_session_async_manager
from app.crud.intake import (
    get_latest_active_conversation_intake,
    get_latest_message,
    get_latest_not_welcome_message,
)
from app.models.intake import Intake, IntakeMessage, IntakeMessageRole, IntakeStatus
from app.services.client_data.queries import ClientDataRecord

logger = structlog.get_logger(__name__)


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

    async def get_conversation_config(
        self, assessment_config_id: UUID
    ) -> IntakeConfigConversation:
        """
        Load assessment config by ID.

        Args:
            assessment_config_id: UUID of the assessment config to load

        Returns:
            AssessmentConfig object
        """
        from app.utils.config_loader import ConfigLoader

        async with await self._get_session() as session:
            return await ConfigLoader.load_conversation_config(
                assessment_config_id, session
            )

    async def get_latest_message(self, intake_id: UUID) -> Optional[IntakeMessage]:
        try:
            async with await self._get_session() as session:
                return await get_latest_message(session, intake_id)

        except Exception as e:
            logger.error(f"Error getting latest message: {e}")
            traceback.print_exc()
            return None

    async def get_latest_non_welcome_ai_message(
        self, intake_id: UUID
    ) -> Optional[IntakeMessage]:
        try:
            async with await self._get_session() as session:
                return await get_latest_not_welcome_message(session, intake_id)

        except Exception as e:
            logger.error(f"Error getting latest message: {e}")
            traceback.print_exc()
            return None

    async def store_message(
        self,
        intake_id: UUID,
        from_role: IntakeMessageRole,
        content: str,
    ) -> Optional[IntakeMessage]:
        """Store a message in the database."""
        async with await self._get_session() as session:
            try:
                result = await session.execute(
                    select(Intake).where(Intake.id == intake_id)
                )
                intake: Intake | None = result.scalar_one_or_none()

                if not intake or not intake.current_section:
                    return None
                # Allow saving messages for all statuses, including COMPLETED and ERROR
                # This ensures closing remarks and error messages can be saved
                current_section = intake.current_section

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

    async def complete_section(self, intake_id: UUID) -> str | None | Literal["error"]:
        """
        Marks the current section as complete and goes to next section.
        Returns the next section title (or special title COMPLETE)
        """
        try:
            async with await self._get_session() as session:
                result = await session.execute(
                    select(Intake).where(Intake.id == intake_id)
                )
                intake: Intake | None = result.scalar_one_or_none()
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

    async def get_talking_turn(self, intake_id: UUID) -> IntakeMessageRole | None:
        """
        Determine whose turn it is to talk based on the last message.
        If the last message was from the client, it's the caseworker's turn.
        If the last message was from the caseworker, it's the client's turn.
        If there are no messages, default to caseworker to start the conversation.

        Args:
            intake_id: Intake ID

        Returns:
            IntakeMessageRole: The role that should speak next, or None if there's an error
        """
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
            logger.error(f"Error determining talking turn for intake {intake_id}: {e}")
            return None

    async def all_messages_by_time(self, intake_id: UUID) -> list[IntakeMessage]:
        """
        Fetch all messages for a specific intake, sorted with most recent last.

        CRITICAL: Filters by intake_id to prevent history bleeding
        between multiple intakes for the same client.

        Args:
            intake_id (UUID): The specific intake ID to filter by

        Returns:
            List[IntakeMessage]: A list of IntakeMessage objects sorted by creation time
        """
        try:
            async with await self._get_session() as session:
                # CRITICAL: Filter by intake_id (not just client) to prevent history bleeding
                messages_stmt = (
                    select(IntakeMessage)
                    .where(IntakeMessage.intake_id == intake_id)
                    .order_by(IntakeMessage.created_at)
                )

                result = await session.execute(messages_stmt)
                messages = result.scalars().all()

                return messages

        except Exception as e:
            logger.error(f"Error fetching all messages for intake {intake_id}: {e}")
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
        Retrieves the latest CREATED or IN_PROGRESS conversation intake for the given client.

        When multiple intakes exist for a client, this returns the most recent conversation intake
        that is either CREATED or IN_PROGRESS, ordered by created_at DESC.

        Args:
            client_pseudo_id (str): The client's identifier
            token_from_url (Optional[str]): Optional token for authentication

        Returns:
            Optional[Intake]: The latest active conversation intake or None if not found
        """
        try:
            async with await self._get_session() as session:
                return await get_latest_active_conversation_intake(
                    session, client_pseudo_id, token_from_url
                )

        except Exception as e:
            logger.error(f"Error retrieving intake for client {client_pseudo_id}: {e}")
            return None

    async def update_intake_status(
        self, intake_id: UUID, status: IntakeStatus
    ) -> Optional[Intake]:
        try:
            async with await self._get_session() as session:
                result = await session.execute(
                    select(Intake).where(Intake.id == intake_id)
                )
                intake: Intake | None = result.scalar_one_or_none()
                if not intake:
                    logger.error("Intake not found")
                    return None
                return await intake.update_status(session, status)

        except Exception as e:
            logger.error(f"Error updating intake status for intake {intake_id}: {e}")
            return None

    async def is_internal_intake(self, intake_id: UUID) -> bool:
        try:
            async with await self._get_session() as session:
                query = select(Intake.internal_access).where(Intake.id == intake_id)

                result = await session.execute(query)
                internal_access = result.scalar_one_or_none()

                return bool(internal_access) if internal_access is not None else False

        except Exception as e:
            logger.error(
                f"Error checking if intake is internal for intake {intake_id}: {e}"
            )
            traceback.print_exc()
            return False

    async def has_address(self, intake_id: UUID) -> bool:
        """Check if intake has collected address"""
        try:
            async with await self._get_session() as session:
                result = await session.execute(
                    select(Intake).where(Intake.id == intake_id)
                )
                intake = result.scalar_one_or_none()
                if not intake:
                    return False

                return intake.has_address is not None

        except Exception as e:
            logger.error(f"Error checking address for intake {intake_id}: {e}")
            traceback.print_exc()
            return False

    async def has_survey(self, intake_id: UUID) -> bool:
        """Check if intake has collected survey"""
        try:
            async with await self._get_session() as session:
                result = await session.execute(
                    select(Intake).where(Intake.id == intake_id)
                )
                intake = result.scalar_one_or_none()
                if not intake:
                    return False

                return intake.has_survey is not None

        except Exception as e:
            logger.error(f"Error checking survey for intake {intake_id}: {e}")
            traceback.print_exc()
            return False

    async def get_section_titles(self, intake_id: UUID) -> list[str]:
        """
        Get section titles for an intake.

        LEGACY: Load from client_intake_sections table, if they exist
        NEW: If intake has assessment_config_id, load from YAML config.

        """
        try:
            async with await self._get_session() as session:
                result = await session.execute(
                    select(Intake).where(Intake.id == intake_id)
                )
                intake: Intake | None = result.scalar_one_or_none()
                if not intake:
                    raise ValueError("Intake not found")

                if intake.client_intake_sections:
                    # LEGACY: Get sections from client_intake_sections
                    logger.info(
                        "Getting section titles from client_intake_sections (legacy)"
                    )
                    return [cis.section_title for cis in intake.client_intake_sections]
                # NEW: Get sections from assessment config
                if intake.assessment_config_id:
                    try:
                        from app.utils.assessment_config_utils import (
                            get_all_section_titles_from_config,
                        )

                        conversation_config = await self.get_conversation_config(
                            intake.assessment_config_id
                        )
                        titles = get_all_section_titles_from_config(conversation_config)
                        logger.info(
                            f"Getting {len(titles)} section titles from assessment config"
                        )
                        return titles
                    except Exception as e:
                        logger.error(
                            f"Failed to load sections from assessment config: {e}"
                        )
                        raise

        except Exception as e:
            raise e
        # just for types
        return []
