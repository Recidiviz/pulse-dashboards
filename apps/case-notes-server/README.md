# Case Notes Server

This is the server component of the Case Note search module that is used in the staff app. It is a [Fastify](https://fastify.dev/) server that provides a TRPC APIs for the Staff app to use.

Some technical details:

- The API is defined using [trpc](https://trpc.io/), a type-safe RPC library for TypeScript

Resource links:
Staging

- [Cloud Run](https://console.cloud.google.com/run/detail/us-central1/case-notes-server/metrics?project=recidiviz-dashboard-staging)

Production

- [Cloud Run](https://console.cloud.google.com/run/detail/us-central1/case-notes-server/metrics?project=recidiviz-dashboard-production)

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Get env variables from Google Secrets Manager and put them in this directory
   - Put the [env_case-notes_server](https://console.cloud.google.com/security/secret-manager/secret/env_dev_case-notes_server/versions?project=recidiviz-dashboard-staging) in an `.env` file
   - Put the [env_staging_case-notes_server](https://console.cloud.google.com/security/secret-manager/secret/env_staging_case-notes_server/versions?project=recidiviz-dashboard-staging) in an `.env.staging` file
   - Put the [env_prod_case-notes_server](https://console.cloud.google.com/security/secret-manager/secret/env_prod_case-notes_server/versions?project=recidiviz-dashboard-staging) in an `.env.prod` file
   - Put the [env_test_case-notes_server](https://console.cloud.google.com/security/secret-manager/secret/env_test_case-notes_server/versions?project=recidiviz-dashboard-staging) in an `.env.test` file

   This way, `nx` will automatically pick up the correct environment variables based on the targets your are running.

2. Make sure you have your Docker daemon running.
3. Start the server with `nx dev case-notes-server`.
