#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

dbs="$(gcloud sql instances list --project recidiviz-dashboard-staging --filter s-db-preview-$VERSION)"

if [[ -z $dbs ]]; then
  # Clone the db if it doesn't already exist
  echo "No databases found. cloning database"
  gcloud sql instances clone sentencing-db s-db-preview-$VERSION --project recidiviz-dashboard-staging --async
fi

# A clone can take longer than gcloud's default 5-minute wait, so wait for it
# here, whether this run started it or an earlier run did.
CLONE_OPERATION_ID="$(gcloud sql operations list --project recidiviz-dashboard-staging --instance s-db-preview-$VERSION --filter "TYPE=CLONE" --format="get(NAME)")"
gcloud sql operations wait --project recidiviz-dashboard-staging --timeout=900 $CLONE_OPERATION_ID

# The clone inherits its source's deletion protection. Checking for it instead
# of patching on every run also catches a clone whose earlier run failed
# before reaching this patch.
if [[ "$(gcloud sql instances describe s-db-preview-$VERSION --project recidiviz-dashboard-staging --format="value(settings.deletionProtectionEnabled)")" == True ]]; then
  gcloud sql instances patch s-db-preview-$VERSION --project recidiviz-dashboard-staging \
    --no-deletion-protection \
    --availability-type=zonal
fi
