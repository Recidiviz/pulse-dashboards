# Idaho Transitional Housing

Idaho Transitional Housing is a web application for managing transitional housing applications in Idaho. Staff users can create, review, update, and track applications; provider users can review applications routed to them and respond to information requests. The app also supports PDF upload/intake flows, document scan status, provider matching, home-plan tasks, timelines, Google Places-backed provider locations, and Intercom provider communications.

## Tech Stack

| Area              | Stack                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Monorepo/build    | Nx, Yarn 4.17.1, TypeScript                                                                       |
| Frontend          | React, Vite, React Router, MobX, styled-components, tRPC client                                   |
| Backend           | Fastify, tRPC, Zod, Auth0 JWT auth, Sentry                                                        |
| Database          | Postgres, Prisma                                                                                  |
| File processing   | GCS signed URLs, ClamAV malware scanning in deployed environments, PDF sorting/extraction workers |
| External services | Auth0, Google Cloud, Google Places, Vertex AI, Intercom                                           |
| Infrastructure    | Terraform, Atmos, Cloud Run, Cloud SQL, Cloud Load Balancing                                      |

## Project Layout

| Path                                             | Purpose                                                                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `apps/@idaho-th/client/`                         | Vite SPA entry point, routing, Auth0 bootstrapping, runtime config                                                           |
| `libs/@idaho-th/client/`                         | Shared React UI, data stores, tRPC client, application/provider workflows                                                    |
| `apps/@idaho-th/server/`                         | Fastify server entry point, internal webhooks, and server-image job entry points for migrate, Intercom, and document cleanup |
| `apps/@idaho-th/seed-db/`                        | Cloud Run seed job entry point                                                                                               |
| `apps/@idaho-th/auth0/actions/`                  | Auth0 post-login Actions for staff/provider metadata; see its README and deployment guide before changing tenant behavior    |
| `libs/@idaho-th/trpc/`                           | API routes, auth context, business logic, storage, Intercom, PDF processing                                                  |
| `libs/@idaho-th/prisma/`                         | Prisma schema, migrations, local Postgres Compose file, seed script                                                          |
| `libs/@idaho-th/shared/`                         | Shared constants and types used by client and server                                                                         |
| `libs/atmos/components/terraform/apps/idaho-th/` | App infrastructure and runbooks                                                                                              |

## Local Development

Prerequisites:

- Node `22.22.2` (`.nvmrc`) and Yarn `4.17.1` through Corepack.
- Docker running for local Postgres.
- `sops` installed and access to the Idaho TH dev env files, or equivalent environment variables set manually.
- GCP credentials only for flows that touch real GCS, Vertex AI, or Google Places resources.

Install dependencies from the repo root:

```bash
nvm use
corepack enable
yarn install
```

### Local Environment

| Service       | Local URL / Port               | Command                                          |
| ------------- | ------------------------------ | ------------------------------------------------ |
| Frontend SPA  | http://localhost:4300          | `yarn nx dev @idaho-th/client`                   |
| Backend API   | http://localhost:3010          | `yarn nx dev @idaho-th/server`                   |
| tRPC endpoint | http://localhost:3010/api/trpc | served by the backend                            |
| App database  | `localhost:6600`               | started by `yarn nx run @idaho-th/prisma:docker` |
| Test database | `localhost:6601`               | started by `yarn nx run @idaho-th/prisma:docker` |

The frontend Vite dev server proxies `/api` to `http://localhost:3010` by default. Override the proxy with `IDAHO_TH_API_PROXY_TARGET` when pointing the local client at a different API.

### SOPS Env Setup

The server, Prisma, and tRPC Nx targets load encrypted env files through the repo's `requires-sops-env:` delegate. Running the unprefixed targets below is enough; Nx decrypts the matching `env*.enc.yaml` files before executing the underlying command.

For Idaho TH local server-side development, the main encrypted files are:

- `apps/@idaho-th/server/env.dev.enc.yaml`
- `apps/@idaho-th/server/env.dev.contractor.enc.yaml`

Use contractor env files when needed:

```bash
NX_SOPS_USE_CONTRACTOR_ENV=true yarn nx dev @idaho-th/server
```

Plain shell environment variables take precedence over values loaded from SOPS. See `plugins/repo/README.md` for the generic SOPS plugin behavior.

The client uses plaintext Vite env files for local/build-time settings, including `apps/@idaho-th/client/.env.local`. In deployed Cloud Run environments, the frontend container writes Auth0/API settings into `/config.js` at startup from runtime environment variables.

Start the local database and prepare Prisma:

```bash
yarn nx run @idaho-th/prisma:docker
yarn nx prisma-generate @idaho-th/prisma
yarn nx prisma-migrate @idaho-th/prisma
yarn nx prisma-seed @idaho-th/prisma
```

