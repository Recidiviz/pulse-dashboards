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
4. Update the database tables with `cd apps/sentencing-server && npx prisma migrate dev`
5. Start the server with `nx dev sentencing-server`.

## Importing types into your client

In order to access the TRPC types, include the `tsconfig.types.json` in your project's `tsconfig.json` file. This will allow you to import JUST the types from the server into your client code without leaking server-side code.

```json
{
  "compilerOptions": {
    "references": [
        { "path": "path/to/tsconfig.types.json" }
    ]
  }
}
```
