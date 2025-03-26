#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

db_name="s-db-preview-$VERSION"
service_name="ss-preview-$VERSION"
migrate_job_name="ss-migrate-preview-db-$VERSION"
import_job_name="s-data-import-preview-$VERSION"

dbs="$(gcloud sql instances list --project recidiviz-dashboard-staging --filter $db_name)"
services="$(gcloud run services list --project recidiviz-dashboard-staging --filter $service_name)"
migrate_jobs="$(gcloud run jobs list --project recidiviz-dashboard-staging --filter $migrate_job_name)"
import_jobs="$(gcloud run jobs list --project recidiviz-dashboard-staging --filter $import_job_name)"


if [[ $dbs ]]; then
  # Wait for the clone operation to finish if it does already exist (we have to wait for the clone operation to finish before we can delete the database)
  CLONE_OPERATION_ID="$(gcloud sql operations list --project recidiviz-dashboard-staging --instance $db_name --filter "TYPE=CLONE" --format="get(NAME)")"
  gcloud sql operations wait --project recidiviz-dashboard-staging $CLONE_OPERATION_ID

  gcloud sql instances delete $db_name --project recidiviz-dashboard-staging -q
fi


if [[ $services ]]; then
  gcloud run services delete $service_name --project recidiviz-dashboard-staging --region us-central1 -q
fi

if [[ $migrate_jobs ]]; then
  gcloud run jobs delete $migrate_job_name --project recidiviz-dashboard-staging --region us-central1 -q
fi

if [[ $import_jobs ]]; then
  gcloud run jobs delete $import_job_name --project recidiviz-dashboard-staging --region us-central1 -q
fi
