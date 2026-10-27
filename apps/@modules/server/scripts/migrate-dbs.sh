#!/bin/sh

BASE_DIR="$(pwd)"

MODULES="CALENDAR USER_SETTINGS US_TN_RECLASSIFICATION"

CALENDAR_ENABLED_STATES="US_CO"
CALENDAR_FOLDER="Calendar"

US_TN_RECLASSIFICATION_ENABLED_STATES="US_TN"
US_TN_RECLASSIFICATION_FOLDER="UsTnReclassification"

USER_SETTINGS_ENABLED_STATES="RECIDIVIZ"
USER_SETTINGS_FOLDER="UserSettings"

# Loop over the modules listed above
for MODULE in $MODULES
do
  # Grab the folder name env var and read it
  FOLDER_ENV_VAR_NAME="${MODULE}_FOLDER"
  eval "FOLDER=\${$FOLDER_ENV_VAR_NAME}"
  cd $BASE_DIR/modules/$FOLDER || exit

  # Grab the enabled states env var and read it
  ENABLED_STATES_ENV_VAR_NAME="${MODULE}_ENABLED_STATES"
  eval "ENABLED_STATES=\${$ENABLED_STATES_ENV_VAR_NAME}"

  # Loop over states for this module and migrate each db
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
