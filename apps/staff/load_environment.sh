#!/usr/bin/env bash

# Loads appropriate environment variables into the shell. 
# Usage: `. load_environment.sh <env_secret_1_name,env_secret_2_name>` && <command to start environment>
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

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

valid_environments=(
    "env_dev_spa"
    "env_dev_server"
    "env_dev_be_spa"
    "env_dev_demo_spa"
    "env_dev_demo_server"
    "env_e2e"
    "env_staging"
    "env_staging_demo"
    "env_production"
    "env_sync_content"
)

# Function to trim leading and trailing whitespace
trim() {
    echo "$1" | awk '{$1=$1;print}'
}

print_valid_environments() {
    echo "Please provide one or more from this list: "
    for valid_env in "${valid_environments[@]}"; do
        echo "$valid_env"
    done
}

echo "Updating environment..."
# Read exits with a status of 1 when it reaches EOF or end of input
IFS=$',' read -r -d '' -a environments <<< "$1" || echo "Read command reached EOF, continuing the script."

echo "Checking environments..."
for env in "${environments[@]}"; do
    if [ -n "$env" ]; then
        valid=false

        env=$(trim "$env")
        
        # Check if the environment is in the list of valid environments
        for valid_env in "${valid_environments[@]}"; do
            valid_env=$(trim "$valid_env")
            if [ "$env" = "$valid_env" ]; then
                valid=true
                break
            fi
        done
        if [ "$valid" = true ]; then
            echo "Continuing with valid environment: $env"
        else
            echo "Invalid environment provided: $env."
            print_valid_environments
            exit 1;
        fi
    else
        echo "Missing environment argument." 
        exit 1;
        print_valid_environments
    fi
done

# For every environment in the args, fetch the secret and load the args
for env in "${environments[@]}"
do
    vars=$(gcloud secrets versions access latest --secret=$env --project recidiviz-dashboard-staging) 2> gcloud_error.log || {
        echo "Error accessing gcloud secrets, check user's gcloud access for: $(gcloud config get account)"
        cat gcloud_error.log
        exit 1;
    }

    IFS=$'\n' read -r -d '' -a var_array <<< "$vars" || {
        echo "Read command reached EOF, continuing the script"
    }

    for element in "${var_array[@]}"
    do
        export "$element"
    done
done

echo "Done loading environment variables."

# Manually override environment vars here if needed
# Example:
# export RUN_TESTS_HEADLESS=false
