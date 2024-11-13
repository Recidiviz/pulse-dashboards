#!/usr/bin/env bash

export OFFLINE_MODE_DIRECTORY="src/server/core/offline_config"

# Generate the list of files that, when changed, should restart the server (which re-imports them into the DB).
# The paths need to be relative to what's inside the container and joined by ':', so find them in our demo data,
# get just the file names, prepend the path the container is looking for them at, and join them with ':'.
export FIXTURE_FILES=$(find src/server/core/demo_data/*.csv | xargs basename | xargs printf "recidiviz/local/fixtures/%s\n" | paste -s -d ":" -)

docker compose up
