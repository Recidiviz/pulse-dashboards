#!/bin/bash
set -e

SCHEMA_FILE="libs/@reentry/openapi-types/src/recidiviz-schema.d.ts"

# Generate OpenAPI types
openapi-typescript http://127.0.0.1:8000/openapi.json -o "$SCHEMA_FILE"

# Prepend license header
cat tools/license-header.txt "$SCHEMA_FILE" > "$SCHEMA_FILE.tmp"
mv "$SCHEMA_FILE.tmp" "$SCHEMA_FILE"

# Format with prettier
# Note: tabWidth is configured in .prettierrc overrides for this file.
# The lint-staged part of pre-commit also calls prettier but that is sometimes
# skipped with the --no-verify. We add the prettier here to ensure formatting. 
yarn prettier --write "$SCHEMA_FILE"
