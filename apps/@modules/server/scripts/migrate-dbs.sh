#!/bin/sh

BASE_DIR="$(pwd)"

MODULES="US_TN_RECLASSIFICATION"
US_TN_RECLASSIFICATION_ENABLED_STATES="US_TN"
US_TN_RECLASSIFICATION_FOLDER="UsTnReclassification"

# Loop over the modules used as keys for ENABLED_STATES
for MODULE in $MODULES
do
  FOLDER_ENV_VAR_NAME="${MODULE}_FOLDER"
  eval "FOLDER=\${$FOLDER_ENV_VAR_NAME}"
  cd $BASE_DIR/modules/$FOLDER || exit

  ENABLED_STATES_ENV_VAR_NAME="${MODULE}_ENABLED_STATES"
  eval "ENABLED_STATES=\${$ENABLED_STATES_ENV_VAR_NAME}"

  # Pull list of states for this module
  for STATE in $ENABLED_STATES
  do
     DB_NAME="${MODULE}__${STATE}"
     ENV_VAR_NAME="${DB_NAME}_DATABASE_URL"
     # Get the connection string from the environment
     eval "CONNECTION_STRING=\${$ENV_VAR_NAME}"
     echo "Migrating database: $DB_NAME"
     DATABASE_URL=$CONNECTION_STRING yarn prisma migrate deploy
  done
done
