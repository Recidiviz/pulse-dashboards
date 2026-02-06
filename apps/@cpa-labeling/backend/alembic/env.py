"""Alembic environment configuration for database migrations."""

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy import create_engine
from sqlmodel import SQLModel

# Import all models so they are registered with SQLModel
from app.models.labeling_feedback import LabelingFeedback  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = SQLModel.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_url() -> str:
    """Get the database URL from environment or config."""
    # Check for DATABASE_URL environment variable first (for Cloud Run jobs)
    url = os.environ.get("DATABASE_URL")
    if url:
        return url

    # Fall back to constructing URL from individual env vars
    user = os.environ.get("LABELING_LABELING_POSTGRES_USER", "postgres")
    password = os.environ.get("LABELING_LABELING_POSTGRES_PASSWORD", "")
    server = os.environ.get("LABELING_LABELING_POSTGRES_SERVER", "localhost")
    port = os.environ.get("LABELING_LABELING_POSTGRES_PORT", "5432")
    db = os.environ.get("LABELING_LABELING_POSTGRES_DB", "labeling")

    # Check for GCP instance name (Cloud SQL)
    gcp_instance = os.environ.get("LABELING_LABELING_GCP_DB_INSTANCE_NAME")
    if gcp_instance:
        return f"postgresql://{user}:{password}@/{db}?host={server}"

    return f"postgresql://{user}:{password}@{server}:{port}/{db}"


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    url = get_url()

    connectable = create_engine(
        url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
