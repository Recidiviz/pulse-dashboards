# Case Planning Assistant (CPA) Server

This is the server component of the CPA project. It is a [Fastify](https://fastify.dev/) server that provides an API for the Reentry client to interact with.

Some technical details:

- The API is defined using [trpc](https://trpc.io/), a type-safe RPC library for TypeScript
- The server uses [Prisma](https://www.prisma.io/) to interact with the database.

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Make sure you have your Docker daemon running.

2. Start the server with `nx dev @cpa/server`.
