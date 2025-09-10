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
uv run python -m app.manage update-recording-status e841edcb-f110-43a8-997d-be012e4af404 created

echo "Job completed!"