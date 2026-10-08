#!/usr/bin/env bash
# Joins every project's Vitest LCOV report into one file whose paths are relative to the
# repo root, which is what Aikido matches against.
#
# Usage: collect-lcov.sh <output .lcov path>
#
# Vitest writes each report under <project>/coverage-aikido/ with paths relative to that
# project's folder, so each report gets its project folder as a prefix.
set -euo pipefail

output="$1"
: > "$output"
count=0
while IFS= read -r report; do
  project_dir="${report%/coverage-aikido/lcov.info}"
  project_dir="${project_dir#./}"
  sed "s#^SF:#SF:$project_dir/#" "$report" >> "$output"
  count=$((count + 1))
done < <(find . -path ./node_modules -prune -o -path '*/coverage-aikido/lcov.info' -print | sort)

echo "Joined $count reports covering $(grep -c '^SF:' "$output") files into $output"
if [ "$count" -eq 0 ]; then
  exit 1
fi
