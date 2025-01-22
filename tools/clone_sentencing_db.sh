#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

dbs="$(gcloud sql instances list --project recidiviz-dashboard-staging --filter s-db-preview-$VERSION)"

if [[ -z $dbs ]]; then
  # Clone the db if it doesn't already exist
  echo "No databases found. cloning database"
  gcloud sql instances clone sentencing-db s-db-preview-$VERSION --project recidiviz-dashboard-staging
  gcloud sql instances patch s-db-preview-$VERSION --project recidiviz-dashboard-staging \
    --no-deletion-protection \
    --availability-type=zonal
else
  # Wait for the clone operation to finish if it does already exist
  CLONE_OPERATION_ID="$(gcloud sql operations list --project recidiviz-dashboard-staging --instance s-db-preview-$VERSION --filter "TYPE=CLONE" --format="get(NAME)")"
  gcloud sql operations wait --project recidiviz-dashboard-staging $CLONE_OPERATION_ID
fi
