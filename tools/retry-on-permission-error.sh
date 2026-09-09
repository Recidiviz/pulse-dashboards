#!/usr/bin/env bash
# Retry a command for as long as it fails with an HTTP 403.
#
# A go/jit2 (Privileged Access Manager) grant takes effect by way of a conditional
# IAM binding, and that binding is not enforced instantly. Measured spread on the
# same entitlement and role: under 12 seconds on one project, still denied at 65
# seconds on another. Google documents up to 2 minutes, and rarely up to 7.
#
# So a command run straight after a grant fails with 403 even though the grant is
# correct. Waiting is the only remedy. Jen hit this on 2026-09-08 while she pushed
# Firestore rules to production, retried by hand three times inside 65 seconds, and
# reasonably concluded the lane was missing a permission.
#
# Only a 403 is retried. Every other failure -- a rules compile error above all --
# is deterministic, so it exits at once rather than after a pointless wait.
set -uo pipefail

ATTEMPTS="${RETRY_ATTEMPTS:-4}"
DELAY_SECONDS="${RETRY_DELAY_SECONDS:-30}"

if [[ $# -eq 0 ]]; then
  echo "usage: $(basename "$0") <command> [args...]" >&2
  exit 64
fi

output="$(mktemp)"
trap 'rm -f "$output"' EXIT

for (( attempt = 1; attempt <= ATTEMPTS; attempt++ )); do
  if "$@" 2>&1 | tee "$output"; then
    exit 0
  fi
  status=${PIPESTATUS[0]}

  if ! grep -q "403" "$output"; then
    exit "$status"
  fi
  if (( attempt == ATTEMPTS )); then
    echo "" >&2
    echo "Still denied after ${ATTEMPTS} attempts. If you hold a fresh go/jit2 grant," >&2
    echo "the binding should be live by now, so treat this as a real missing permission." >&2
    exit "$status"
  fi

  echo "" >&2
  echo "Got a 403. A just-granted go/jit2 role can take up to 2 minutes to take" >&2
  echo "effect, so waiting ${DELAY_SECONDS}s and trying again (attempt $(( attempt + 1 )) of ${ATTEMPTS})." >&2
  sleep "$DELAY_SECONDS"
done
