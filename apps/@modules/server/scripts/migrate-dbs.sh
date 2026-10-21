#!/bin/sh

# Get all of the env variables that include `DATABASE_URL`
DB_URLS=$(printenv | grep DATABASE_URL)
for DB_URL in $DB_URLS
do
   # Get the connection string
   CONNECTION_STRING=$(echo $DB_URL | cut -d '=' -f 2-)
   DB_NAME=$(echo $DB_URL | sed 's/^.*localhost\///' | sed 's/\?.*$//')
   echo "Migrating database: $DB_NAME"
   DATABASE_URL=$CONNECTION_STRING yarn prisma migrate deploy
done
