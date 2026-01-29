# Case Planning Assistant (CPA) Server

This is the server component of the CPA project. It is a [Fastify](https://fastify.dev/) server that provides an API for the Reentry client to interact with.

Some technical details:

- The API is defined using [trpc](https://trpc.io/), a type-safe RPC library for TypeScript
- The server uses [Prisma](https://www.prisma.io/) to interact with the database.



## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Get env variables by running `nx load-env-files @cpa/server` and `nx load-env-files @reentry/prisma`

   This way, `nx` will automatically pick up the correct environment variables based on the targets you are running.

2. Make sure you have your Docker daemon running.

3. Start the server with `nx dev @cpa/server`.
