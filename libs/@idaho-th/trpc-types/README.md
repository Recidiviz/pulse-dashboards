# @idaho-th/trpc-types

Shared TypeScript type exports for Idaho TH tRPC consumers. Keep this library
universal: it should expose client-safe types only and must not import server,
Prisma, or Node-only modules.

## Validation

This package is validated through the client/server projects that consume its
exports. Keep exported types serializable and free of server-only dependencies.
