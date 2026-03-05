#!/bin/sh

# Iterate over the comma-separated list of state codes and migrate each database.
# Uses the state code as the database name, connecting via Cloud SQL socket.
for DB_NAME in $(echo "$DATABASE_STATE_CODES" | tr ',' ' ')
do
  CONNECTION_STRING="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${DATABASE_INSTANCE_CONNECTION_NAME}&schema=public"
  echo "Migrating database for state ${DB_NAME}"
  DATABASE_URL=$CONNECTION_STRING yarn prisma migrate deploy
done
