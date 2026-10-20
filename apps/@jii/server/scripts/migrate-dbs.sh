#!/bin/sh

set -eu

if [ -z "${ENABLED_STATE_DBS:-}" ]; then
   echo "No states specified in ENABLED_STATE_DBS" >&2
   exit 1
fi

# Each state in ENABLED_STATE_DBS has a live and a demo database, whose connection
# strings arrive as DATABASE_URL_<STATE> and DATABASE_URL_<STATE>_DEMO.
for STATE in $(echo "$ENABLED_STATE_DBS" | tr ',' ' ')
do
   for DB_NAME in "$STATE" "${STATE}_demo"
   do
      VAR_NAME="DATABASE_URL_$(echo "$DB_NAME" | tr '[:lower:]' '[:upper:]')"
      eval "CONNECTION_STRING=\${$VAR_NAME:-}"
      if [ -z "$CONNECTION_STRING" ]; then
         echo "Missing $VAR_NAME for database $DB_NAME" >&2
         exit 1
      fi

      echo "Migrating database: $DB_NAME"
      DATABASE_URL=$CONNECTION_STRING yarn prisma migrate deploy
   done
done
