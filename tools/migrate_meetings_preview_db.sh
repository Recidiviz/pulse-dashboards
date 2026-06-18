#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

version="${VERSION,,}"

gcloud run jobs deploy "m-migrate-preview-db-$version" \
  --image "us-central1-docker.pkg.dev/recidiviz-dashboard-staging/meetings/meetings-server-preview:$VERSION" \
  --region us-central1 \
  --execute-now \
  --wait \
  --command ./scripts/migrate-dbs.sh \
  --clear-secrets \
  --set-env-vars "^|^DATABASE_USER=$DATABASE_USER|DATABASE_PASSWORD=$DATABASE_PASSWORD|DATABASE_INSTANCE_CONNECTION_NAME=$DATABASE_INSTANCE_CONNECTION_NAME|DATABASE_STATE_CODES=$DATABASE_STATE_CODES" \
  --project recidiviz-dashboard-staging \
  --set-cloudsql-instances "recidiviz-dashboard-staging:us-central1:m-db-preview-$version" \
  --service-account meetings@recidiviz-dashboard-staging.iam.gserviceaccount.com \
  --task-timeout 300s
