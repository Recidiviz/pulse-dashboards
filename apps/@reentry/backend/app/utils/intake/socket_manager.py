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
import structlog

from app.auth.intake.auth_client_user import verify_client_token
from app.auth.intake.utils import decode_jwt_token
from app.core.config import create_model_from_config, settings
from app.models.intake import (
    COMPLETION_SECTION,
    Intake,
    IntakeMessage,
    IntakeMessageRole,
    IntakeStatus,
)
from app.routes.shared_models import IntakeMessageResponse
from app.services.client_data.types import ClientDataRecord
from app.utils.intake.client_connection_manager import ClientConnectionManager
from app.utils.intake.conversation_graph import IntakeConversationGraph
from app.utils.intake.db_manager import DatabaseManager
from app.utils.intake.guardrails import HARD_STOP_GUARDRAIL_TYPES, run_guardrails
from app.utils.intake.schemas import (
    AIMessageEvent,
    Auth,
    ClientContext,
    ConnectionAckContent,
    ConnectionAckEvent,
    ForceDisconnectEvent,
    GuardrailTriggeredEvent,
    HumanMessage,
    PongEvent,
    PongEventContent,
    ServerEvent,
    TokenExpiredEvent,
)
from app.utils.slack import send_guardrail_alert

logger = structlog.get_logger(__name__)

# Initialize managers
mgr = socketio.AsyncRedisManager(f"{settings.REDIS_URL}", channel="intake_channel")

# Create standard library loggers for socketio/engineio
# These logs flow through ProcessorFormatter (configured in logging_config.py),
socketio_logger = logging.getLogger("socketio.server")
engineio_logger = logging.getLogger("engineio.server")

