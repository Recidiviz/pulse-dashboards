from __future__ import with_statement

import asyncio
import pathlib
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))
from app.core.config import settings

import app.models.models  # noqa
import app.models.decision_tree  # noqa
import app.models.plan_decision_tree  # noqa
import app.models.assessment_tree  # noqa
import app.models.execution  # noqa
import app.models.assessment  # noqa
import app.models.assessment_config  # noqa
import app.models.output_config  # noqa
import app.models.intake  # noqa
import app.models.recording  # noqa

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

db_url = settings.DATABASE_URL
print(f"db_url: {db_url}")


# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

# TODO: look into https://alembic.sqlalchemy.org/en/latest/naming.html


def run_migrations_offline():
    """Run migrations in 'offline' mode.
    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.
    Calls to context.execute() here emit the given string to the
    script output.
    """
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    """Run migrations in 'online' mode.
    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = create_async_engine(db_url, echo=True, future=True)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
