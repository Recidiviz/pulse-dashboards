#!/usr/bin/env bash

# -e Exit on error
# -u Error on unset variables
# -o pipefail Ensure entire pipeline returns non-zero status if part of it fails
set -euo pipefail

has_argument() {
    [[ ("$1" == *=* && -n ${1#*=}) || ( ! -z "$2" && "$2" != -*)  ]];
}

extract_argument() {
  echo "${2:-${1#*=}}"
}

handle_options() {
  while [ $# -gt 0 ]; do
    case $1 in
      --env)
        if ! has_argument $@; then
          echo "File not specified." >&2
          exit 1
        fi

        env_file=$(extract_argument $@)

        shift
        ;;
      --env_staging)
        if ! has_argument $@; then
          echo "File not specified." >&2
          exit 1
        fi

        env_staging_file=$(extract_argument $@)

        shift
        ;;
      --env_prod)
        if ! has_argument $@; then
          echo "File not specified." >&2
          exit 1
        fi

        env_prod_file=$(extract_argument $@)

        shift
        ;;
      --env_test)
        if ! has_argument $@; then
          echo "File not specified." >&2
          exit 1
        fi

        env_test_file=$(extract_argument $@)

        shift
        ;;
      --env_dev_gcp)
        if ! has_argument $@; then
          echo "File not specified." >&2
          exit 1
        fi

        env_dev_gcp_file=$(extract_argument $@)

        shift
        ;;
      --env_demo)
        if ! has_argument $@; then
          echo "File not specified." >&2
          exit 1
        fi

        env_demo_file=$(extract_argument $@)

        shift
        ;;
      --env_preview)
        if ! has_argument $@; then
          echo "File not specified." >&2
          exit 1
        fi

        env_preview_file=$(extract_argument $@)

        shift
        ;;
      *)
        echo "Invalid option: $1" >&2
        exit 1
        ;;
    esac
    shift
  done
}

# Returns 0 when running in GitHub Actions on a pull_request workflow
is_github_actions_pr() {
  [ "${GITHUB_ACTIONS:-false}" = "true" ] && [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ]
}

env_file=null
env_staging_file=null
env_prod_file=null
env_test_file=null
env_dev_gcp_file=null
env_demo_file=null
env_preview_file=null

handle_options "$@"

# Download env files
echo "Downloading env files..."

# If running on GitHub Actions for a pull_request, do not download secrets
if is_github_actions_pr; then
  echo "GitHub Actions pull_request detected; skipping secret download and creating placeholder env files."
  touch .env .env.staging .env.production .env.test .env.dev_gcp .env.preview .env.demo
  exit 0
fi

# Require gcloud locally or in non-PR CI runs
if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud not found. Install and authenticate gcloud, or run in GitHub Actions PR to auto-skip." >&2
  exit 1
fi

# Ensure an active gcloud account is configured
active_account=$(gcloud auth list --format="value(account)" --filter="status:ACTIVE" 2>/dev/null || true)
if [ -z "$active_account" ]; then
  echo "ERROR: No active gcloud account. Run 'gcloud auth login' or configure CI auth." >&2
  exit 1
fi

if [ "$env_file" != null ]; then
  env=$(gcloud secrets versions access latest --secret=$env_file --project recidiviz-dashboard-staging)
  echo "${env}" > .env
fi

if [ "$env_staging_file" != null ]; then
env_staging=$(gcloud secrets versions access latest --secret=$env_staging_file --project recidiviz-dashboard-staging)
echo "${env_staging}" > .env.staging
fi

if [ "$env_prod_file" != null ]; then
env_prod=$(gcloud secrets versions access latest --secret=$env_prod_file --project recidiviz-dashboard-staging)
echo "${env_prod}" > .env.production
fi

if [ "$env_test_file" != null ]; then
env_test=$(gcloud secrets versions access latest --secret=$env_test_file --project recidiviz-dashboard-staging)
echo "${env_test}" > .env.test
fi

if [ "$env_dev_gcp_file" != null ]; then
    env_dev_gcp=$(gcloud secrets versions access latest --secret=$env_dev_gcp_file --project recidiviz-dashboard-staging)
    echo "${env_dev_gcp}" > .env.dev_gcp
fi

if [ "$env_demo_file" != null ]; then
    env_demo=$(gcloud secrets versions access latest --secret=$env_demo_file --project recidiviz-dashboard-staging)
    echo "${env_demo}" > .env.demo
fi

if [ "$env_preview_file" != null ]; then
    env_preview=$(gcloud secrets versions access latest --secret=$env_preview_file --project recidiviz-dashboard-staging)
    echo "${env_preview}" > .env.preview
fi