sio = socketio.AsyncServer(
    async_mode="asgi",
    client_manager=mgr,
    cors_allowed_origins=[],  # CORS handled by FastAPI CORSMiddleware in main.py
    logger=socketio_logger,
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
        self.state_codes: Dict[str, str] = {}

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
        Uses JWT token verification instead of direct client_pseudo_id.

        Args:
            sid (str): Socket ID.
            environ (Dict): WSGI environment.
            auth (Dict, optional): Authentication data including JWT token.

        Returns:
            bool: Whether connection was accepted.
        """
        client_pseudo_id = None
        try:
            # Log connection attempt with headers and auth info
            headers = {
                key: value
                for key, value in environ.items()
                if key.startswith("HTTP_")
                or key in ["REQUEST_METHOD", "PATH_INFO", "QUERY_STRING"]
            }
            logger.info(
                "WebSocket connection attempt",
                extra={
                    "sid": sid,
                    "headers": headers,
                    "auth_present": auth is not None,
                    "auth_token_present": (
                        bool(auth and auth.get("auth_token")) if auth else False
                    ),
                    "auth_token_length": (
                        len(auth.get("auth_token", ""))
                        if auth and auth.get("auth_token")
                        else 0
                    ),
                    "token_from_url_present": (
                        bool(auth and auth.get("token_from_url")) if auth else False
                    ),
                    "remote_addr": environ.get("REMOTE_ADDR"),
                    "user_agent": environ.get("HTTP_USER_AGENT"),
                    "origin": environ.get("HTTP_ORIGIN"),
                },
            )

            if auth:
                parsedAuth = Auth(**auth)
                token = parsedAuth.auth_token

                if token:
                    # Verify the JWT token and get the client_pseudo_id
                    (
                        success,
                        error_message,
                        extracted_client_pseudo_id,
                    ) = await verify_client_token(token)

                    if not success:
                        logger.error(f"Token verification failed: {error_message}")
                        raise ConnectionRefusedError({"message": error_message})

                    client_pseudo_id = extracted_client_pseudo_id
                    structlog.contextvars.bind_contextvars(
                        client_pseudo_id=client_pseudo_id
                    )

                    if client_pseudo_id:
                        user_agent = environ.get("HTTP_USER_AGENT", "Unknown")
                        client_data = self.db_manager.get_client(client_pseudo_id)
                        intake = await self.db_manager.get_intake(
                            client_pseudo_id, parsedAuth.token_from_url
                        )
                        if client_data and intake:
                            token_exp = decode_jwt_token(token).get("exp", None)
                            was_connected_elsewhere = (
                                await self.client_connection_manager.register_client(
                                    client_pseudo_id, sid, user_agent, exp=token_exp
                                )
                            )
                            asyncio.create_task(
                                self._schedule_token_expiry(sid, token_exp)
                            )
                            if was_connected_elsewhere:
                                # Client was connected elsewhere — graph keeps running,
                                # handle_conversation_state will reattach to it.
                                logger.info(
                                    f"Client {client_pseudo_id} reconnected (was connected elsewhere); "
                                    "reattaching to existing graph"
                                )

                            if intake and intake.locked:
                                logger.info(
                                    "Rejecting connection — intake is locked",
                                    intake_id=str(intake.id),
                                    locked_reason=intake.locked_reason,
                                )
                                await self.send_event_client_pseudo_id(
                                    client_pseudo_id,
                                    ConnectionAckEvent(
                                        content=ConnectionAckContent(
                                            accepted=False,
                                            status=intake.status,
                                            locked=True,
                                        )
                                    ),
                                )
                                raise ConnectionRefusedError(
                                    {"message": "Intake is locked"}
                                )

                            if intake and intake.status == IntakeStatus.COMPLETED:
                                raise ConnectionRefusedError(
                                    {"message": "Intake is already completed"}
                                )

                            if intake and intake.status != IntakeStatus.COMPLETED:
                                if intake.status == IntakeStatus.CREATED:
                                    intake = await self.db_manager.update_intake_status(
                                        intake.id, IntakeStatus.IN_PROGRESS
                                    )

                                await self.send_event_client_pseudo_id(
                                    client_pseudo_id,
                                    ConnectionAckEvent(
                                        content=ConnectionAckContent(
                                            accepted=True, status=intake.status
                                        )
                                    ),
                                )

                                logger.info(
                                    "WebSocket connection accepted",
                                    extra={
                                        "client_pseudo_id": client_pseudo_id,
                                        "sid": sid,
                                        "intake_status": intake.status,
                                        "was_connected_elsewhere": was_connected_elsewhere,
                                        "origin": environ.get("HTTP_ORIGIN"),
                                    },
                                )

                                if (
                                    was_connected_elsewhere
                                    and client_pseudo_id in self.conversation_graphs
                                ):
                                    # Graph is still running — reattach directly without
                                    # creating a new task.
                                    await self._handle_client_reconnect(
                                        client_pseudo_id
                                    )
                                else:
                                    asyncio.create_task(
                                        self.handle_conversation_state(
                                            intake, client_data, sid
                                        )
                                    )

                                return True

            logger.warning(
                f"Rejecting connection sid={sid} client_pseudo_id={client_pseudo_id or 'unknown'} auth_token_present={bool(auth and auth.get('auth_token'))}"
            )
            raise ConnectionRefusedError({"message": "Authentication failed"})

        except ConnectionRefusedError:
            raise
        except Exception as e:
            traceback.print_exc()
            logger.error(
                "Exception during WebSocket connection handling",
                extra={
                    "client_pseudo_id": client_pseudo_id or "unknown",
                    "sid": sid,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "auth_present": auth is not None,
                    "origin": environ.get("HTTP_ORIGIN"),
                    "headers": headers,
                },
                exc_info=True,
            )
            return False

    def _register_response_future(self, client_pseudo_id: str) -> asyncio.Future:
        if (
            client_pseudo_id in self.pending_responses
            and not self.pending_responses[client_pseudo_id].done()
        ):
            self.pending_responses[client_pseudo_id].cancel()
        future = asyncio.get_running_loop().create_future()
        self.pending_responses[client_pseudo_id] = future
        return future

    async def wait_for_next_response(self, client_pseudo_id: str, timeout: int = 1800):
        """
        Register a response slot and wait — without re-sending any message.
        Use this after a soft-stop guardrail, where the AI question is already
        visible in the chat and resending it would create a duplicate.
        """
        try:
            logger.info(f"Waiting for response from client {client_pseudo_id}")
            future = self._register_response_future(client_pseudo_id)
            response = await asyncio.wait_for(future, timeout)
            logger.info(f"Received response from client {client_pseudo_id}")
            return response
        except asyncio.TimeoutError:
            logger.warning(
                f"Timeout waiting for response from client {client_pseudo_id}"
            )
            await self.handle_disconnect_client(client_pseudo_id)
            await self.client_connection_manager.disconnect_client_pseudo_id(
                client_pseudo_id
            )
        except asyncio.CancelledError:
            logger.info(
                f"Wait for user response cancelled for client {client_pseudo_id}"
            )
            raise
        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error waiting for user response: {e}")
        finally:
            if client_pseudo_id in self.pending_responses:
                if not self.pending_responses[client_pseudo_id].done():
                    self.pending_responses[client_pseudo_id].cancel()
                del self.pending_responses[client_pseudo_id]

    async def wait_for_user_response(
        self, client_pseudo_id: str, message: IntakeMessage, timeout: int = 1800
    ):
        """
        Send an AI message to the client, then register a response slot and wait.
        Use this for normal conversation turns where the question needs to be delivered.
        """
        try:
            logger.info(f"Waiting for response from client {client_pseudo_id}")
            future = self._register_response_future(client_pseudo_id)

            await self.send_event_client_pseudo_id(
                client_pseudo_id,
                AIMessageEvent(
                    content=IntakeMessageResponse(
                        **message.model_dump(), requires_response=True
                    )
                ),
            )

            # Wait for response with timeout
            response = await asyncio.wait_for(future, timeout)

            logger.info(f"Received response from client {client_pseudo_id}")
            return response

        except asyncio.TimeoutError:
            logger.warning(
                f"Timeout waiting for response from client {client_pseudo_id}"
            )
            await self.handle_disconnect_client(client_pseudo_id)
            await self.client_connection_manager.disconnect_client_pseudo_id(
                client_pseudo_id
            )

        except asyncio.CancelledError:
            logger.info(
                f"Wait for user response cancelled for client {client_pseudo_id}"
            )
            raise
        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error waiting for user response: {e}")
            raise
        finally:
            # Remove future from pending responses
            if client_pseudo_id in self.pending_responses:
                # Don't try to cancel if it's already done to avoid warnings
                if not self.pending_responses[client_pseudo_id].done():
                    self.pending_responses[client_pseudo_id].cancel()
                del self.pending_responses[client_pseudo_id]

    async def _init_and_run_graph(self, intake: Intake, client: ClientDataRecord, sid):
        client_pseudo_id = intake.client_pseudo_id
        structlog.contextvars.bind_contextvars(client_pseudo_id=client_pseudo_id)
        # Create a client context with the client information
        # Format the full structured name as a string
        formatted_name = client.full_name.formatted_full_name()

        client_context = ClientContext(
            client_pseudo_id=client_pseudo_id,
            client_name=formatted_name,
        )

        # Get the assessment config to extract the model configuration
        assessment_config = await self.db_manager.get_conversation_config(
            intake.assessment_config_id
        )

        # Get the model from assessment config
        model = create_model_from_config(
            assessment_config.chat_model.provider,
            assessment_config.chat_model.name,
            assessment_config.chat_model.version,
        )

        # Create conversation graph with the intake from database
        graph = IntakeConversationGraph(
            session=client_context,
            db_manager=self.db_manager,
            wait_for_user_response=self.wait_for_user_response,
            wait_for_next_response=self.wait_for_next_response,
            send_message=self.send_event_client_pseudo_id,
            model=model,
        )

        # Pass the client sections (which have revision data) instead of extracted sections
        # Initialize it asynchronously
        await graph.initialize(intake)

        # Store the graph and state_code for future reference
        self.conversation_graphs[client_pseudo_id] = graph
        self.state_codes[client_pseudo_id] = (
            intake.assessment_config.state_code if intake.assessment_config else ""
        )

        try:
            await graph.run_assessment()
        finally:
            # Cleanup when done (success, error, or cancellation)
            logger.info(f"Graph execution finished for {client_pseudo_id}")
            self.state_codes.pop(client_pseudo_id, None)
            if client_pseudo_id in self.conversation_graphs:
                if self.conversation_graphs[client_pseudo_id] is graph:
                    del self.conversation_graphs[client_pseudo_id]
                else:
                    logger.info(
                        f"Skipping conversation_graphs cleanup - newer graph exists for {client_pseudo_id}"
                    )

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
        client_pseudo_id = intake.client_pseudo_id

        try:
            # Don't create graphs for completed intakes
            if (
                intake.status == IntakeStatus.COMPLETED
                or intake.current_section == COMPLETION_SECTION
            ):
                logger.info(
                    f"Intake for client {client_pseudo_id} is already completed, not creating a graph"
                )
                return

            # Check if we already have a conversation graph for this client
            if client_pseudo_id in self.conversation_graphs:
                logger.info(
                    f"Reattaching to existing graph for client {client_pseudo_id}"
                )
                await self._handle_client_reconnect(client_pseudo_id)
                return

            # For all other statuses (IN_PROGRESS, PAUSED, etc.), resume the conversation
            logger.info(
                f"Resuming conversation for client {client_pseudo_id} with status {intake.status}"
            )

            await self._init_and_run_graph(intake, client, sid)

            return

        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error handling conversation state: {e}")

    async def _handle_client_reconnect(self, client_pseudo_id: str) -> None:
        """
        Handle reconnection to an existing graph.

        If the graph is already waiting for user input (pending future exists),
        re-deliver the last AI question so the client knows what to respond to.
        If the graph is still running an LLM call (no pending future yet), the
        client will receive messages via the room automatically once the graph emits.
        """
        pending = self.pending_responses.get(client_pseudo_id)
        if pending and not pending.done():
            # Graph is blocked in wait_for_user_response — re-deliver the last question
            intake = await self.db_manager.get_intake(client_pseudo_id)
            if intake:
                latest_message = (
                    await self.db_manager.get_latest_non_welcome_ai_message(intake.id)
                )
                if latest_message:
                    await self.send_event_client_pseudo_id(
                        client_pseudo_id,
                        AIMessageEvent(
                            content=IntakeMessageResponse(
                                **latest_message.model_dump(), requires_response=True
                            )
                        ),
                    )
                    logger.info(
                        f"Re-delivered pending question to reconnected client {client_pseudo_id}"
                    )
        else:
            # Graph is still processing (LLM call in progress). Once it finishes,
            # it will emit to the room and reach the newly registered socket automatically.
            logger.info(
                f"Client {client_pseudo_id} reconnected while graph is processing; "
                "messages will arrive via room"
            )

    async def handle_disconnect_client(self, client_pseudo_id) -> None:
        logger.info(f"Cleaning up resources for disconnected client {client_pseudo_id}")

        if client_pseudo_id in self.pending_responses:
            # Cancel the pending future to prevent hanging
            if not self.pending_responses[client_pseudo_id].done():
                self.pending_responses[client_pseudo_id].cancel()
                del self.pending_responses[client_pseudo_id]

        # Safely delete graph reference
        if client_pseudo_id in self.conversation_graphs:
            del self.conversation_graphs[client_pseudo_id]

    async def _schedule_token_expiry(self, sid: str, exp: Optional[int]) -> None:
        """
        Sleep until the token expires, then emit tokenExpired and disconnect.
        If exp is None (token had no exp claim), falls back to the configured
        BACKEND_ISSUED_INTAKE_TOKEN_EXPIRY_SECONDS setting.
        """
        try:
            if exp:
                secs_remaining = exp - time()
            else:
                secs_remaining = settings.BACKEND_ISSUED_INTAKE_TOKEN_EXPIRY_SECONDS
            logger.info(
                f"Token expiry timer set for sid {sid}, fires in {secs_remaining:.1f}s"
            )
            if secs_remaining > 0:
                await asyncio.sleep(secs_remaining)
            try:
                session = await self.sio.get_session(sid)
            except Exception:
                logger.info(f"Token expiry fired for sid {sid} but session not found.")
                return
            if session:
                logger.info(f"Token expired for sid {sid}, disconnecting")
                await self.sio.emit(TokenExpiredEvent().type, {}, room=sid)
                await self.sio.disconnect(sid)
            else:
                logger.info(f"Token expiry fired for sid {sid} but session is empty.")
        except asyncio.CancelledError:
            logger.info(f"Token expiry task cancelled for sid {sid}")
        except Exception as e:
            logger.error(f"Error in token expiry task for sid {sid}: {e}")

    async def handle_disconnect(self, sid: str) -> None:
        """
        Handle client disconnection and perform necessary cleanup.

        Args:
            sid (str): The socket ID that disconnected.
        """
        try:
            # Use our improved method for getting client_pseudo_id
            client_pseudo_id = (
                await self.client_connection_manager.get_client_pseudo_id_by_sid(sid)
            )

            structlog.contextvars.bind_contextvars(client_pseudo_id=client_pseudo_id)
            # Clean up in client connection manager
            await self.client_connection_manager.disconnect_client(sid)

            if client_pseudo_id:
                logger.info(
                    f"Client {client_pseudo_id} disconnected; graph continues running until timeout"
                )
            else:
                logger.warning(f"No client ID found for disconnecting socket {sid}")

        except Exception as e:
            traceback.print_exc()
            logger.error(f"Error handling disconnect for {sid}: {e}")

    async def _handle_guardrail_response(
        self,
        sid: str,
        client_pseudo_id: str,
        triggered: list[str],
        content: str,
        guardrail_categories: dict[str, list[str]],
    ) -> None:
        logger.warning(f"Guardrail(s) triggered for {client_pseudo_id}: {triggered}")

        intake = await self.db_manager.get_intake(client_pseudo_id)
        intake_id = str(intake.id) if intake else None
        state_code = (
            intake.assessment_config.state_code
            if intake and intake.assessment_config
            else self.state_codes.get(client_pseudo_id)
        )

        for guardrail in triggered:
            asyncio.create_task(
                send_guardrail_alert(
                    guardrail_type=guardrail,
                    client_pseudo_id=client_pseudo_id,
                    intake_id=intake_id,
                    state_code=state_code,
                    categories=guardrail_categories.get(guardrail),
                )
            )

        hard_stop = next((t for t in triggered if t in HARD_STOP_GUARDRAIL_TYPES), None)
        if hard_stop:
            if intake:
                await self.db_manager.store_message(
                    intake_id=intake.id,
                    from_role=IntakeMessageRole.CLIENT,
                    content=content,
                    guardrailed_by=triggered,
                )
            else:
                logger.warning(
                    f"Hard-stop guardrail fired but no intake found for {client_pseudo_id} — "
                    f"message not persisted"
                )
            if intake:
                asyncio.create_task(
                    self.db_manager.lock_intake(intake.id, reason=hard_stop)
                )
            # Cancel graph before closing socket — prevents a window where the socket
            # is dead but the graph is still running and attempting to emit.
            if client_pseudo_id in self.conversation_graphs:
                del self.conversation_graphs[client_pseudo_id]
            event = ForceDisconnectEvent(reason=hard_stop)
            await self.sio.emit(event.type, event.model_dump(), room=sid)
        else:
            if intake:
                await self.db_manager.store_message(
                    intake_id=intake.id,
                    from_role=IntakeMessageRole.CLIENT,
                    content=content,
                    guardrailed_by=triggered,
                )
            event = GuardrailTriggeredEvent(guardrails=triggered)
            await self.sio.emit(event.type, event.model_dump(mode="json"), room=sid)

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

            # Get client_pseudo_id using the more robust client_connection_manager method
            client_pseudo_id = (
                await self.client_connection_manager.get_client_pseudo_id_by_sid(sid)
            )
            if not client_pseudo_id:
                logger.warning(f"No client ID found for socket ID {sid}")
                return

            structlog.contextvars.bind_contextvars(client_pseudo_id=client_pseudo_id)
            content = parsed_message.content
            if not content:
                logger.debug(f"Empty content received from sid {sid}")
                return

            triggered, guardrail_categories = await run_guardrails(content)
            if triggered:
                await self._handle_guardrail_response(
                    sid, client_pseudo_id, triggered, content, guardrail_categories
                )
                return

            intake = await self.db_manager.get_intake(client_pseudo_id)
            if not intake:
                logger.warning(f"No intake found for client {client_pseudo_id}")
                return

            # If there's a pending response waiting, fulfill it
            pending_response = self.pending_responses.get(client_pseudo_id)
            if pending_response and not pending_response.done():
                message = await self.db_manager.store_message(
                    intake_id=intake.id,
                    from_role=IntakeMessageRole.CLIENT,
                    content=content,
                )
                if not message:
                    logger.warning(
                        f"Error saving message for client {client_pseudo_id}"
                    )
                    return

                logger.info(
                    f"Setting result for pending response for client {client_pseudo_id}"
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
                await self.db_manager.get_talking_turn(intake.id)
                == IntakeMessageRole.CASEWORKER
            ):
                logger.debug(
                    f"Ignoring message - it's the caseworker's turn for client {client_pseudo_id}"
                )
                return

            # If we get here, we're handling an unexpected message
            if intake.status != IntakeStatus.IN_PROGRESS:
                logger.info(
                    f"Intake for client {client_pseudo_id} is not in progress (status: {intake.status})"
                )
                return

            # Store the message - it might be valid but our conversation state is out of sync
            logger.info(
                f"Storing unexpected message for client {client_pseudo_id} and reinitializing graph"
            )
            client_data = self.db_manager.get_client(client_pseudo_id)
            if not client_data:
                logger.warning(f"No client data found for client {client_pseudo_id}")
                return

            message = await self.db_manager.store_message(
                intake_id=intake.id,
                from_role=IntakeMessageRole.CLIENT,
                content=content,
            )
            if not message:
                logger.warning(f"Error saving message for client {client_pseudo_id}")
                return

            # Clear any existing graph for this client and start fresh
            if client_pseudo_id in self.conversation_graphs:
                del self.conversation_graphs[client_pseudo_id]

            # Reinitialize the conversation graph and track the task
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
        # Use model_dump with mode="json" to ensure proper serialization (UUIDs, datetimes, etc).
        # Events with a .content field emit just the content payload; events without one (e.g.
        # ForceDisconnectEvent) emit the full event shape directly.
        content = getattr(event, "content", None)
        data = (
            content.model_dump(mode="json")
            if content is not None
            else event.model_dump(mode="json")
        )
        await self.sio.emit(event.type, data, room=sid)

    async def send_event_client_pseudo_id(
        self, client_pseudo_id: str, event: ServerEvent
    ):
        content = getattr(event, "content", None)
        data = (
            content.model_dump(mode="json")
            if content is not None
            else event.model_dump(mode="json")
        )
        # Prefer emitting directly to the socket ID (matches L1/L2 behavior and avoids
        # silent drops when room membership is stale). Fall back to room if SID not found.
        sid = await self.client_connection_manager.get_client_sid(client_pseudo_id)
        room = sid if sid else f"client_{client_pseudo_id}"
        await self.sio.emit(event.type, data, room=room)

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
