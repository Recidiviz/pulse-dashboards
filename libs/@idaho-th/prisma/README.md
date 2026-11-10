# @idaho-th/prisma

Idaho TH Prisma schema, generated client, migrations, local Docker Compose
databases, and seed script. The development database listens on `localhost:6600`
and the test database listens on `localhost:6601`.

## Local database

```bash
yarn nx run @idaho-th/prisma:docker
yarn nx prisma-generate @idaho-th/prisma
yarn nx prisma-migrate @idaho-th/prisma
yarn nx prisma-seed @idaho-th/prisma
```

Prepare the test schema before backend or Prisma tests:

```bash
yarn nx prisma-deploy @idaho-th/prisma --configuration test
```

## Running unit tests

```bash
yarn nx test @idaho-th/prisma --configuration test
```
