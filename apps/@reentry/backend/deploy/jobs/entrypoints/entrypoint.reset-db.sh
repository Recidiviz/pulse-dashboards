#!/bin/sh
set -e  # Exit on any error
set -o pipefail

# Initialize the cloud sql proxy
echo "Starting Cloud SQL Proxy..."
cloud-sql-proxy --port 5432 $RECIDIVIZ_POSTGRES_SERVER &

# Wait for the cloud sql proxy to be ready
until nc -z localhost 5432; do
  echo "Waiting for Cloud SQL Proxy to be ready..."
  sleep 2
done

echo "Cloud SQL Proxy is ready!"

# Downgrade database to base
echo "Downgrading database to base..."
if ! uv run alembic downgrade base; then
    echo "ERROR: Database downgrade to base failed" >&2
    exit 1
fi

echo "Database downgraded successfully!"

# Upgrade database to head
echo "Upgrading database to head..."
if ! uv run alembic upgrade head; then
    echo "ERROR: Database upgrade to head failed" >&2
    exit 1
fi

echo "Database upgraded successfully!"

# Seed the database
echo "Running seed-db with force option..."
if ! uv run python -m app.manage seed-db --force; then
    echo "ERROR: Database seeding failed" >&2
    exit 1
fi

echo "Database reset and seed completed successfully!"
