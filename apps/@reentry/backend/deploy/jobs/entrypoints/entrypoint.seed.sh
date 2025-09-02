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

# Get the seed mode from environment variable, default to 'demo'
SEED_MODE=${SEED_MODE:-demo}

echo "Running seed-workflow with mode: $SEED_MODE"
uv run python -m app.manage seed-workflow --mode=$SEED_MODE

echo "Seed workflow completed successfully!"
