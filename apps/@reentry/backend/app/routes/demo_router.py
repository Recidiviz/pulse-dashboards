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

Demo router for A/B testing WebSocket vs SSE transport layers.

Provides two parallel chat implementations:
  - /demo/ws         — WebSocket-based chat
  - /demo/sse/chat   — SSE-based chat (POST with streaming response)

Both maintain in-memory conversation history keyed by session_id.
If an LLM API key is configured, responses come from the model;
otherwise a simple echo/canned response is used.
"""

import json
import time
import uuid

import structlog
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.config import create_model_from_config, settings

logger = structlog.get_logger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory conversation store  (session_id -> list of {role, content} dicts)
# ---------------------------------------------------------------------------
conversations: dict[str, list[dict[str, str]]] = {}

SYSTEM_PROMPT = (
    "You are a helpful case-planning assistant. "
    "Keep your responses concise (2-3 sentences). "
    "This is a demo/test of the transport layer."
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_or_create_session(session_id: str | None) -> tuple[str, list[dict[str, str]]]:
    if not session_id:
        session_id = uuid.uuid4().hex
    if session_id not in conversations:
        conversations[session_id] = [{"role": "system", "content": SYSTEM_PROMPT}]
    return session_id, conversations[session_id]


def _get_llm():
    """Try to build an LLM client from env config. Returns None on failure."""
    try:
        return create_model_from_config(
            provider=settings.DT_MODEL_PROVIDER,
            name=settings.DT_MODEL_NAME,
            version=settings.DT_MODEL_VERSION,
        )
    except Exception:
        return None


async def _generate_reply(history: list[dict[str, str]]) -> str:
    """Get a reply from the LLM, or return a canned response."""
    llm = _get_llm()
    if llm is None:
        return (
            "[echo] I received your message. "
            "(No LLM API key configured — this is a transport-layer test.)"
        )
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

        result = await llm.ainvoke(lc_messages)
        return result.content
    except Exception as e:
        logger.error("llm_invocation_failed", error=str(e))
        return f"[echo] LLM error — but the transport layer is working! Error: {e}"


async def _generate_reply_stream(history: list[dict[str, str]]):
    """Yield chunks from the LLM, or yield a single canned response."""
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
        logger.error("llm_streaming_failed", error=str(e))
        yield f"[echo] LLM error — but the transport layer is working! Error: {e}"


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------


@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()

    # Client can send an initial session_id or we generate one
    session_id = None
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            session_id, history = _get_or_create_session(
                data.get("session_id") or session_id
            )

            # Send back the session_id so client can track it
            if data.get("type") == "init":
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "session",
                            "session_id": session_id,
                        }
                    )
                )
                continue

            user_message = data.get("message", "")
            history.append({"role": "user", "content": user_message})

            # Stream response token-by-token over the websocket
            full_response = ""
            async for chunk in _generate_reply_stream(history):
                full_response += chunk
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "chunk",
                            "session_id": session_id,
                            "content": chunk,
                        }
                    )
                )

            # Send done signal
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "done",
                        "session_id": session_id,
                    }
                )
            )

            history.append({"role": "assistant", "content": full_response})

    except WebSocketDisconnect:
        logger.info("websocket_disconnected", session_id=session_id)
    except Exception as e:
        logger.error("websocket_error", error=str(e), session_id=session_id)
        try:
            await websocket.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# SSE endpoint
# ---------------------------------------------------------------------------


class SSEChatRequest(BaseModel):
    session_id: str | None = None
    message: str


@router.post("/sse/chat")
async def sse_chat(req: SSEChatRequest):
    session_id, history = _get_or_create_session(req.session_id)
    history.append({"role": "user", "content": req.message})

    logger.info(
        "sse_session_start",
        session_id=session_id,
        message_preview=req.message[:80],
        history_length=len(history),
    )

    async def event_stream():
        # First event: session info
        yield f"event: session\ndata: {json.dumps({'session_id': session_id})}\n\n"

        full_response = ""
        chunk_count = 0
        start_time = time.monotonic()
        try:
            async for chunk in _generate_reply_stream(history):
                full_response += chunk
                chunk_count += 1
                yield f"event: chunk\ndata: {json.dumps({'content': chunk})}\n\n"

            yield f"event: done\ndata: {json.dumps({})}\n\n"
            history.append({"role": "assistant", "content": full_response})

            elapsed = time.monotonic() - start_time
            logger.info(
                "sse_stream_complete",
                session_id=session_id,
                chunk_count=chunk_count,
                response_length=len(full_response),
                elapsed_seconds=round(elapsed, 3),
            )
        except Exception as e:
            elapsed = time.monotonic() - start_time
            logger.error(
                "sse_stream_error",
                session_id=session_id,
                error=str(e),
                chunk_count=chunk_count,
                elapsed_seconds=round(elapsed, 3),
            )
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Utility: list/clear sessions (for debugging)
# ---------------------------------------------------------------------------


@router.get("/sessions")
async def list_sessions():
    return {sid: len(msgs) for sid, msgs in conversations.items()}


@router.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    if session_id in conversations:
        del conversations[session_id]
        return {"status": "cleared"}
    return {"status": "not_found"}
    return {"status": "not_found"}
