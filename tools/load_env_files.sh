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

env_file=null
env_staging_file=null
env_prod_file=null
env_test_file=null
env_demo_file=null
env_preview_file=null

handle_options "$@"

# Download env files
echo "Downloading env files..."

# Create the files if they don't exist already
touch .env .env.staging .env.production .env.test .env.preview .env.demo

env=$(gcloud secrets versions access latest --secret=$env_file --project recidiviz-dashboard-staging)
echo "${env}" > .env
env_staging=$(gcloud secrets versions access latest --secret=$env_staging_file --project recidiviz-dashboard-staging)
echo "${env_staging}" > .env.staging
env_prod=$(gcloud secrets versions access latest --secret=$env_prod_file --project recidiviz-dashboard-staging)
echo "${env_prod}" > .env.production
env_test=$(gcloud secrets versions access latest --secret=$env_test_file --project recidiviz-dashboard-staging)
echo "${env_test}" > .env.test

if [ "$env_demo_file" != null ]; then
    env_demo=$(gcloud secrets versions access latest --secret=$env_demo_file --project recidiviz-dashboard-staging)
    echo "${env_demo}" > .env.demo
fi
if [ "$env_preview_file" != null ]; then
    env_preview=$(gcloud secrets versions access latest --secret=$env_preview_file --project recidiviz-dashboard-staging)
    echo "${env_preview}" > .env.preview
fi
