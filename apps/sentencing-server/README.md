# Sentencing Server

This is the server component of the Sentencing project. It is a [Fastify](https://fastify.dev/) server that provides an API for the Sentencing client to interact with.

Some technical details:

- The API is defined using [trpc](https://trpc.io/), a type-safe RPC library for TypeScript
- The server uses [Prisma](https://www.prisma.io/) to interact with the database.

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Get env variables from Google Secrets Manager and put them in this directory
   - Put the [env_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_dev_sentencing_server/versions?project=recidiviz-dashboard-staging) in an `.env` file
   - Put the [env_staging_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_dev_sentencing_server/versions?project=recidiviz-dashboard-staging) in an `.env.staging` file
   - Put the [env_test_sentencing_server](https://console.cloud.google.com/security/secret-manager/secret/env_dev_sentencing_server/versions?project=recidiviz-dashboard-staging) in an `.env.test` file

   This way, `nx` will automatically pick up the correct environment variables based on the targets your are running.

2. Make sure you have your Docker daemon running.
3. Start the server with `nx dev sentencing-server`.

## Updating prisma schema

If you make changes to the prisma schema, you will need to run `nx prisma-migrate sentencing-server --name="{YOUR_CHANGE_NAME}"` to create a database migration file. In order for this to work, the database must be running in the docker container.

## Testing

We have integration tests for the server + database.

In order to run these tests:

1. Get any necessary env variables from [GSM](https://console.cloud.google.com/security/secret-manager/secret/env_test_sentencing_server/versions?project=recidiviz-dashboard-staging) and put them in an `.env.test` file (the name must match exactly for nx to pick up on the variables) in the `apps/sentencing-server` directory.
2. Make sure you have your Docker daemon running.
3. Run `nx test sentencing-server` to run the tests.
