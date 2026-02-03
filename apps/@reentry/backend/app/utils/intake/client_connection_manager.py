"""
Client connection manager for tracking and enforcing one connection per client.
"""

import traceback
from typing import Optional

import redis.asyncio as redis
import socketio
import structlog

from app.utils.intake.redis_keys import RedisKeys
from app.utils.intake.schemas import ForceDisconnectEvent

logger = structlog.get_logger(__name__)


class ClientConnectionManager:
    """
    Manages client connections and enforces one connection per client.
    Hanldes client rooms and session


    Implements two redis mappings:
        - client_to_sid
        - sid_to_client
    """

    def __init__(self, redis_instance: redis.Redis, sio: socketio.AsyncServer) -> None:
        """
        Initialize the client connection manager.

        Args:
            redis_instance (redis.Redis): Redis client instance
            sio (socketio.AsyncServer): Socket.IO server instance
        """
        self.redis = redis_instance
        self.sio = sio

    async def register_client(
        self, client_pseudo_id: str, sid: str, user_agent: str = "Unknown"
    ) -> bool:
        """
        Register a client connection, enforcing one connection per client.

        If the client already has an active connection, that connection will be
        disconnected before the new connection is registered.

        Args:
            client_pseudo_id (str): Client identifier
            sid (str): Socket ID of the new connection
            user_agent (str, optional): User agent string

        Returns:
            bool: True if the client was connected elsewhere and had to be disconnected
        """
        try:
            if client_pseudo_id:
                structlog.contextvars.bind_contextvars(
                    client_pseudo_id=client_pseudo_id
                )

            # Check if client already has an active connection
            current_sid = await self.get_client_sid(client_pseudo_id)
            was_connected_elsewhere = False

            # If there's an existing connection and it's different from the new one
            if current_sid and current_sid != sid:
                was_connected_elsewhere = True
                logger.info(
                    f"Client {client_pseudo_id} already connected (sid: {current_sid}). Disconnecting previous session."
                )
                # Signal to that connection to disconnect
                try:
                    event = ForceDisconnectEvent(reason="Client connected elsewhere")
                    await self.sio.emit(
                        event.type,
                        event.model_dump(),
                        room=current_sid,
                    )
                except Exception as e:
                    logger.error(f"Error emitting force_disconnect: {e}")

                # Remove the previous connection
                await self.disconnect_client(current_sid)

            # Map socket ID to client ID
            sid_key = RedisKeys.sid_to_client(sid)
            await self.redis.set(sid_key, client_pseudo_id, ex=86400)  # 24 hour expiry

            # Map client ID to socket ID
            conn_key = RedisKeys.client_connection(client_pseudo_id)
            await self.redis.set(conn_key, sid, ex=86400)  # 24 hour expiry

            # Add socket to the client's room
            client_room = f"client_{client_pseudo_id}"
            await self.sio.enter_room(sid, client_room)

            print(
                f"Registered client {client_pseudo_id} with sid {sid} in room {client_room}"
            )

            # saves the client_pseudo_id as the unique session info,
            # to be used when receiving messages for an established connection
            await self.sio.save_session(sid, client_pseudo_id)
            return was_connected_elsewhere

        except Exception as e:
            logger.error(f"Error registering client {client_pseudo_id}: {e}")
            traceback.print_exc()
            return False

    async def disconnect_client(self, sid: str) -> bool:
        """
        Disconnect a client and clear their connection from Redis.

        Args:
            sid (str): Socket ID to disconnect

        Returns:
            bool: True if disconnection was successful
        """
        try:
            # Get client_pseudo_id from the sid
            client_pseudo_id = await self.get_client_pseudo_id_by_sid(sid)

            if client_pseudo_id:
                structlog.contextvars.bind_contextvars(
                    client_pseudo_id=client_pseudo_id
                )

            if not client_pseudo_id:
                logger.warning(f"No client ID found for socket ID {sid}")
                return False

            # Leave the client room
            client_room = f"client_{client_pseudo_id}"
            try:
                await self.sio.leave_room(sid, client_room)
                logger.debug(f"Client {client_pseudo_id} left room {client_room}")
            except Exception as e:
                logger.error(f"Error leaving room {client_room}: {e}")

            # Remove the socket-to-client mapping
            sid_key = RedisKeys.sid_to_client(sid)
            await self.redis.delete(sid_key)

            # Remove the client-to-socket mapping if it matches this sid
            conn_key = RedisKeys.client_connection(client_pseudo_id)
            current_sid = await self.redis.get(conn_key)

            if current_sid:
                if isinstance(current_sid, bytes):
                    current_sid = current_sid.decode("utf-8")

                if current_sid == sid:
                    await self.redis.delete(conn_key)

            logger.info(f"Disconnected client {client_pseudo_id} with sid {sid}")
            return True

        except Exception as e:
            logger.error(f"Error disconnecting client with sid {sid}: {e}")
            traceback.print_exc()
            return False

    async def get_client_pseudo_id_by_sid(self, sid: str) -> Optional[str]:
        """
        Get the client ID associated with a socket ID.

        Args:
            sid (str): Socket ID

        Returns:
            Optional[str]: Client ID if found, None otherwise
        """
        if not sid:
            logger.warning("Cannot get client ID for empty sid")
            return None

        try:
            # First try to get from Socket.IO session (faster)
            try:
                client_pseudo_id = await self.sio.get_session(sid)
                if client_pseudo_id:
                    logger.debug(
                        f"Found client ID {client_pseudo_id} in session for sid {sid}"
                    )
                    return client_pseudo_id
            except Exception as session_err:
                logger.debug(f"Session not found for sid {sid}: {session_err}")

            # Fallback to Redis lookup
            sid_key = RedisKeys.sid_to_client(sid)
            client_pseudo_id = await self.redis.get(sid_key)

            if client_pseudo_id:
                client_pseudo_id_str = (
                    client_pseudo_id.decode("utf-8")
                    if isinstance(client_pseudo_id, bytes)
                    else client_pseudo_id
                )
                logger.debug(
                    f"Found client ID {client_pseudo_id_str} in Redis for sid {sid}"
                )
                return client_pseudo_id_str

            logger.warning(f"No client ID found for socket ID {sid}")
            return None

        except Exception as e:
            logger.error(f"Error getting client ID for sid {sid}: {e}")
            traceback.print_exc()
            return None

    async def get_client_sid(self, client_pseudo_id: str) -> Optional[str]:
        """
        Get the socket ID associated with a client ID.

        Args:
            client_pseudo_id (str): Client identifier

        Returns:
            Optional[str]: Socket ID if found, None otherwise
        """
        if not client_pseudo_id:
            return None

        try:
            conn_key = RedisKeys.client_connection(client_pseudo_id)
            sid = await self.redis.get(conn_key)

            if sid:
                return sid.decode("utf-8") if isinstance(sid, bytes) else sid
            return None

        except Exception as e:
            logger.error(f"Error getting sid for client {client_pseudo_id}: {e}")
            return None

    async def disconnect_client_pseudo_id(self, client_pseudo_id: str):
        if client_pseudo_id:
            structlog.contextvars.bind_contextvars(client_pseudo_id=client_pseudo_id)

        sid = await self.get_client_sid(client_pseudo_id)
        # Signal to that connection to disconnect

        if sid:
            try:
                event = ForceDisconnectEvent(reason="Timeout")
                await self.sio.emit(
                    event.type,
                    event.model_dump(),
                    room=sid,
                )
            except Exception as e:
                logger.error(f"Error emitting force_disconnect: {e}")
            await self.disconnect_client(sid)
