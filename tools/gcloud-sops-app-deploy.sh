#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   gcloud-sops-app-deploy encrypted-app.enc.yaml [additional gcloud args...]

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <encrypted-app.yaml> [gcloud deploy args...]"
  exit 1
fi

ENCRYPTED="$1"
shift || true

# Create secure temporary workspace
WORKDIR="$(mktemp -d)"
DECRYPTED_NAME="$(basename "$ENCRYPTED")"
DECRYPTED="$WORKDIR/${DECRYPTED_NAME%.enc.yaml}.yaml"

# Ensure cleanup even if interrupted
cleanup() {
  rm -rf "$WORKDIR"
}
trap cleanup EXIT INT TERM HUP

# Decrypt into temp directory
if ! sops -d "$ENCRYPTED" > "$DECRYPTED"; then
  echo "Error: Failed to decrypt $ENCRYPTED with sops" >&2
  exit 1
fi

# Deploy using gcloud, passing through extra args
if ! gcloud app deploy "$DECRYPTED" "$@"; then
  echo "Error: Failed to deploy with gcloud app deploy" >&2
  exit 1
fi
