#!/usr/bin/env bash
set -euo pipefail

source ../../../tools/load_env_files.sh --env_preview env_preview_sentencing_server

set -a
[ -f .env.preview ] && source .env.preview
set +a

gcloud run jobs deploy ss-migrate-preview-db-$VERSION \
  --image us-central1-docker.pkg.dev/recidiviz-dashboard-staging/sentencing/sentencing-server-preview:$VERSION \
  --region us-central1 --execute-now --wait \
  --command ./scripts/migrate-dbs.sh \
  --set-env-vars DATABASE_URL_US_ID=$DATABASE_URL_US_ID-$VERSION,DATABASE_URL_US_ND=$DATABASE_URL_US_ND-$VERSION \
  --project recidiviz-dashboard-staging \
  --set-cloudsql-instances recidiviz-dashboard-staging:us-central1:s-db-preview-$VERSION \
  --service-account sentencing@recidiviz-dashboard-staging.iam.gserviceaccount.com
