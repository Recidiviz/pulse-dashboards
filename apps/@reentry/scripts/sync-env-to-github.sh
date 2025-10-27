#!/bin/bash
set -e

# Script to sync local files to GitHub secrets for reentry backend and frontend
# Usage: Can be run from anywhere:
#   ./apps/@reentry/scripts/sync-env-to-github.sh

# Change to the script's directory
cd "$(dirname "$0")"

REPO="Recidiviz/pulse-dashboards"

# Define files and their corresponding secret names (parallel arrays)
FILES=(
  "../backend/.env"
  "../frontend/.env"
  "../backend/.secrets/github-reentry-ci-service-account-key.json"
)
SECRET_NAMES=(
  "REENTRY_BACKEND_CI_ENV"
  "REENTRY_FRONTEND_CI_ENV"
  "REENTRY_GITHUB_CI_GCP_SERVICE_ACCOUNT"
)

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Syncing local files to GitHub secrets...${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed!${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI${NC}"
    exit 1
fi

echo -e "${YELLOW}Repository: $REPO${NC}"
echo ""

# Loop through each file
UPLOADED=0
SKIPPED=0

for i in "${!FILES[@]}"; do
    FILE="${FILES[$i]}"
    SECRET_NAME="${SECRET_NAMES[$i]}"

    echo -e "${YELLOW}File: $FILE → $SECRET_NAME${NC}"

    # Check if file exists
    if [ ! -f "$FILE" ]; then
        echo -e "${RED}  ✗ File not found! Skipping...${NC}"
        echo ""
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    # Show file size/info
    FILE_SIZE=$(wc -l < "$FILE" | tr -d ' ')
    echo -e "  File contains ${FILE_SIZE} lines"

    # Prompt for this specific file
    read -p "  Upload this file? (y/n): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}  Skipped${NC}"
        echo ""
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    # Read the file and set it as a secret
    FILE_CONTENT=$(cat "$FILE")

    echo "$FILE_CONTENT" | gh secret set "$SECRET_NAME" --repo "$REPO"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✓ Success!${NC}"
        UPLOADED=$((UPLOADED + 1))
    else
        echo -e "${RED}  ✗ Failed to set secret${NC}"
        SKIPPED=$((SKIPPED + 1))
    fi
    echo ""
done

echo -e "${GREEN}Done!${NC}"
echo -e "${GREEN}Uploaded: ${UPLOADED}${NC} | ${YELLOW}Skipped: ${SKIPPED}${NC}"
