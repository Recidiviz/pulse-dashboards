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

1. Make sure you have your Docker daemon running.
2. Start the server with `nx dev case-notes-server`. The dev target decrypts `env.dev.enc.yaml` via the `requires-sops-env:` delegate and injects the values into the child process.

## Testing

We have unit tests for the server.

In order to run these tests:

1. Make sure you have your Docker daemon running.
2. Run `nx test case-notes-server` to run the tests. The committed `.env.test` file supplies dummy test values.

### Connecting to the staging Vertex engine using a local instance

If you run `nx local case-notes-server --stateCode {state code} --query {query} --externalId {externalId}` (`externalId` is optional), you can run a query pointing at the staging or production version of the Case Notes Vertex AI engine. By default, the command will use the `PROJECT_ID` and `ENGINE_ID` set in your `.env` file. If you'd like to use different variables, you can create a `.env.local` and put them in there.
