#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

# update service account files
echo "Updating service account files..."
firebase_service_account=$(gcloud secrets versions access latest --secret=env_dev_firebase_service_account --project recidiviz-dashboard-staging)
echo "${firebase_service_account}" > ./recidiviz-dev-firebase-service-account.json
service_account=$(gcloud secrets versions access latest --secret=env_dev_service_account --project recidiviz-dashboard-staging)
echo "${service_account}" > ./recidiviz-dev-service-account.json
production_firebase_service_account=$(gcloud secrets versions access latest --secret=env_prod_firebase_service_account --project recidiviz-dashboard-staging)
echo "${production_firebase_service_account}" > ./recidiviz-production-firebase-service-account.json
production_service_account=$(gcloud secrets versions access latest --secret=env_prod_service_account --project recidiviz-dashboard-staging)
echo "${production_service_account}" > ./recidiviz-production-service-account.json

# update auth configs
echo "Updating auth configs..."
auth_config_dev=$(gcloud secrets versions access latest --secret=env_auth_config_dev --project recidiviz-dashboard-staging)
echo "${auth_config_dev}" > ./src/auth_config_dev.json
auth_config_demo=$(gcloud secrets versions access latest --secret=env_auth_config_demo --project recidiviz-dashboard-staging)
echo "${auth_config_demo}" > ./src/auth_config_demo.json
auth_config_production=$(gcloud secrets versions access latest --secret=env_auth_config_production --project recidiviz-dashboard-staging)
echo "${auth_config_production}" > ./src/auth_config_production.json

# update GAE yaml files
echo "Update GAE yaml files..."
gae_staging=$(gcloud secrets versions access latest --secret=env_gae_staging --project recidiviz-dashboard-staging)
echo "${gae_staging}" > ./gae-staging.yaml
gae_staging_demo=$(gcloud secrets versions access latest --secret=env_gae_staging_demo --project recidiviz-dashboard-staging)
echo "${gae_staging_demo}" > ./gae-staging-demo.yaml
gae_production=$(gcloud secrets versions access latest --secret=env_gae_production --project recidiviz-dashboard-staging)
echo "${gae_production}" > ./gae-production.yaml
