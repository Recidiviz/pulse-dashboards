#!/bin/bash

# Get all of the env variables that include `DATABASE_URL`
DB_URLS=$(printenv | grep DATABASE_URL)
for DB_URL in $DB_URLS
do
   # Get the connection string
   CONNECTION_STRING=$(echo $DB_URL | cut -d '=' -f 2-)
   echo "Migrating database: $CONNECTION_STRING"
   DATABASE_URL=$CONNECTION_STRING yarn prisma migrate deploy
done
