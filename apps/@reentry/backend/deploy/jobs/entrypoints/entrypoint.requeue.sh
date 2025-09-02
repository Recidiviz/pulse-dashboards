#!/bin/sh

echo "Starting requeue pending executions job..."

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
REDIS_URL=${RECIDIVIZ_REDIS_URL:-"redis://localhost:6379"}
REDIS_HOST=$(echo $REDIS_URL | sed -E 's/^redis:\/\/([^:]+):([0-9]+)$/\1/')
REDIS_PORT=$(echo $REDIS_URL | sed -E 's/^redis:\/\/([^:]+):([0-9]+)$/\2/')
echo "Checking Redis connection at $REDIS_HOST:$REDIS_PORT..."

if python3 -c "import redis; r = redis.Redis(host='$REDIS_HOST', port=$REDIS_PORT); print(r.ping())" | grep -q True; then
  echo "✅ Redis is reachable!"
else
  echo "❌ Redis connection failed!"
  exit 1
fi

# Run the requeue command
echo "Running requeue pending executions command..."
uv run python -m app.manage requeue-pending-executions

echo "Requeue job completed!"
