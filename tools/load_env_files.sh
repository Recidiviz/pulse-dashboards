#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

env_file=$1
env_staging_file=$2
env_prod_file=$3
env_test_file=$4

# Download env files
echo "Downloading env files..."

# Create the files if they don't exist already
touch .env .env.staging .env.prod .env.test

env=$(gcloud secrets versions access latest --secret=$env_file --project recidiviz-dashboard-staging)
echo "${env}" > .env
env_staging=$(gcloud secrets versions access latest --secret=$env_staging_file --project recidiviz-dashboard-staging)
echo "${env_staging}" > .env.staging
env_prod=$(gcloud secrets versions access latest --secret=$env_prod_file --project recidiviz-dashboard-staging)
echo "${env_prod}" > .env.production
env_test=$(gcloud secrets versions access latest --secret=$env_test_file --project recidiviz-dashboard-staging)
echo "${env_test}" > .env.test
