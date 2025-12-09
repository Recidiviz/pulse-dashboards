import subprocess

from sqlalchemy import text

from app.core.db import engine

from .base import cli
from .seed_db import seed_db


@cli.command()
async def force_reset_db():
    """
    Force reset database by dropping all tables and types, then running migrations and seeding.

    This is useful when migrations are not working properly (e.g., checked out a branch
    without the current latest migration).

    Steps:
    1. Drop all tables, types, and empty alembic table
    2. Run all migrations (alembic upgrade head)
    3. Run seed_db
    """

    print("WARNING: This will drop ALL tables and types from the database!")
    print("Starting force reset...")

    # Step 1: Drop all tables and types
    async with engine.begin() as conn:
        print("Dropping all tables and types...")

        # Drop all tables in the public schema
        await conn.execute(
            text("""
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
        """)
        )

        # Drop all types in the public schema
        await conn.execute(
            text("""
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT typname FROM pg_type t
                          JOIN pg_namespace n ON n.oid = t.typnamespace
                          WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
                    EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
                END LOOP;
            END $$;
        """)
        )

        print("All tables and types dropped successfully.")

    # Step 2: Run migrations
    print("Running migrations (alembic upgrade head)...")
    result = subprocess.run(
        ["uv", "run", "alembic", "upgrade", "head"], capture_output=True, text=True
    )

    if result.returncode != 0:
        print(f"Migration failed: {result.stderr}")
        raise Exception("Migration failed")

    print("Migrations completed successfully.")

    # Step 3: Seed the database
    print("Seeding database...")
    await seed_db()

    print("Force reset completed successfully!")
