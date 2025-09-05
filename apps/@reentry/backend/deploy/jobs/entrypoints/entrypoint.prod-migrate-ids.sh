#!/bin/sh

echo "Starting Migrate job..."

# initialize the cloud sql proxy
echo "Starting Cloud SQL Proxy..."
cloud-sql-proxy --port 5432 $RECIDIVIZ_POSTGRES_SERVER &

# wait for the cloud sql proxy to be ready
until nc -z localhost 5432; do
  echo "Waiting for Cloud SQL Proxy to be ready..."
  sleep 2
done

echo "Cloud SQL Proxy is ready!"

echo "Running Migrate pending executions command..."
uv run python -m app.manage migrate-ids

echo "Migrate job completed!"
