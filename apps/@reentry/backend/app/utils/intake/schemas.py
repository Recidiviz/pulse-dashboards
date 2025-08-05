"""
Pydantic models for intake assessment system.
"""

from enum import StrEnum
from typing import Any, List, Literal, NotRequired, Optional

from pydantic import BaseModel
from typing_extensions import TypedDict

from app.routes.shared_models import IntakeMessageResponse


class UserAction(StrEnum):
    """User actions during an assessment."""

    CONTINUE = "continue"
    PAUSE = "pause"
    REQUEST_CASEWORKER = "request_caseworker"


class ConfigSchema(TypedDict):
    """Config schema for the conversation graph."""

    max_retries: int
    inactivity_timeout: int
    category_order: List[str]


class ErrorInfo(TypedDict):
    """Structured error information."""

    message: str
    location: NotRequired[str]
    timestamp: NotRequired[str]
    code: NotRequired[str]
    details: NotRequired[str]


class ClientContext(BaseModel):
    """Client context for conversation."""

    client_id: str
    client_name: str


class ConversationState(TypedDict):
    """State schema for the conversation graph."""

    error: Optional[ErrorInfo]
    messages: List[Any]
    current_section: Optional[str]


## ------------ Socket events - keep in sync with FE types in app/websockets/event_types
## What the auth object send on connection by the front-end should look like
class Auth(BaseModel):
    auth_token: Optional[str] = None
    token_from_url: Optional[str] = None


## Front-end Events
class PingEventContent(BaseModel):
    timestamp: int


class PingEvent(BaseModel):
    """Ping event model."""

    type: Literal["ping"] = "ping"
    content: PingEventContent


# TO-DO
class CommandAction(StrEnum):
    """Command actions for controlling the conversation."""

    PAUSE = "pause"
    MANAGER_REQUESTED = "manager_requested"
    RESUME = "resume"


class CommandContent(BaseModel):
    """Content for command events."""

    action: CommandAction


class CommandEvent(BaseModel):
    """Command event model."""

    type: Literal["command"]
    content: CommandContent
    conversation_id: Optional[str] = None


class HumanMessage(BaseModel):
    type: Literal["humanMessage"] = "humanMessage"
    content: str


# --- Server events
class PongEventContent(BaseModel):
    timestamp: int


class PongEvent(BaseModel):
    """Ping event model."""

    type: Literal["pong"] = "pong"
    content: PongEventContent


class ConnectionAckContent(BaseModel):
    accepted: bool


class ConnectionAckEvent(BaseModel):
    type: Literal["connectionAck"] = "connectionAck"
    content: ConnectionAckContent


class AIMessageEvent(BaseModel):
    type: Literal["AIMessage"] = "AIMessage"
    content: IntakeMessageResponse


class SectionChangeContent(BaseModel):
    """Content for section change events."""

    section: str
    messages: List[IntakeMessageResponse]


class SectionChangeEvent(BaseModel):
    """Section change event model."""

    type: Literal["sectionChange"] = "sectionChange"
    content: SectionChangeContent


class ForceDisconnectEvent(BaseModel):
    type: Literal["forceDisconnect"] = "forceDisconnect"
    reason: str


type ServerEvent = PongEvent | AIMessageEvent | ConnectionAckEvent | SectionChangeEvent

## Front-end Events
