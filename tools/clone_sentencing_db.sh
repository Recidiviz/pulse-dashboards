#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

dbs="$(gcloud sql instances list --project recidiviz-dashboard-staging --filter s-db-preview-$VERSION)"

if [[ -z $dbs ]]; then
  echo "No databases found. cloning database"
  gcloud sql instances clone sentencing-db s-db-preview-$VERSION --project recidiviz-dashboard-staging
  gcloud sql instances patch s-db-preview-$VERSION --project recidiviz-dashboard-staging --no-deletion-protection
fi
