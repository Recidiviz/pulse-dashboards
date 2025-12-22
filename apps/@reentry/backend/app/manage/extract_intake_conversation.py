import asyncio
import logging
import os
from typing import List, Literal, Optional, Tuple, cast, get_args
from uuid import UUID

from dotenv import load_dotenv
from google.cloud.sql.connector import Connector
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from typer import Option

from app.core.config import settings
from app.models.intake import Intake, IntakeMessage
from app.models.intake_sections import (
    ClientIntakeSection,
    CompletionStatus,
    IntakeSection,
)

from .base import cli
from .types import (
    ConversationExchange,
    IntakeConversationData,
    IntakeSectionsData,
    IntakeSectionStatus,
)

logger = logging.getLogger(__name__)
load_dotenv()
Environment = Literal["local", "dev", "demo", "staging", "prod"]


def is_valid_environment(value: str) -> bool:
    return value in get_args(Environment)


def to_environment(value: str) -> Environment:
    if value not in get_args(Environment):
        raise ValueError(f"Invalid environment: {value}")
    return cast(Environment, value)


ENV_INSTANCES: dict[Environment, Optional[str]] = {
    "local": None,
    "dev": "recidiviz-rnd-planner:us-central1:recidiviz-dev",
    "demo": "recidiviz-rnd-planner:us-central1:recidiviz-demo",
    "staging": "recidiviz-rnd-planner:us-central1:recidiviz-staging",
    "prod": "recidiviz-rnd-planner:us-central1:recidiviz-prod",
}


def get_password_for_env(env: Environment) -> str:
    if env == "local":
        return settings.POSTGRES_PASSWORD

    env_var_name = f"RECIDIVIZ_POSTGRES_PASSWORD_{env.upper()}"
    password = os.getenv(env_var_name)

    if not password:
        raise ValueError(
            f"Password not found for environment '{env}'. "
            f"Please set {env_var_name} in your .env file"
        )

    return password


async def get_postgres_engine(
    env: Environment,
) -> Tuple[AsyncEngine, Optional[Connector]]:
    gcp_instance = ENV_INSTANCES[env]
    connector: Optional[Connector] = None

    if gcp_instance:
        loop = asyncio.get_running_loop()
        connector = Connector(loop=loop)
        password = get_password_for_env(env)

        async def getconn():
            conn = await connector.connect_async(
                gcp_instance,
                "asyncpg",
                user=settings.POSTGRES_USER,
                password=password,
                db="recidiviz",
            )
            return conn

        engine = create_async_engine(
            "postgresql+asyncpg://",
            async_creator=getconn,
            echo=False,
        )
    else:
        db_url = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        engine = create_async_engine(db_url, echo=False)

    return engine, connector


async def fetch_conversation(
    client_pseudo_id: str, env: Environment
) -> IntakeConversationData:
    engine, connector = await get_postgres_engine(env)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            intake_stmt = select(
                Intake.id,
                Intake.client_pseudo_id,
                Intake.created_at,
                Intake.intake_type,
                Intake.status,
            ).where(Intake.client_pseudo_id == client_pseudo_id)
            result = await session.execute(intake_stmt)
            intake_row = result.first()

            if not intake_row:
                return IntakeConversationData(
                    client_pseudo_id=client_pseudo_id,
                    environment=env,
                    error=f"No intake found for client: {client_pseudo_id}",
                )

            intake_id = intake_row[0]
            intake_created_at = str(intake_row[2])
            intake_type = intake_row[3]
            intake_status = intake_row[4]

            # Check if intake type is conversation
            if intake_type != "conversation":
                return IntakeConversationData(
                    client_pseudo_id=client_pseudo_id,
                    environment=env,
                    intake_type=intake_type,
                    status=intake_status,
                    error=f"Conversation evaluation is only supported on intake_type 'conversation'. This intake has type '{intake_type}'.",
                )

            messages_stmt = (
                select(IntakeMessage)
                .where(IntakeMessage.intake_id == intake_id)
                .order_by(IntakeMessage.created_at)
            )
            result = await session.execute(messages_stmt)
            messages = result.scalars().all()

            if not messages:
                return IntakeConversationData(
                    client_pseudo_id=client_pseudo_id,
                    environment=env,
                    intake_type=intake_type,
                    status=intake_status,
                    error=f"No messages found for client: {client_pseudo_id}",
                )

            conversation_history = intake_messages_to_conversation_history(messages)

            sections_data = await get_intake_sections(intake_id, session)
            completed_sections = get_completed_sections(sections_data)

            return IntakeConversationData(
                client_pseudo_id=client_pseudo_id,
                conversation_history=conversation_history,
                created_at=intake_created_at,
                environment=env,
                intake_type=intake_type,
                status=intake_status,
                sections_data=sections_data,
                completed_sections=completed_sections,
            )

    except Exception as e:
        logger.error(f"Error fetching conversation: {e}", exc_info=True)
        return IntakeConversationData(
            client_pseudo_id=client_pseudo_id,
            environment=env,
            error=str(e),
        )
    finally:
        await engine.dispose()
        if connector:
            await connector.close_async()


