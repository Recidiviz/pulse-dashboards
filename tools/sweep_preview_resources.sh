#!/usr/bin/env bash

# Deletes the preview Cloud SQL instances, Cloud Run services, and Cloud Run
# jobs in recidiviz-dashboard-staging that belong to closed PRs, or to open PRs
# with no activity for STALE_DAYS days.
#
# Each preview resource is named <prefix>-pr<PR number>-<branch fragment>. For
# example, given these resources:
#
#   s-db-preview-pr15774-jdoe-add-export    (PR 15774 merged yesterday)
#   ss-preview-pr15774-jdoe-add-export
#   m-db-preview-pr15801-asmith-fix-login   (PR 15801 open, updated today)
#   m-db-preview-pr15120-bsmith-new-table   (PR 15120 open, last updated 55 days ago)
#
# ...the sweep runs cleanup_sentencing_preview_resources.sh once with
# VERSION=pr15774-jdoe-add-export, which deletes both PR 15774 resources, runs
# cleanup_meetings_preview_resources.sh for PR 15120, and leaves PR 15801's
# instance alone. The next push to PR 15120 recreates its preview, because the
# deploy workflow clones the database again when it is missing.
#
# Set DRY_RUN=1 to list what would be deleted without deleting anything.

set -euo pipefail

project=recidiviz-dashboard-staging
region=us-central1
repo=Recidiviz/pulse-dashboards
tools_dir="$(dirname "$0")"
dry_run="${DRY_RUN:-}"
# A preview run that was still building when its PR closed keeps creating
# resources for up to about 30 minutes, so the sweep leaves a PR's resources
# alone until it has been closed this long.
grace_seconds="${GRACE_SECONDS:-3600}"
# Any PR activity (a push, a comment, a review, a label) counts as an update.
stale_seconds=$(( ${STALE_DAYS:-14} * 86400 ))

# The name prefixes that each app's cleanup script deletes. The second capture
# group is the VERSION that script expects.
sentencing_pattern='^(s-db-preview|ss-preview|ss-migrate-preview-db|s-data-import-preview)-(pr[0-9]+-.+)$'
meetings_pattern='^(m-db-preview|m-preview|m-migrate-preview-db)-(pr[0-9]+-.+)$'

names="$(gcloud sql instances list --project "$project" --format="value(name)")"
names+=$'\n'"$(gcloud run services list --project "$project" --region "$region" --format="value(metadata.name)")"
names+=$'\n'"$(gcloud run jobs list --project "$project" --region "$region" --format="value(metadata.name)")"

# One "<app> <VERSION>" line per preview, however many resources it has.
targets="$(
  while read -r name; do
    if [[ $name =~ $sentencing_pattern ]]; then
      echo "sentencing ${BASH_REMATCH[2]}"
    elif [[ $name =~ $meetings_pattern ]]; then
      echo "meetings ${BASH_REMATCH[2]}"
    fi
  done <<< "$names" | sort -u
)"

failures=0
mapfile -t target_list <<< "$targets"
for target in "${target_list[@]}"; do
  [[ -z $target ]] && continue
  read -r app version <<< "$target"
  pr="${version#pr}"
  pr="${pr%%-*}"

  # Prints the PR's state and how many seconds ago it closed or, for an open
  # PR, was last updated, e.g. "MERGED 86400" or "OPEN 4752000".
  if ! pr_status="$(gh pr view "$pr" --repo "$repo" --json state,closedAt,updatedAt \
    --jq 'if .state == "OPEN" then "OPEN \(now - (.updatedAt | fromdateiso8601) | floor)" else "\(.state) \(now - (.closedAt | fromdateiso8601) | floor)" end')"; then
    echo "::error::Couldn't look up PR #$pr for $app preview $version"
    failures=$((failures + 1))
    continue
  fi
  read -r state idle_seconds <<< "$pr_status"

  if [[ $state == OPEN ]]; then
    if (( idle_seconds < stale_seconds )); then
      continue
    fi
    echo "Deleting $app preview $version (PR #$pr is open but idle for $((idle_seconds / 86400)) days)"
  elif (( idle_seconds < grace_seconds )); then
    echo "Skipping $app preview $version: PR #$pr closed ${idle_seconds}s ago"
    continue
  else
    echo "Deleting $app preview $version (PR #$pr is $state)"
  fi
  if [[ -n $dry_run ]]; then
    continue
  fi
  if ! VERSION="$version" "$tools_dir/cleanup_${app}_preview_resources.sh" < /dev/null; then
    echo "::error::Failed to delete $app preview $version"
    failures=$((failures + 1))
  fi
done

if (( failures > 0 )); then
  echo "$failures preview(s) failed; the next sweep will retry them"
  exit 1
fi
