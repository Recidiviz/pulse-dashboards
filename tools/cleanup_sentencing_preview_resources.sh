#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

db_name="s-db-preview-$VERSION"
service_name="ss-preview-$VERSION"
job_name="ss-migrate-preview-db-$VERSION"

dbs="$(gcloud sql instances list --project recidiviz-dashboard-staging --filter $db_name)"
services="$(gcloud run services list --project recidiviz-dashboard-staging --filter $service_name)"
jobs="$(gcloud run jobs list --project recidiviz-dashboard-staging --filter $job_name)"


if [[ $dbs ]]; then
  # Wait for the clone operation to finish if it does already exist (we have to wait for the clone operation to finish before we can delete the database)
  CLONE_OPERATION_ID="$(gcloud sql operations list --project recidiviz-dashboard-staging --instance $db_name --filter "TYPE=CLONE" --format="get(NAME)")"
  gcloud sql operations wait --project recidiviz-dashboard-staging $CLONE_OPERATION_ID

  gcloud sql instances delete $db_name --project recidiviz-dashboard-staging -q
fi


if [[ $services ]]; then
  gcloud run services delete $service_name --project recidiviz-dashboard-staging --region us-central1 -q
fi

if [[ $jobs ]]; then
  gcloud run jobs delete $job_name --project recidiviz-dashboard-staging --region us-central1 -q
fi
