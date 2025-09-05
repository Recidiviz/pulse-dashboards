"""
Unit tests for the ClientConnectionManager class in app.utils.intake.client_connection_manager.
"""

from unittest.mock import AsyncMock

import pytest
import redis.asyncio as redis
import socketio

from app.utils.intake.client_connection_manager import ClientConnectionManager


@pytest.fixture
def mock_redis_client():
    """Mock Redis client."""
    client = AsyncMock(spec=redis.Redis)
    client.set = AsyncMock(return_value=True)
    client.get = AsyncMock(return_value=None)
    client.delete = AsyncMock(return_value=True)
    return client


@pytest.fixture
def mock_socketio():
    """Mock Socket.IO server."""
    sio = AsyncMock(spec=socketio.AsyncServer)
    sio.enter_room = AsyncMock()
    sio.leave_room = AsyncMock()
    sio.save_session = AsyncMock()
    sio.emit = AsyncMock()
    return sio


@pytest.fixture
async def connection_manager(mock_redis_client, mock_socketio):
    """Create ClientConnectionManager instance with mocked dependencies."""
    manager = ClientConnectionManager(
        redis_instance=mock_redis_client, sio=mock_socketio
    )
    return manager


@pytest.mark.asyncio
async def test_register_client(connection_manager, mock_redis_client, mock_socketio):
    """Test registering a client connection."""
    client_pseudo_id = "test_client"
    sid = "test_socket"

    # Mock no existing connection
    mock_redis_client.get.return_value = None

    await connection_manager.register_client(client_pseudo_id, sid)

    # Verify Redis interactions for new key
    mock_redis_client.set.assert_called()

    # Verify Socket.IO interactions
    mock_socketio.enter_room.assert_called_once_with(sid, f"client_{client_pseudo_id}")
    mock_socketio.save_session.assert_called_once_with(sid, client_pseudo_id)


@pytest.mark.asyncio
async def test_register_client_existing_connection(
    connection_manager, mock_redis_client, mock_socketio
):
    """Test registering a client with an existing connection."""
    client_pseudo_id = "test_client"
    sid = "test_socket"
    existing_sid = "existing_socket"

    # Mock existing connection
    mock_redis_client.get.return_value = existing_sid

    result = await connection_manager.register_client(client_pseudo_id, sid)

    # Verify result
    assert result is True

    # Verify Redis interactions
    mock_redis_client.set.assert_called()

    # Verify Socket.IO interactions - disconnecting previous
    mock_socketio.emit.assert_called_once()

    # Verify entering room
    mock_socketio.enter_room.assert_called_once_with(sid, f"client_{client_pseudo_id}")


@pytest.mark.asyncio
async def test_disconnect_client(connection_manager, mock_redis_client, mock_socketio):
    """Test disconnecting a client."""
    client_pseudo_id = "test_client"
    sid = "test_socket"

    # Mock client lookup
    connection_manager.get_client_pseudo_id_by_sid = AsyncMock(
        return_value=client_pseudo_id
    )
    mock_redis_client.get.return_value = sid.encode("utf-8")  # For current_sid check

    result = await connection_manager.disconnect_client(sid)

    # Verify result
    assert result is True

    # Verify Redis interactions
    mock_redis_client.delete.assert_called()

    # Verify Socket.IO interactions
    mock_socketio.leave_room.assert_called_once_with(sid, f"client_{client_pseudo_id}")


@pytest.mark.asyncio
async def test_get_client_pseudo_id_by_sid(
    connection_manager, mock_redis_client, mock_socketio
):
    """Test getting client ID by socket ID."""
    sid = "test_socket"
    client_pseudo_id = "test_client"

    # Mock Socket.IO session response first (which will fail)
    mock_socketio.get_session.side_effect = Exception("Session not found")

    # Then mock Redis response
    mock_redis_client.get.return_value = client_pseudo_id.encode("utf-8")

    result = await connection_manager.get_client_pseudo_id_by_sid(sid)

    # Verify result
    assert result == client_pseudo_id

    # Verify Socket.IO interaction was attempted first
    mock_socketio.get_session.assert_called_once_with(sid)

    # Verify Redis was used as fallback
    mock_redis_client.get.assert_called_once()


@pytest.mark.asyncio
async def test_get_client_sid(connection_manager, mock_redis_client):
    """Test getting socket ID by client ID."""
    client_pseudo_id = "test_client"
    sid = "test_socket"

    # Mock Redis response
    mock_redis_client.get.return_value = sid.encode("utf-8")

    result = await connection_manager.get_client_sid(client_pseudo_id)

    # Verify result
    assert result == sid

    # Verify Redis interaction
    mock_redis_client.get.assert_called_once()


@pytest.mark.asyncio
async def test_disconnect_client_no_matching_sid(
    connection_manager, mock_redis_client, mock_socketio
):
    """Test disconnecting a client when current SID doesn't match."""
    client_pseudo_id = "test_client"
    sid = "test_socket"
    different_sid = "different_socket"

    # Mock client lookup
    connection_manager.get_client_pseudo_id_by_sid = AsyncMock(
        return_value=client_pseudo_id
    )
    mock_redis_client.get.return_value = different_sid.encode(
        "utf-8"
    )  # For current_sid check

    result = await connection_manager.disconnect_client(sid)

    # Verify result
    assert result is True

    # Verify Redis only deletes the sid-to-client mapping, not the client-to-sid
    assert mock_redis_client.delete.call_count == 1


@pytest.mark.asyncio
async def test_register_client_twice_same_client_pseudo_id(
    connection_manager, mock_redis_client, mock_socketio
):
    """Test registering a client with the same client_pseudo_id twice should fail."""
    client_pseudo_id = "test_client"
    sid1 = "socket_one"
    sid2 = "socket_two"

    # First connection - should succeed
    mock_redis_client.get.return_value = None
    result1 = await connection_manager.register_client(client_pseudo_id, sid1)
    assert result1 is False

    # Reset mocks
    mock_redis_client.reset_mock()
    mock_socketio.reset_mock()

    # Mock existing connection for second attempt
    mock_redis_client.get.return_value = sid1

    # Second connection with same client_pseudo_id - should disconnect first one
    result2 = await connection_manager.register_client(client_pseudo_id, sid2)
    assert result2 is True

    # Verify first connection was disconnected
    mock_socketio.emit.assert_called_once_with(
        "forceDisconnect",
        {"type": "forceDisconnect", "reason": "Client connected elsewhere"},
        room=sid1,
    )

    # Verify Redis mappings were updated to new connection
    conn_key_calls = [
        call
        for call in mock_redis_client.set.call_args_list
        if "connections:" in str(call)
    ]
    assert len(conn_key_calls) > 0, "No client_connection Redis key was set"
