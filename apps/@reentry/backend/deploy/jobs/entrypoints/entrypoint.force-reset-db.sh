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

echo "WARNING: Running force reset - this will drop ALL tables and types!"
echo "Running force-reset-db command..."
uv run python -m app.manage force-reset-db

echo "Force reset database completed successfully!"
