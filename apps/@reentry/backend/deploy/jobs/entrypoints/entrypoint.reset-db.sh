#!/bin/sh

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
uv run alembic downgrade base

echo "Database downgraded successfully!"

# Upgrade database to head
echo "Upgrading database to head..."
uv run alembic upgrade head

echo "Database upgraded successfully!"

# Seed the database
echo "Running seed-db with force option..."
uv run python -m app.manage seed-db --force

echo "Database reset and seed completed successfully!"
