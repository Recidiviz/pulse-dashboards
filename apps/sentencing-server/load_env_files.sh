#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

# Download env files
echo "Downloading env files..."

# Create the files if they don't exist already
touch .env .env.staging .env.prod .env.test

env=$(gcloud secrets versions access latest --secret=env_sentencing_server --project recidiviz-dashboard-staging)
echo "${env}" > .env
env_staging=$(gcloud secrets versions access latest --secret=env_staging_sentencing_server --project recidiviz-dashboard-staging)
echo "${env_staging}" > .env.staging
env_prod=$(gcloud secrets versions access latest --secret=env_prod_sentencing_server --project recidiviz-dashboard-staging)
echo "${env_prod}" > .env.prod
env_test=$(gcloud secrets versions access latest --secret=env_test_sentencing_server --project recidiviz-dashboard-staging)
echo "${env_test}" > .env.test
