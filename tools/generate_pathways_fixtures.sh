#!/usr/bin/env bash

container_name=$(docker container ps --filter "name=case_triage_backend" --format "{{.Names}}")

if [[ ! $container_name ]]; then
    echo "Docker container is not running. Run \`yarn offline:be\` to start it."
    exit 1
fi

docker exec $container_name pipenv run python -m recidiviz.tools.pathways.generate_demo_data --state_codes US_OZ --output_directory recidiviz/local/fixtures --headers true
