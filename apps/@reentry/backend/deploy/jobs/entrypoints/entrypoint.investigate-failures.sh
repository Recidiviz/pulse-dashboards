#!/bin/sh

echo "Starting investigation of execution failures..."

# initialize the cloud sql proxy
echo "Starting Cloud SQL Proxy..."
cloud-sql-proxy --port 5432 $RECIDIVIZ_POSTGRES_SERVER &

# wait for the cloud sql proxy to be ready
until nc -z localhost 5432; do
  echo "Waiting for Cloud SQL Proxy to be ready..."
  sleep 2
done

echo "Cloud SQL Proxy is ready!"

# Check Redis connection
echo "Checking Redis connection..."
if python3 -c "import os, redis; print(redis.from_url(os.environ.get('RECIDIVIZ_REDIS_URL', 'redis://localhost:6379')).ping())" | grep -q True; then
  echo "✅ Redis is reachable!"
else
  echo "❌ Redis connection failed!"
  exit 1
fi

# Run the investigation command
echo "Running investigation of execution failures..."
uv run python -m app.manage investigate-execution-failures

echo "Investigation completed successfully!"