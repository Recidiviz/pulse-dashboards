# @idaho-th/trpc

Idaho TH backend API library. It owns the tRPC routers, auth context,
role-scoped procedure middleware, business services, storage/document helpers,
Intercom sync/digest logic, and document janitor services used by the Fastify
server and Cloud Run jobs.

## Running unit tests

Start the local Postgres container first unless your environment already
provides `DATABASE_URL`, then run:

```bash
yarn nx test @idaho-th/trpc --configuration test
```

Run type checks with:

```bash
yarn nx typecheck @idaho-th/trpc
```
