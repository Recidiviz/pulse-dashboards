#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

db_name="m-db-preview-${VERSION,,}"
service_name="m-preview-${VERSION,,}"
migrate_job_name="m-migrate-preview-db-${VERSION,,}"

dbs="$(gcloud sql instances list --project recidiviz-dashboard-staging --filter "$db_name")"
services="$(gcloud run services list --project recidiviz-dashboard-staging --filter "$service_name")"
migrate_jobs="$(gcloud run jobs list --project recidiviz-dashboard-staging --filter "$migrate_job_name")"


if [[ $dbs ]]; then
  # Cloud SQL rejects deleting an instance while its clone is still running, so
  # wait for the clone first. A clone can take longer than gcloud's default
  # 5-minute wait. A failed clone leaves a FAILED instance whose wait exits
  # non-zero, and that instance still needs deleting, so the wait's result is
  # ignored; if the clone is somehow still running, the delete fails instead.
  CLONE_OPERATION_ID="$(gcloud sql operations list --project recidiviz-dashboard-staging --instance "$db_name" --filter "TYPE=CLONE" --format="get(NAME)")"
  gcloud sql operations wait --project recidiviz-dashboard-staging --timeout=900 "$CLONE_OPERATION_ID" || true

  gcloud sql instances delete "$db_name" --project recidiviz-dashboard-staging -q
fi


if [[ $services ]]; then
  gcloud run services delete "$service_name" --project recidiviz-dashboard-staging --region us-central1 -q
fi

if [[ $migrate_jobs ]]; then
  gcloud run jobs delete "$migrate_job_name" --project recidiviz-dashboard-staging --region us-central1 -q
fi
