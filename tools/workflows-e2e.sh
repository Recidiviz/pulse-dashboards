#!/bin/zsh

BASH_SOURCE_DIR=$(dirname "${BASH_SOURCE[0]}")

# Tear down docker compose whenever the script EXITs, either due to error or successful completion
trap "docker compose -f '${BASH_SOURCE_DIR}/docker-compose.e2e.yaml' down" EXIT

yarn build-e2e

docker compose -f "${BASH_SOURCE_DIR}/docker-compose.e2e.yaml" up -d --wait

yarn test-e2e-workflows