def intake_messages_to_conversation_history(messages) -> List[ConversationExchange]:
    conversation_history: List[ConversationExchange] = []
    current_question = None

    for msg in messages:
        if msg.from_role == "caseworker":
            if current_question:
                conversation_history.append(
                    ConversationExchange(
                        question=current_question["content"],
                        answer="",
                        section=current_question["section"],
                    )
                )
            current_question = {"content": msg.content, "section": msg.section}
        elif msg.from_role == "client":
            if current_question:
                conversation_history.append(
                    ConversationExchange(
                        question=current_question["content"],
                        answer=msg.content,
                        section=current_question["section"] or msg.section,
                    )
                )
                current_question = None
            else:
                conversation_history.append(
                    ConversationExchange(
                        question="",
                        answer=msg.content,
                        section=msg.section,
                    )
                )

    if current_question:
        conversation_history.append(
            ConversationExchange(
                question=current_question["content"],
                answer="",
                section=current_question["section"],
            )
        )

    return conversation_history


async def get_intake_sections(
    intake_id: UUID,
    session: AsyncSession,
) -> IntakeSectionsData:
    # Query all ClientIntakeSection records for this intake, joined with IntakeSection
    statement = (
        select(ClientIntakeSection)
        .join(IntakeSection)
        .where(ClientIntakeSection.intake_id == intake_id)
        .order_by(ClientIntakeSection.order)
    )
    result = await session.execute(statement)
    client_sections = result.scalars().all()

    sections = []
    for client_section in client_sections:
        sections.append(
            IntakeSectionStatus(
                title=client_section.section_title,
                completion_status=client_section.completion_status,
            )
        )

    return IntakeSectionsData(
        intake_id=str(intake_id),
        sections=sections,
    )


def get_completed_sections(sections_data: IntakeSectionsData) -> List[str]:
    return [
        section.title
        for section in sections_data.sections
        if section.completion_status == CompletionStatus.COMPLETED.value
    ]


@cli.command()
async def extract_intake_conversation(
    client_pseudo_id: str = Option(..., help="Client's pseudo id"),
    env: str = Option(..., help="Environment: local, dev, demo, staging, prod"),
):
    """
    Extract conversation history for a client as JSON.
    Get the database password for the specified environment from the .env file
    like RECIDIVIZ_POSTGRES_PASSWORD_DEMO="".

    Args:
        client_pseudo_id: The client's pseudo ID
        env: Environment (local, dev, demo, staging, prod).

    Example usage:
        uv run python -m app.manage extract-intake-conversation --client-pseudo-id a1b2c3d4 --env demo
    """
    if not is_valid_environment(env):
        print(f"env has to be in {Environment}")
        return

    environment = to_environment(env)
    try:
        get_password_for_env(environment)
    except Exception:
        env_var_name = f"RECIDIVIZ_POSTGRES_PASSWORD_{env.upper()}"
        print(
            f" Couldn't get the password for environment {environment}."
            f" Please set {env_var_name} in your .env file"
        )
        return

    result = await fetch_conversation(client_pseudo_id, environment)
    print(result.model_dump_json(indent=2))
