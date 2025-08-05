"""
Socket.IO manager and event handlers for the intake system.
Coordinates real-time communication with the database as the single source of truth.
Is responsible for routing and saving user messages
"""

import asyncio
import logging
import traceback
from time import time
from typing import Dict, Optional

import socketio

from app.auth.intake.auth_client_user import verify_client_token
from app.core.config import settings
from app.models.intake import Intake, IntakeMessage, IntakeMessageRole, IntakeStatus
from app.routes.shared_models import IntakeMessageResponse
from app.services.client_data.queries import ClientDataRecord
from app.utils.intake.client_connection_manager import ClientConnectionManager
from app.utils.intake.constants import COMPLETION_SECTION
from app.utils.intake.conversation_graph import IntakeConversationGraph
from app.utils.intake.db_manager import DatabaseManager
from app.utils.intake.schemas import (
    AIMessageEvent,
    Auth,
    ClientContext,
    ConnectionAckContent,
    ConnectionAckEvent,
    HumanMessage,
    PongEvent,
    PongEventContent,
    ServerEvent,
)

logger = logging.getLogger(__name__)

# Initialize managers
mgr = socketio.AsyncRedisManager(f"{settings.REDIS_URL}", channel="intake_channel")

sio = socketio.AsyncServer(
    async_mode="asgi",
    client_manager=mgr,
    cors_allowed_origins=settings.ALLOWED_ORIGINS,
    # logger=True,
    engineio_logger=True,
    cookie={"name": "test", "httpOnly": False, "path": "/custom"},
)


