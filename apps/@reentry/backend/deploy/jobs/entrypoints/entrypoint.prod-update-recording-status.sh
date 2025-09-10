#!/bin/sh

echo "Starting job..."

# initialize the cloud sql proxy
echo "Starting Cloud SQL Proxy..."
cloud-sql-proxy --port 5432 $RECIDIVIZ_POSTGRES_SERVER &

# wait for the cloud sql proxy to be ready
until nc -z localhost 5432; do
  echo "Waiting for Cloud SQL Proxy to be ready..."
  sleep 2
done

echo "Cloud SQL Proxy is ready!"

echo "Pending executions command..."
uv run python -m app.manage update-recording-status 74d18c94-be15-4f03-a64d-4fe0102cfd5f created

echo "Job completed!"