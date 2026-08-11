# JII Prisma

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

### Multi-database dev setup

Unlike other Prisma libraries in this repo, which run a single local database, `@jii/prisma` runs **one local Postgres database per state** for development. Enabled states are configured via `ENABLED_STATE_DBS` in `.env` (comma-separated state codes); `getPrismaClient` picks the matching per-state database at runtime. (E2E tests run against a local dev server, so this setup applies to them as well.)

Where necessary and/or sensible, standard Prisma targets have been adapted to run against multiple databases. Refer to `project.json` for more information.

Unit tests are still run against a single consolidated local database for convenience.