class SocketIOManager:
    """
    Manages Socket.IO connections and real-time communication.

    Uses database as the single source of truth, with Redis
    for temporary state coordination.
    """

    def __init__(
        self,
        client_connection_manager: ClientConnectionManager,
        socketio_server: socketio.AsyncServer,
        database_manager: DatabaseManager,
    ) -> None:
        """
        Initialize the SocketIO manager.

        Args:
            redis_manager (RedisManager): Redis manager for coordination.
            socketio_server (socketio.AsyncServer): Socket.IO server.
            database_manager (DatabaseManager, optional): Database manager.
            session_manager (RedisSessionManager, optional): Session manager for client tracking.
        """
        self.client_connection_manager = client_connection_manager
        self.sio = socketio_server
        self.db_manager = database_manager
        self.conversation_graphs: Dict[str, IntakeConversationGraph | None] = {}
        self.pending_responses = {}

        self._register_event_handlers()

    def _register_event_handlers(self) -> None:
        """Register Socket.IO event handlers."""
        if not hasattr(self.sio, "on"):
            return

        try:
            self.sio.on("connect", self.handle_connect)
            self.sio.on("disconnect", self.handle_disconnect)
            self.sio.on("humanMessage", self.handle_client_response)
            self.sio.on("ping", self.handle_ping)

            logger.info("Socket.IO event handlers registered successfully")
        except Exception as e:
            traceback.print_exc()
            logger.error(f"\nError registering Socket.IO event handlers: {e}")

    async def handle_connect(
        self, sid: str, environ: Dict, auth: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Handle new client connections with proper registration and conversation state management.
        Determines whether to start a new conversation, resume an existing one, or refuse connection for a completed connection.
        Uses JWT token verification instead of direct client_id.

        Args:
            sid (str): Socket ID.
            environ (Dict): WSGI environment.
            auth (Dict, optional): Authentication data including JWT token.

        Returns:
            bool: Whether connection was accepted.
        """
        client_id = None
        try:
            if auth:
                parsedAuth = Auth(**auth)
                token = parsedAuth.auth_token

                if token:
                    # Verify the JWT token and get the client_id
                    (
                        success,
                        error_message,
                        extracted_client_id,
                    ) = await verify_client_token(token)

                    if not success:
                        logger.error(f"Token verification failed: {error_message}")
                        await self.send_event_sid(
                            sid,
                            ConnectionAckEvent(
                                content=ConnectionAckContent(
                                    accepted=False, error=error_message
                                )
                            ),
                        )
                        return False

                    client_id = extracted_client_id

                    if client_id:
                        user_agent = environ.get("HTTP_USER_AGENT", "Unknown")
                        client_data = self.db_manager.get_client(client_id)
                        intake = await self.db_manager.get_intake(
                            client_id, parsedAuth.token_from_url
                        )
                        if client_data and intake:
                            was_connected_elsewhere = (
                                await self.client_connection_manager.register_client(
                                    client_id, sid, user_agent
                                )
                            )
                            if was_connected_elsewhere:
                                # Client was connected elsewhere, clean up existing graph
                                await self.handle_disconnect_client(client_id)
                            if intake and intake.status != IntakeStatus.COMPLETED:
                                if intake.status == IntakeStatus.CREATED:
                                    intake = await self.db_manager.update_intake_status(
                                        client_id, IntakeStatus.IN_PROGRESS
                                    )

                                await self.send_event_client_id(
                                    client_id,
                                    ConnectionAckEvent(
                                        content=ConnectionAckContent(accepted=True)
                                    ),
                                )

                                asyncio.create_task(
                                    self.handle_conversation_state(
                                        intake, client_data, sid
                                    )
                                )
                                return True

            # Always acknowledge the connection via sid - this works even if token is invalid
            await self.send_event_sid(
                sid,
                ConnectionAckEvent(
                    content=ConnectionAckContent(
                        accepted=False, error="Authentication failed"
                    )
                ),
            )
            return False

        except Exception as e:
            traceback.print_exc()
            logger.error(
                f"\n\nError connecting client {client_id or 'unknown'}: {str(e)}"
            )
            return False

    async def wait_for_user_response(self, client_id: str, message: IntakeMessage):
        """
        Wait for a user response with timeout.

        Args:
            client_id: The client ID
            message: The message to send to the client
            timeout: Timeout in seconds (default: 30 minutes)

        Returns:
            The user's response

        Raises:
            TimeoutError: If the user doesn't respond within the timeout
        """
        try:
            # Clear any existing future for this client to prevent leaks
            if (
                client_id in self.pending_responses
                and not self.pending_responses[client_id].done()
            ):
                self.pending_responses[client_id].cancel()

            response_future = asyncio.get_running_loop().create_future()

            # Track the future
            self.pending_responses[client_id] = response_future

            # Log that we're waiting for a response
            logger.info(f"Waiting for response from client {client_id}")

            await self.send_event_client_id(
                client_id,
                AIMessageEvent(content=IntakeMessageResponse(**message.model_dump())),
            )

            # Wait for response with timeout
            response = await asyncio.wait_for(response_future, 1800)

            logger.info(f"Received response from client {client_id}")
            return response

        except asyncio.TimeoutError:
            logger.warning(f"Timeout waiting for response from client {client_id}")
            await self.handle_disconnect_client(client_id)
            await self.client_connection_manager.disconnect_client_id(client_id)

        except asyncio.CancelledError:
            logger.info(f"Wait for user response cancelled for client {client_id}")
            raise
        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error waiting for user response: {e}")
            raise
        finally:
            # Remove future from pending responses
            if client_id in self.pending_responses:
                # Don't try to cancel if it's already done to avoid warnings
                if not self.pending_responses[client_id].done():
                    self.pending_responses[client_id].cancel()
                del self.pending_responses[client_id]

    async def _init_and_run_graph(self, intake: Intake, client: ClientDataRecord, sid):
        client_id = intake.client_id
        # Create a client context with the client information
        # Format the full structured name as a string
        formatted_name = client.full_name.formatted_full_name()

        client_context = ClientContext(
            client_id=client_id,
            client_name=formatted_name,
        )

        # Create conversation graph with the intake from database
        graph = IntakeConversationGraph(
            session=client_context,
            db_manager=self.db_manager,
            wait_for_user_response=self.wait_for_user_response,
            send_message=self.send_event_client_id,
        )

        # Pass the client sections (which have revision data) instead of extracted sections
        # Initialize it asynchronously
        await graph.initialize(intake, intake.client_intake_sections)

        # Store the graph for future reference
        self.conversation_graphs[client_id] = graph

        await graph.run_assessment()

    async def handle_conversation_state(
        self, intake: Intake, client: ClientDataRecord, sid: str
    ) -> None:
        """
        Determines whether to start a new conversation, resume an existing one, or show completion message.

        Args:
            intake (Intake): Intake assessment data from database
            client_data (ClientDataRecord): Client data from BigQuery
            sid (str): Socket ID for direct messaging
        """

        try:
            client_id = intake.client_id

            # Don't create graphs for completed intakes
            if (
                intake.status == IntakeStatus.COMPLETED
                or intake.current_section == COMPLETION_SECTION
            ):
                logger.info(
                    f"Intake for client {client_id} is already completed, not creating a graph"
                )
                return

            # Check if we already have a conversation graph for this client
            if client_id in self.conversation_graphs:
                logger.info(f"Already have a conversation graph for client {client_id}")
                # If we do, return - no need to create a new one
                return

            # For all other statuses (IN_PROGRESS, PAUSED, etc.), resume the conversation
            logger.info(
                f"Resuming conversation for client {client_id} with status {intake.status}"
            )

            await self._init_and_run_graph(intake, client, sid)

            return

        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error handling conversation state: {e}")
            return

    async def handle_disconnect_client(self, client_id) -> None:
        logger.info(f"Cleaning up resources for disconnected client {client_id}")

        # Safely delete items from dictionaries only if they exist
        if client_id in self.conversation_graphs:
            del self.conversation_graphs[client_id]

        if client_id in self.pending_responses:
            # Cancel the pending future to prevent hanging
            if not self.pending_responses[client_id].done():
                self.pending_responses[client_id].cancel()
                del self.pending_responses[client_id]

    async def handle_disconnect(self, sid: str) -> None:
        """
        Handle client disconnection and perform necessary cleanup.

        Args:
            sid (str): The socket ID that disconnected.
        """
        try:
            # Use our improved method for getting client_id
            client_id = await self.client_connection_manager.get_client_id_by_sid(sid)

            # Clean up in client connection manager
            await self.client_connection_manager.disconnect_client(sid)

            if client_id:
                await self.handle_disconnect_client(client_id)
            else:
                logger.warning(f"No client ID found for disconnecting socket {sid}")

        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error handling disconnect for {sid}: {e}")

    async def handle_client_response(
        self, sid: str, data
    ) -> None | IntakeMessageResponse:
        """
        Handle client message responses and complete pending response futures.

        Args:
            sid (str): Socket ID.
            data (Dict): Response data.
        """

        try:
            parsed_message = HumanMessage(content=data)

            # Get client_id using the more robust client_connection_manager method
            client_id = await self.client_connection_manager.get_client_id_by_sid(sid)
            if not client_id:
                logger.warning(f"No client ID found for socket ID {sid}")
                return

            content = parsed_message.content
            if not content:
                logger.debug(f"Empty content received from sid {sid}")
                return

            # If there's a pending response waiting, fulfill it
            pending_response = self.pending_responses.get(client_id)
            if pending_response and not pending_response.done():
                message = await self.db_manager.store_message(
                    from_role=IntakeMessageRole.CLIENT,
                    content=content,
                    client_id=client_id,
                )
                if not message:
                    logger.warning(f"Error saving message for client {client_id}")
                    return

                logger.info(
                    f"Setting result for pending response for client {client_id}"
                )
                pending_response.set_result(content)
                # Return the message for acknowledgment
                # Create the IntakeMessageResponse and then model_dump it
                response = IntakeMessageResponse(**message.model_dump())
                serialized = response.model_dump(mode="json")
                logger.info(f"Returning ack response: {serialized}")
                return serialized

            # If we're not expecting a response, check if it's the caseworker's turn to talk
            if (
                await self.db_manager.get_talking_turn(client_id)
            ) == IntakeMessageRole.CASEWORKER:
                logger.debug(
                    f"Ignoring message - it's the caseworker's turn for client {client_id}"
                )
                return

            # If we get here, we're handling an unexpected or out-of-sequence message
            intake = await self.db_manager.get_intake(client_id)
            if not intake:
                logger.warning(f"No intake found for client {client_id}")
                return

            if intake.status != IntakeStatus.IN_PROGRESS:
                logger.info(
                    f"Intake for client {client_id} is not in progress (status: {intake.status})"
                )
                return

            # Store the message - it might be valid but our conversation state is out of sync
            logger.info(
                f"Storing unexpected message for client {client_id} and reinitializing graph"
            )
            client_data = self.db_manager.get_client(client_id)
            if not client_data:
                logger.warning(f"No client data found for client {client_id}")
                return

            message = await self.db_manager.store_message(
                from_role=IntakeMessageRole.CLIENT,
                content=content,
                client_id=client_id,
            )
            if not message:
                logger.warning(f"Error saving message for client {client_id}")
                return

            # Clear any existing graph for this client and start fresh
            if client_id in self.conversation_graphs:
                del self.conversation_graphs[client_id]

            # Reinitialize the conversation graph
            asyncio.create_task(self._init_and_run_graph(intake, client_data, sid))

            # Return the message for acknowledgment
            # Create the IntakeMessageResponse and then model_dump it
            response = IntakeMessageResponse(**message.model_dump())
            serialized = response.model_dump(mode="json")
            logger.info(f"Returning ack response for unexpected message: {serialized}")
            return serialized

        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error handling client response: {e}")

    async def send_event_sid(self, sid: str, event: ServerEvent):
        # Use model_dump with mode="json" to ensure proper serialization
        content_json = event.content.model_dump(mode="json") if event.content else None
        await self.sio.emit(event.type, content_json, room=sid)

    async def send_event_client_id(self, client_id: str, event: ServerEvent):
        # Use model_dump with mode="json" to ensure proper serialization
        content_json = event.content.model_dump(mode="json") if event.content else None
        await self.sio.emit(event.type, content_json, room=f"client_{client_id}")

    async def handle_ping(self, sid: str, data: Dict) -> None:
        """
        Respond to a ping event from the client.

        Args:
            sid (str): Socket ID.
            data (Dict): Ping data.
        """
        print(data)
        try:
            await self.send_event_sid(
                sid, PongEvent(content=PongEventContent(timestamp=int(time())))
            )
        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error handling ping: {e}")


socket_app = socketio.ASGIApp(socketio_server=sio)


async def intake_setup_background_tasks(redis):
    """Handle application startup tasks."""
    try:
        client_connection_manager = ClientConnectionManager(redis, sio)
        db_manager = DatabaseManager()

        socketio_manager = SocketIOManager(
            socketio_server=sio,
            database_manager=db_manager,
            client_connection_manager=client_connection_manager,
        )
        print("setup socketio")

        return socketio_manager
    except Exception as e:
        logger.error(f"Error during application startup: {e}")
        traceback.print_exc()
