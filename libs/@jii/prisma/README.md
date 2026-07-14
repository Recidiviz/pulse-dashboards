# JII Prisma

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

### Multi-database dev setup

Unlike other Prisma libraries in this repo, which run a single local database, `@jii/prisma` runs **one local Postgres database per state** for development. Enabled states are configured via `ENABLED_STATE_DBS` in `.env` (comma-separated state codes); `getPrismaClientForStateCode` picks the matching per-state database at runtime.

Where necessary and/or sensible, standard Prisma targets have been adapted to run against multiple databases. Refer to `project.json` for more information.

Tests (both unit and e2e) are still run against a single consolidated local database.
