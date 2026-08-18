# JII Prisma

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

### Multi-database dev setup

Unlike other Prisma libraries in this repo, which run a single local database, `@jii/prisma` runs **one local Postgres database per state** for development. Enabled states are configured via `ENABLED_STATE_DBS` in `.env` (comma-separated state codes); `getPrismaClient` picks the matching per-state database at runtime. (E2E tests run against a local dev server, so this setup applies to them as well.)

Where necessary and/or sensible, standard Prisma targets have been adapted to run against multiple databases. Refer to `project.json` for more information.

Unit tests are still run against a single consolidated local database for convenience.

### Docker targets

`compose.yml` defines a CloudSQL proxy (for developing against the staging DB) alongside local `db`/`test-db` Postgres containers, but they're started independently depending on what you're doing:

- `nx cloudsql-proxy @jii/prisma` — starts the CloudSQL proxy used by `nx dev jii` and other staging-DB flows.
- `nx local-dbs @jii/prisma` — starts the local `db`/`test-db` containers used by `nx offline jii`, unit tests, and e2e tests.
- `nx docker-down @jii/prisma` — tears down everything.

The CloudSQL proxy is authenticated via gcloud Application Default Credentials, which our company-wide session-length policy periodically expires. `cloudsql-proxy` is a long-running (`continuous`) target backed by `scripts/cloudSqlProxy.mts`, which owns the whole session: it checks and refreshes credentials (running `gcloud auth login --update-adc` for you if needed) before starting the container, then keeps watching for credential changes for the rest of the session — restarting the container whenever they change, whether that's from its own refresh or a manual reauth you ran in another terminal — so an expiring session shouldn't require manual reauth or a Docker restart.
