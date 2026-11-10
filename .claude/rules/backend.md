---
paths:
  - "apps/@*/server/**"
  - "libs/@*/trpc/**"
  - "libs/@*/prisma/**"
  - "libs/common/server-setup-plugin/**"
---

# Backend Rules

All new backend services use Fastify + tRPC + Prisma + Zod. This is non-negotiable. Python is a last resort, used only when a required library has no viable Node equivalent.

## Architecture

The server app (`apps/@domain/server/`) is a thin entry point. All meaningful backend logic — routing, context, procedures, Prisma queries — lives in the corresponding library (`libs/@domain/trpc/`).

```
apps/@domain/server/src/
  main.ts                         # process entry, starts Fastify
  server/index.ts                 # calls buildCommonServer(), exports buildServer()

libs/@domain/trpc/src/
  context.ts                      # createContext: verifies auth token, attaches Prisma client
  init.ts                         # initTRPC, baseProcedure with auth middleware
  router.ts                       # assembles sub-routers into appRouter
  routes/
    feature/
      feature.router.ts           # route handlers using baseProcedure
      feature.schema.ts           # Zod input/output schemas
      feature.helpers.ts          # Prisma queries and data transforms
      feature.types.ts            # TypeScript types

libs/@domain/trpc-types/
  src/index.d.ts                  # exports AppRouter type for the frontend client
```

Reference implementations: `apps/@sentencing/server/` + `libs/@sentencing/trpc/`.

## Server Setup

Use `buildCommonServer()` from `~server-setup-plugin`. It handles tRPC registration and auth middleware.

```typescript
import { buildCommonServer } from "~server-setup-plugin";
import { appRouter, createContext } from "~@domain/trpc";

export function buildServer() {
  return buildCommonServer({
    appRouter,
    createContext,
    auth0Options: {
      domain: process.env["AUTH0_DOMAIN"]!,
      audience: process.env["AUTH0_AUDIENCE"]!,
    },
  });
}
```

## Auth Flow

JWT verification is handled by `~server-setup-plugin`. Do not implement JWT verification yourself.

```typescript
// context.ts — auth lives here, not in routes
import { verifyAuth0Token } from "~server-setup-plugin";

export async function createContext(opts: CreateFastifyContextOptions) {
  const authPayload = await verifyAuth0Token(opts);
  return {
    req: opts.req,
    res: opts.res,
    isAuthorized: !!authPayload,
    authPayload,
    prisma: getPrismaClient(),
  };
}

// init.ts — baseProcedure enforces auth
export const baseProcedure = t.procedure.concat(plugin).use(async (opts) => {
  if (!opts.ctx.isAuthorized) throw new TRPCError({ code: "UNAUTHORIZED" });
  return opts.next();
});
```

Both server and client must use `superjson` as the tRPC transformer.

| Don't                                                       | Do                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Backend logic (routes, Prisma queries) in `apps/@*/server/` | Server app is thin. All tRPC logic lives in `libs/@*/trpc/`                         |
| Prisma queries inline in `.router.ts`                       | Extract into `.helpers.ts`. Routers call helpers, helpers call Prisma               |
| Non-Fastify backend framework (Express, Koa, etc.)          | Fastify + tRPC + Prisma + Zod. Non-negotiable                                       |
| Custom server setup instead of `~server-setup-plugin`       | Use `buildCommonServer()` from `~server-setup-plugin`                               |
| Missing `superjson` transformer                             | Both server and client must use `superjson`                                         |
| `console.log` in server code                                | Use Fastify's built-in structured JSON logger (`request.log` / `server.log`)        |
| Route files without standard naming                         | `feature.router.ts`, `feature.schema.ts`, `feature.helpers.ts`, `feature.types.ts`  |
| Creating a new application under `apps/`                    | Build as libraries under `libs/`, consumed by existing apps. Do not create new apps |
| Python when a Node/TypeScript alternative exists            | Python is a last resort only                                                        |
