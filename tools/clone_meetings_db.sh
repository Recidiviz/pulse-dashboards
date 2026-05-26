#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

db_name="m-db-preview-$VERSION"

dbs="$(gcloud sql instances list --project recidiviz-dashboard-staging --filter "$db_name")"

if [[ -z $dbs ]]; then
  # Clone the db if it doesn't already exist
  echo "No databases found. cloning database"
  gcloud sql instances clone meetings "$db_name" --project recidiviz-dashboard-staging
  gcloud sql instances patch "$db_name" --project recidiviz-dashboard-staging \
    --no-deletion-protection \
    --availability-type=zonal
else
  # Wait for the clone operation to finish if it does already exist
  CLONE_OPERATION_ID="$(gcloud sql operations list --project recidiviz-dashboard-staging --instance "$db_name" --filter "TYPE=CLONE" --format="get(NAME)")"
  gcloud sql operations wait --project recidiviz-dashboard-staging "$CLONE_OPERATION_ID"
fi
