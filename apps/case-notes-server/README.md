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
   - Put the [env_dev_case_notes_server](https://console.cloud.google.com/security/secret-manager/secret/env_dev_case_notes_server/versions?project=recidiviz-dashboard-staging) in an `.env` file
   - Put the [env_staging_case_notes_server](https://console.cloud.google.com/security/secret-manager/secret/env_staging_case_notes_server/versions?project=recidiviz-dashboard-staging) in an `.env.staging` file
   - Put the [env_prod_case_notes_server](https://console.cloud.google.com/security/secret-manager/secret/env_prod_case_notes_server/versions?project=recidiviz-dashboard-staging) in an `.env.prod` file
   - Put the [env_test_case_notes_server](https://console.cloud.google.com/security/secret-manager/secret/env_test_case_notes_server/versions?project=recidiviz-dashboard-staging) in an `.env.test` file

   This way, `nx` will automatically pick up the correct environment variables based on the targets your are running.

2. Make sure you have your Docker daemon running.
3. Start the server with `nx dev case-notes-server`.

## Testing

We have unit tests for the server.

In order to run these tests:

1. Get any necessary env variables from [GSM](https://console.cloud.google.com/security/secret-manager/secret/env_test_case_notes_server/versions?project=recidiviz-dashboard-staging) and put them in an `.env.test` file (the name must match exactly for nx to pick up on the variables) in the `apps/case-notes-server` directory.
2. Make sure you have your Docker daemon running.
3. Run `nx test case-notes-server` to run the tests.

### Connecting to the staging Vertex engine using a local instance

If you run `nx local case-notes-server --stateCode {state code} --query {query} --externalId {externalId}` (`externalId` is optional), you can run a query pointing at the staging or production version of the Case Notes Vertex AI engine. By default, the command will use the `PROJECT_ID` and `ENGINE_ID` set in your `.env` file. If you'd like to use different variables, you can create a `.env.local` and put them in there.
