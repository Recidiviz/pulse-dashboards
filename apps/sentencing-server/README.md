# Sentencing Server

This is the server component of the Sentencing project. It is a [Fastify](https://fastify.dev/) server that provides an API for the Sentencing client to interact with.

Some technical details:

- The API is defined using [trpc](https://trpc.io/), a type-safe RPC library for TypeScript
- The server uses [Prisma](https://www.prisma.io/) to interact with the database.

Resource links:
Staging

- [Cloud Run](https://console.cloud.google.com/run/detail/us-central1/sentencing-server/metrics?project=recidiviz-dashboard-staging)
- [Cloud Run DB Migration Job](https://console.cloud.google.com/run/jobs/details/us-central1/sentencing-server-migrate-db/executions?project=recidiviz-dashboard-staging)
- [Data Import Task Queue](https://console.cloud.google.com/cloudtasks/queue/us-central1/sentencing-server-import-queue/tasks?project=recidiviz-dashboard-staging)
- [Cloud SQL Databases](https://console.cloud.google.com/sql/instances/sentencing-db/studio?project=recidiviz-dashboard-staging)

Production

- [Cloud Run](https://console.cloud.google.com/run/detail/us-central1/sentencing-server/metrics?project=recidiviz-dashboard-production)
- [Cloud Run DB Migration Job](https://console.cloud.google.com/run/jobs/details/us-central1/sentencing-server-migrate-db/executions?project=recidiviz-dashboard-production)
- [Data Import Task Queue](https://console.cloud.google.com/cloudtasks/queue/us-central1/sentencing-server-import-queue/tasks?project=recidiviz-dashboard-production)
- [Cloud SQL Databases](https://console.cloud.google.com/sql/instances/sentencing-db/studio?project=recidiviz-dashboard-production)

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Get env variables from Google Secrets Manager and put them in this directory
   - Put the [env_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_dev_sentencing_server/versions?project=recidiviz-dashboard-staging) in an `.env` file
   - Put the [env_staging_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_staging_sentencing_server/versions?project=recidiviz-dashboard-staging) in an `.env.staging` file
   - Put the [env_prod_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_prod_sentencing_server/versions?project=recidiviz-dashboard-staging) in an `.env.staging` file
   - Put the [env_test_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_test_sentencing_server/versions?project=recidiviz-dashboard-staging) in an `.env.test` file

   This way, `nx` will automatically pick up the correct environment variables based on the targets your are running.

2. Make sure you have your Docker daemon running.
3. Start the server with `nx dev sentencing-server`.

## Updating the prisma schema

If you make changes to the prisma schema, you will need to run `nx prisma-migrate sentencing-server --name="{YOUR_CHANGE_NAME}"` to create a database migration file. In order for this to work, the database must be running in the docker container.

## Add support for a new state

If you'd like to add support for a new state, you don't have to make any code changes!

Note: This is just for the application to support a new state. You will still need to add metric exports + Cloud Storage notifications for the new state in order for data to be be imported for the new state.

Note: this process is the same for both staging and production.

1. For the new state, create a new database in the Cloud SQL instance. The naming convention for these databases is the tenant id in all lowercase, like `us_ca` for California.

2. Next, add a new environment variable for the new state's database connection string to both the Cloud Run and Cloud Run DB Migration Job deploys of the server. The naming convention for these environment variables is `DATABASE_URL_{STATE_ABBREVIATION}`. For example, if you wanted to add support for the state of California, you would add an environment variable called `DATABASE_URL_US_CA` with the connection string for the California database.

## Testing

We have integration tests for the server + database.

In order to run these tests:

1. Get any necessary env variables from [GSM](https://console.cloud.google.com/security/secret-manager/secret/env_test_sentencing_server/versions?project=recidiviz-dashboard-staging) and put them in an `.env.test` file (the name must match exactly for nx to pick up on the variables) in the `apps/sentencing-server` directory.
2. Make sure you have your Docker daemon running.
3. Run `nx test sentencing-server` to run the tests.

## Testing zod schemas

If you'd like to test the zod import schemas against a downloaded JSONLines file of expected data, you can run `nx test-zod sentencing-server {path-to-jsonlines-file} {name-of-schema}`. This will run the zod schema against each line of the file and log any errors.

The valid schema names are the keys of the `zodSchemaMap` object found in `test-zod/index.ts`

## Deployment

Please only deploy the sentencing server via the `nx deploy` command. This will ensure that the correct environment variables are used for the deployment.
