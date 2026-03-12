# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2025 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================

"""
Temporary for user testing and will be removed entirely after user testing

Demo Socket.IO server for A/B testing transport layers.

Mounted separately from the production Socket.IO instance to avoid
coupling with intake logic and Redis dependencies.
"""

import uuid

import socketio
import structlog

from app.core.config import create_model_from_config, settings

logger = structlog.get_logger(__name__)

# Standalone Socket.IO server for demo — no Redis required
demo_sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.ALLOWED_ORIGINS.split(","),
)

demo_socket_app = socketio.ASGIApp(socketio_server=demo_sio)

# In-memory conversation store (sid -> {session_id, history})
sessions: dict[str, dict] = {}

SYSTEM_PROMPT = (
    "You are a helpful case-planning assistant. "
    "Keep your responses concise (2-3 sentences). "
    "This is a demo/test of the transport layer."
)


def _get_llm():
    try:
        return create_model_from_config(
            provider=settings.DT_MODEL_PROVIDER,
            name=settings.DT_MODEL_NAME,
            version=settings.DT_MODEL_VERSION,
        )
    except Exception:
        return None


async def _generate_reply_stream(history: list[dict[str, str]]):
    llm = _get_llm()
    if llm is None:
        yield (
            "[echo] I received your message. "
            "(No LLM API key configured — this is a transport-layer test.)"
        )
        return
    try:
        from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

        lc_messages = []
        for m in history:
            if m["role"] == "system":
                lc_messages.append(SystemMessage(content=m["content"]))
            elif m["role"] == "user":
                lc_messages.append(HumanMessage(content=m["content"]))
            elif m["role"] == "assistant":
                lc_messages.append(AIMessage(content=m["content"]))

        async for chunk in llm.astream(lc_messages):
            if chunk.content:
                yield chunk.content
    except Exception as e:
        logger.error(f"LLM streaming failed: {e}")
        yield f"[echo] LLM error — but the transport layer is working! Error: {e}"


@demo_sio.event
async def connect(sid, environ):
    session_id = uuid.uuid4().hex
    sessions[sid] = {
        "session_id": session_id,
        "history": [{"role": "system", "content": SYSTEM_PROMPT}],
    }
    await demo_sio.emit("session", {"session_id": session_id}, room=sid)
    logger.info(f"Demo Socket.IO connected: sid={sid}, session={session_id}")


@demo_sio.event
async def disconnect(sid):
    sessions.pop(sid, None)
    logger.info(f"Demo Socket.IO disconnected: sid={sid}")


@demo_sio.event
async def chat_message(sid, data):
    """Handle incoming chat message from client."""
    session = sessions.get(sid)
    if not session:
        await demo_sio.emit("error", {"message": "No session found"}, room=sid)
        return

    user_message = data.get("message", "")
    session["history"].append({"role": "user", "content": user_message})

    # Stream response chunks back
    full_response = ""
    async for chunk in _generate_reply_stream(session["history"]):
        full_response += chunk
        await demo_sio.emit("chunk", {"content": chunk}, room=sid)

    await demo_sio.emit("done", {}, room=sid)
    session["history"].append({"role": "assistant", "content": full_response})
