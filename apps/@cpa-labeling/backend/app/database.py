"""Database connection and session management."""

from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Reentry database engine (read-only access to intake, plan, etc.)
# postgresql_readonly=True ensures this connection cannot write to the database
reentry_engine = create_async_engine(
    settings.reentry_database_url,
    echo=False,
    pool_pre_ping=True,
    execution_options={"postgresql_readonly": True},
)

# Labeling database engine (read-write access to labeling_feedback)
labeling_engine = create_async_engine(
    settings.labeling_database_url,
    echo=False,
    pool_pre_ping=True,
)

# Session factories
reentry_session_maker = sessionmaker(
    reentry_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

labeling_session_maker = sessionmaker(
    labeling_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_reentry_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get reentry database session (read-only)."""
    async with reentry_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_labeling_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get labeling database session (read-write)."""
    async with labeling_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


# For backwards compatibility - alias to reentry session
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session (backwards compatibility)."""
    async for session in get_reentry_session():
        yield session


async def init_db() -> None:
    """Initialize database connections (verify connectivity)."""
    # Verify reentry database connection
    async with reentry_session_maker() as session:
        await session.execute(text("SELECT 1"))
    print("Reentry database connection verified")

    # Verify labeling database connection (may be same as reentry in dev)
    async with labeling_session_maker() as session:
        await session.execute(text("SELECT 1"))
    print("Labeling database connection verified")
