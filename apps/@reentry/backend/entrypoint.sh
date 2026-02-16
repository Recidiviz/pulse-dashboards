#!/bin/sh
set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

if [ "$ENTRYPOINT" = "api" ]; then
    echo "Running database migrations..."
    if ! uv run alembic upgrade head; then
        echo "ERROR: Database migration failed" >&2
        exit 1
    fi
    echo "Starting FastAPI application..."
    uv run fastapi run
elif [ "$ENTRYPOINT" = "worker" ]; then
    uv run taskiq worker main:broker
else
    echo "Invalid ENTRYPOINT specified. Possible options are 'api' or 'worker'. Exiting."
    exit 1
fi
