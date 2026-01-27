#!/bin/bash

# Script to apply CORS configuration to all GCS buckets
# Each bucket gets access only from its corresponding frontend URL

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Applying CORS to all GCS buckets"
echo "=========================================="
echo ""

# Define bucket-to-config mappings
declare -A BUCKET_CONFIGS=(
    ["recidiviz-recording-bucket-dev"]="cors-config-dev.json"
    ["recidiviz-recording-bucket-staging"]="cors-config-staging.json"
    ["recidiviz-recording-bucket-demo"]="cors-config-demo.json"
    ["recidiviz-recording-bucket-production"]="cors-config-production.json"
    ["recidiviz-recording-bucket-pilot"]="cors-config-pilot.json"
    ["recidiviz-dev-bucket-1"]="cors-config-dev.json"
)

# Counter for success/failure
SUCCESS=0
FAILED=0

# Apply CORS to each bucket
for BUCKET in "${!BUCKET_CONFIGS[@]}"; do
    CONFIG="${BUCKET_CONFIGS[$BUCKET]}"
    CONFIG_PATH="${SCRIPT_DIR}/${CONFIG}"

    echo "-------------------------------------------"
    echo "Bucket: $BUCKET"
    echo "Config: $CONFIG"
    echo "-------------------------------------------"

    # Check if config file exists
    if [ ! -f "$CONFIG_PATH" ]; then
        echo "❌ ERROR: Config file not found: $CONFIG_PATH"
        ((FAILED++))
        continue
    fi

    # Show the CORS config that will be applied
    echo "CORS configuration:"
    cat "$CONFIG_PATH" | jq '.[] | {origin: .origin}'
    echo ""

    # Apply CORS configuration
    if gsutil cors set "$CONFIG_PATH" "gs://$BUCKET" 2>&1; then
        echo "✅ Successfully applied CORS to $BUCKET"
        ((SUCCESS++))

        # Verify the configuration
        echo "Verifying CORS configuration..."
        gsutil cors get "gs://$BUCKET"
        echo ""
    else
        echo "❌ Failed to apply CORS to $BUCKET"
        ((FAILED++))
    fi

    echo ""
done

echo "=========================================="
echo "CORS Configuration Summary"
echo "=========================================="
echo "✅ Successful: $SUCCESS"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All CORS configurations applied successfully!"
    exit 0
else
    echo "⚠️  Some CORS configurations failed. Please check the errors above."
    exit 1
fi
