#!/usr/bin/env bash

# Loads appropriate environment variables into the shell. 
# Usage: `source ./load_environment.sh <env_secret_1_name,env_secret_2_name>` && <command to start environment>
# env_secret_names:
# env_dev_spa - env vars for the dev frontend
# env_dev_server - env vars for the dev backend
# env_dev_be_spa - env vars for the dev new backend - overrides a var in env_dev_server
# env_dev_demo_spa - env vars for the local dev frontend in demo mode - overrides a few vars in env_dev_spa
# env_dev_demo_server - env vars for the dev backend in demo mode - overrides a few vars in env_dev_server
# env_e2e - env vars to run the e2e tests
# env_staging - env vars to build the app for the deployed frontend staging environment
# env_staging_demo - env vars to build the app for the deployed frontend staging demo environment
# env_production - env vars to build the app for the deployed frontend production environment
# env_sync_content - env vars to sync content from the Pathways content google sheet

echo "Updating environment..."
# Parse environment(s) arg
IFS=$',' read -r -d '' -a environments <<< "$1"

# For every environment in the args, fetch the secret and load the args
for env in "${environments[@]}"
do
    vars=$(gcloud secrets versions access latest --secret=$env --project recidiviz-dashboard-staging)

    IFS=$'\n' read -r -d '' -a var_array <<< "$vars"
    for element in "${var_array[@]}"
    do
        export "$element"
    done
done

# Manually override environment vars here if needed
# Example:
# export RUN_TESTS_HEADLESS=false
