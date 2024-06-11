# Sentencing Server

This is the server component of the Sentencing project. It is a [Fastify](https://fastify.dev/) server that provides an API for the Sentencing client to interact with.

Some technical details:

- The API is defined using [trpc](https://trpc.io/), a type-safe RPC library for TypeScript
- The server uses [Prisma](https://www.prisma.io/) to interact with the database.

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Get any necessary env variables from [GSM](https://console.cloud.google.com/security/secret-manager/secret/env_dev_sentencing_server/versions?project=recidiviz-dashboard-staging) and put them in an `.env` or `.env.dev` file in the `apps/sentencing-server` directory.
2. Run `nx prisma-generate sentencing-server` to generate the Prisma client.
3. Spin up the development database with `cd apps/sentencing-server && docker-compose up`.
4. Update the database tables with `nx prisma-push sentencing-server`
5. Seed the database with `nx prisma-seed sentencing-server`.
6. Start the server with `nx dev sentencing-server`.

## Updating prisma schema

If you make changes to the prisma schema, you will need to run `nx prisma-migrate sentencing-server --name="{YOUR_CHANGE_NAME}"` to create a database migration file. In order for this to work, the database must be running in the docker container.

## Testing

We have integration tests for the server + database.

In order to run these tests:

1. Make sure you have the `test-db` docker container running. If you ran docker compose during the development setup, it should be running
2. Get any necessary env variables from [GSM](https://console.cloud.google.com/security/secret-manager/secret/env_test_sentencing_server/versions?project=recidiviz-dashboard-staging) and put them in an `.env.test` file (the name must match exactly for nx to pick up on the variables) in the `apps/sentencing-server` directory.
3. Run `nx test sentencing-server` to run the tests.
