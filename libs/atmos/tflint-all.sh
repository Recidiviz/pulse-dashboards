#!/bin/bash

# Parse arguments
FIX_MODE=false
if [[ "$1" == "--fix" ]]; then
    FIX_MODE=true
    echo "Running in fix mode"
fi

FAILED=0
CONFIG_PATH=$(realpath .tflint.hcl)
tflint -c="${CONFIG_PATH}" --init

# Build tflint command arguments
TFLINT_ARGS=(-c="${CONFIG_PATH}")
if [[ "$FIX_MODE" == true ]]; then
    TFLINT_ARGS+=(--fix)
fi

while IFS= read -r -d '' dir; do
    # Check if directory contains any .tf files
    shopt -s nullglob
    tf_files=("$dir"/*.tf)
    shopt -u nullglob

    if [[ ${#tf_files[@]} -gt 0 ]]; then
        if [[ "$FIX_MODE" == true ]]; then
            echo "Linting and fixing: $dir"
        else
            echo "Linting: $dir"
        fi
        if ! tflint "${TFLINT_ARGS[@]}" --chdir="$dir"; then
            FAILED=1
        fi
    fi
done < <(find components/terraform -type d -path "*/vendor" -prune -o -type d -print0)

exit $FAILED
