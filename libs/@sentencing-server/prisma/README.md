# Sentencing Server Prisma

Resource links:
Env Files

- [env_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_dev_sentencing_server/versions?project=recidiviz-dashboard-staging)

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Get env variables by running `nx load-env-files sentencing-server`

   This way, `nx` will automatically pick up the correct environment variables based on the targets your are running.

### Updating the prisma schema

If you make changes to the prisma schema, you will need to run `nx prisma-migrate sentencing-server --name="{YOUR_CHANGE_NAME}"` to create a database migration file. In order for this to work, the database must be running in the docker container.

### Seeding the local database

Run `nx prisma-seed sentencing-server` to seed the local database with test data.