Prepare the test database schema when running backend or Prisma tests locally:

```bash
yarn nx prisma-deploy @idaho-th/prisma --configuration test
```

Start the backend API:

```bash
yarn nx dev @idaho-th/server
```

The server listens on `http://localhost:3010` and serves tRPC under `/api/trpc`.

Start the frontend in another terminal:

```bash
yarn nx dev @idaho-th/client
```

The SPA runs at `http://localhost:4300`. Vite proxies `/api` to `http://localhost:3010` by default. Override with `IDAHO_TH_API_PROXY_TARGET` when needed.

Useful database commands:

```bash
yarn nx prisma-studio @idaho-th/prisma
yarn nx prisma-status @idaho-th/prisma
yarn nx prisma-reset @idaho-th/prisma
```

## Tests

Run Idaho TH tests the same way CI does when checking affected projects:

```bash
yarn nx affected -t test --exclude '*,!tag:idaho-th' --configuration test --parallel=1
```

Run focused tests:

```bash
yarn nx test @idaho-th/server --configuration test
yarn nx test @idaho-th/trpc --configuration test
yarn nx test @idaho-th/prisma --configuration test
yarn nx test @idaho-th/client
yarn nx test @idaho-th-client
```

Backend and Prisma tests use Postgres. Start the local database first with `yarn nx run @idaho-th/prisma:docker` unless the test environment already provides `DATABASE_URL`.

The local Compose file starts both the development database on `localhost:6600` and the test database on `localhost:6601`. Test env defaults live in `apps/@idaho-th/server/.env.test`.

Run type checks:

```bash
yarn nx typecheck @idaho-th/server
yarn nx typecheck @idaho-th/seed-db
yarn nx typecheck @idaho-th/trpc
yarn nx typecheck @idaho-th/prisma
yarn nx typecheck @idaho-th/client
yarn nx typecheck @idaho-th-client
yarn nx typecheck @idaho-th/shared
```

## Deploy

Application images are built by `.github/workflows/build-idaho-th-images.yml` on every push to a supported prototype branch (`prototype/idaho-transitional-housing-v2` and `-v4`) or a release branch matching `release/idaho-th/*` (for example, `release/idaho-th/0a271b55d2`). Release builds publish commit-SHA tags only and leave `latest` unchanged. The deploy helper verifies the server, seed, and client images for the current commit and applies `apps/idaho-th` with SHA-pinned image versions:

```bash
yarn deploy-idaho-th
```

Production deploys must run from a supported prototype or release branch — the branch checks in `tools/deploy-idaho-th.mts` mirror the image workflow. Release names must be a single non-empty segment after `release/idaho-th/`. Staging deploys can run from another branch after confirmation; the helper can build missing staging images locally.

The deploy helper owns the public app image rollout only. The migrate job,
Intercom jobs, and document janitor use the server image with different Cloud
Run Job commands; scanner and admin components are applied separately. Auth0
Actions are deployed manually in the Auth0 dashboard using the checked-in action
docs; infrastructure, malware scanning, admin panel, rollback, and restore
procedures live in the infra runbooks:

- [Auth0 Actions behavior](../../apps/@idaho-th/auth0/actions/README.md)
- [Auth0 Actions deployment](../../apps/@idaho-th/auth0/actions/DEPLOYMENT.md)
- [Infrastructure index](../atmos/components/terraform/apps/idaho-th/README.md)
- [Deployment runbook](../atmos/components/terraform/apps/idaho-th/DEPLOYMENT.md)
- [Rollback runbook](../atmos/components/terraform/apps/idaho-th/ROLLBACK.md)
- [Backup and restore runbook](../atmos/components/terraform/apps/idaho-th/BACKUP_RESTORE.md)
- [Malware scanning runbook](../atmos/components/terraform/apps/idaho-th/MALWARE_SCANNING.md)
- [Admin panel runbook](../atmos/components/terraform/apps/idaho-th-admin/README.md)

## Development Notes

- Auth is centralized in `libs/@idaho-th/trpc/src/context.ts` and procedure middleware in `libs/@idaho-th/trpc/src/init.ts`. Use `staffProcedure` and `providerProcedure` instead of adding ad hoc role checks in routers.
- Internal routes under `/internal/*` are not user-auth endpoints. Auth0
  webhooks verify HMAC headers signed with `BACKEND_WEBHOOK_SECRET`; the
  malware-scan webhook verifies Google-signed Eventarc OIDC.
- Keep Prisma queries scoped to Idaho's state code and the authenticated staff/provider identity.
- Avoid logging names, emails, PDF content, or other PII. Prefer request IDs and pseudonymized IDs.
- Add new API areas under `libs/@idaho-th/trpc/src/routes/<feature>/` and register routers in `libs/@idaho-th/trpc/src/router.ts`.
- Add colocated tests beside the feature code that owns the behavior.
