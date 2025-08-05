#!/bin/sh

# initialize the cloud sql proxy
cloud-sql-proxy --port 5432 $RECIDIVIZ_POSTGRES_SERVER &

# wait for the cloud sql proxy to be ready
until nc -z localhost 5432; do
  echo "Waiting for Cloud SQL Proxy to be ready..."
  sleep 2
done


if [ "$ENTRYPOINT" = "api" ]; then
    echo "Running database migrations..."
    uv run alembic upgrade head
    echo "Seeding database..."
    uv run python -m app.manage seed-db
    #echo "Populating intakes from OMS..."
    echo "Starting FastAPI application..."
    uv run fastapi run --host 0.0.0.0 --port $PORT
elif [ "$ENTRYPOINT" = "worker" ]; then
    # checking redis connection in the worker
    REDIS_URL=${RECIDIVIZ_REDIS_URL:-"redis://localhost:6379"}
    REDIS_HOST=$(echo $REDIS_URL | sed -E 's/^redis:\/\/([^:]+):([0-9]+)$/\1/')
    REDIS_PORT=$(echo $REDIS_URL | sed -E 's/^redis:\/\/([^:]+):([0-9]+)$/\2/')
    echo "Pinging Redis server at $REDIS_HOST:$REDIS_PORT..."
    if python3 -c "import redis; r = redis.Redis(host='$REDIS_HOST', port=$REDIS_PORT); print(r.ping())" | grep -q True; then
      echo "✅ Redis is reachable!"
    else
      echo "❌ Redis connection failed!"
      exit 1
    fi

    # adding healthcheck endpoint for the worker
    mkdir /tmp/recidiviz-healthcheck
    uv run python -m http.server 8080  -d /tmp/recidiviz-healthcheck &

    # run the worker
    uv run taskiq worker main:broker --log-level DEBUG
else
    echo "Invalid ENTRYPOINT specified. Possible options are 'api' or 'worker'. Exiting."
    exit 1
fi
