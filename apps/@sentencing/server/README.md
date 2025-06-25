# Sentencing Server

This is the server component of the Sentencing project. It is a [Fastify](https://fastify.dev/) server that provides an API for the Sentencing client to interact with.

Some technical details:

- The API is defined using [trpc](https://trpc.io/), a type-safe RPC library for TypeScript
- The server uses [Prisma](https://www.prisma.io/) to interact with the database.

Resource links:
Env Files

- [env_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_dev_sentencing_server/versions?project=recidiviz-dashboard-staging)
- [env_staging_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_staging_sentencing_server/versions?project=recidiviz-dashboard-staging)
- [env_prod_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_prod_sentencing_server/versions?project=recidiviz-dashboard-staging)
- [env_test_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_test_sentencing_server/versions?project=recidiviz-dashboard-staging)
- [env_preview_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_preview_sentencing_server/versions?project=recidiviz-dashboard-staging)

Staging

- [Cloud Run](https://console.cloud.google.com/run/detail/us-central1/sentencing/metrics?project=recidiviz-dashboard-staging)
- [Cloud Run DB Migration Job](https://console.cloud.google.com/run/jobs/details/us-central1/sentencing-migrate-db/executions?project=recidiviz-dashboard-staging)
- [Data Import Task Queue](https://console.cloud.google.com/cloudtasks/queue/us-central1/sentencing-import-queue/tasks?project=recidiviz-dashboard-staging)
- [Cloud SQL Databases](https://console.cloud.google.com/sql/instances/sentencing-db/studio?project=recidiviz-dashboard-staging)

Production

- [Cloud Run](https://console.cloud.google.com/run/detail/us-central1/sentencing/metrics?project=recidiviz-dashboard-production)
- [Cloud Run DB Migration Job](https://console.cloud.google.com/run/jobs/details/us-central1/sentencing-migrate-db/executions?project=recidiviz-dashboard-production)
- [Data Import Task Queue](https://console.cloud.google.com/cloudtasks/queue/us-central1/sentencing-import-queue/tasks?project=recidiviz-dashboard-production)
- [Cloud SQL Databases](https://console.cloud.google.com/sql/instances/sentencing-db/studio?project=recidiviz-dashboard-production)

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Get env variables by running `nx load-env-files sentencing`

   This way, `nx` will automatically pick up the correct environment variables based on the targets you are running.

2. Make sure you have your Docker daemon running.
3. Start the server with `nx dev sentencing`.

### Updating the prisma schema

Instructions for updating the prisma schema are in the [prisma README](../../libs/@sentencing/prisma/README.md).

### Add support for a new state

Note: This is just for the application to support a new state. You will still need to add metric exports + Cloud Storage notifications for the new state in order for data to be be imported for the new state.

Note: this process is the same for both staging and production.

1. For the new state, create a new database in the Cloud SQL instance. The naming convention for these databases is the tenant id in all lowercase, like `us_ca` for California.

2. Next, add a new environment variable for the new state's database connection string to `env_[prod/staging]_sentencing_server` in Google Secrets. The naming convention for these environment variables is `DATABASE_URL_{STATE_ABBREVIATION}`. For example, if you wanted to add support for the state of California, you would add an environment variable called `DATABASE_URL_US_CA` with the connection string for the California database.

3. Under the `migrate-db` target in the `sentencing` `project.json` file, append `DATABASE_URL_{STATE_ABBREVIATION}=$DATABASE_URL_{STATE_ABBREVIATION}` to the `--set-env-vars` portion of the `command`. This will ensure that the database migration job has the correct environment variables.

4. Under the `deploy-app` target in the `sentencing` `project.json` file, add `"DATABASE_URL_{STATE_ABBREVIATION}": "$DATABASE_URL_{STATE_ABBREVIATION}"` to the `envVars` dictionary. This will ensure that the server has the correct environment variables.

### Why the Prisma schema and migration files are included in the build

The Prisma schema and corresponding migration files are included in the build for this app because the docker container is reused for database migrations (and both of those are needed to run `prisma migrate`). We could create a new container for migrations, but that seems like overkill for now. If this becomes a problem in the future, we can revisit this decision.

## Testing

### Integration tests

We have integration tests for the server + database.

In order to run these tests:

1. Get any necessary env variables from [GSM](https://console.cloud.google.com/security/secret-manager/secret/env_test_sentencing_server/versions?project=recidiviz-dashboard-staging) and put them in an `.env.test` file (the name must match exactly for nx to pick up on the variables) in the `apps/sentencing` directory.
2. Make sure you have your Docker daemon running.
3. Run `nx test sentencing` to run the tests.

### Testing zod schemas

If you'd like to test the zod import schemas against a downloaded JSONLines file of expected data, you can run `nx test-zod sentencing {path-to-jsonlines-file} {name-of-schema}`. This will run the zod schema against each line of the file and log any errors.

The valid schema names are the keys of the `zodSchemaMap` object found in `test-zod/index.ts`

## Previews

Whenever you create a PR with changes to the sentencing server, a preview deployment will be created with a preview database, preview migrate job, and preview cloud run server using your PRs code. The preview `staff` app will also be initialized to point to the preview server, so you can test any changes end to end!

NOTE: The preview server is great for testing changes to the TRPC routes, but it does not currently have any functionality for testing data imports.

### Debugging Preview Database issues

The preview database is only cloned from the staging database once per PR. If your PR becomes too out of sync with `main` and you rebase it, it's possible that the preview database will become too out of sync with the staging database for migrations to apply correctly. If you encounter issues with the preview database and migrations, you can delete it and re-run the preview Github Actions workflow to have a new one created and migrated. The name of the preview database will be in the logs of the preview Github Actions workflow.

## Deployment

Please only deploy the sentencing server via the `nx deploy` command. This will ensure that the correct environment variables are used for the deployment.
