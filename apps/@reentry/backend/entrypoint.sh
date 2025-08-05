#!/bin/sh

if [ "$ENTRYPOINT" = "api" ]; then
    uv run alembic upgrade head
    uv run fastapi run
elif [ "$ENTRYPOINT" = "worker" ]; then
    uv run taskiq worker main:broker
else
    echo "Invalid ENTRYPOINT specified. Possible options are 'api' or 'worker'. Exiting."
    exit 1
fi
