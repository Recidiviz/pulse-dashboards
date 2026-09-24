# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Recidiviz Dashboards is an Nx integrated monorepo containing web applications for criminal justice data analysis. The codebase uses TypeScript throughout, with React frontends and various backend technologies (Node/Express, Fastify, Python/FastAPI).

## Common Commands

### Development

```bash
# Install dependencies
yarn install

# Run the main staff dashboard (frontend + backend)
nx dev staff

# Run staff frontend only
nx dev-spa staff

# Run in offline mode (uses fixture data, no auth required)
nx offline staff

# Run with local Python backend
nx dev-be staff
```

### Testing

```bash
# Run tests for a specific project
nx test staff
nx test @sentencing/server

# Run a specific test file (args after -- go to the test runner)
nx test @reentry/frontend -- MyComponent.test.ts

# Run E2E tests (Playwright)
nx e2e staff

# Run Cucumber E2E tests (requires a server already running).
# The Workflows suite runs against `nx offline staff` and needs no secrets:
nx test-e2e-workflows staff

# The suites that log in run against `nx dev staff` and need real Auth0
# credentials, decrypted from env.test-e2e.enc.yaml (so: gcloud auth):
nx test-e2e staff --configuration=lantern   # or login, or userAccess

# Always pass a suite. With no configuration, wdio's `specs` glob matches only
# login.feature and silently skips the rest.
```

### Linting and Type Checking

`lint` and `typecheck` are inferred targets (`nx lint staff --fix`, `nx typecheck staff`). The `pass-ci` skill runs the CI-equivalent checks across affected projects.

### SOPS Environment Variable Loading

The repo uses a custom SOPS plugin to load encrypted environment variables for nx targets.

#### How it works

Projects can define targets with the `requires-sops-env:` prefix (e.g., `requires-sops-env:test`, `requires-sops-env:prisma-generate`).
These are automatically wrapped by an inferred delegation target without the prefix.

**Always run the unprefixed target:**

```bash
# ✅ Correct - uses sops plugin to load env vars
nx test @meetings/prisma

# ❌ Wrong - runs the raw target without env loading
nx run @meetings/prisma:requires-sops-env:test
```

### Prisma (for projects using databases)

```bash
# Generate Prisma client
nx run @sentencing/prisma:prisma-generate

# Run migrations
nx run @sentencing/prisma:prisma-migrate

# Open Prisma Studio
nx run @sentencing/prisma:prisma-studio

# Seed database
nx run @sentencing/prisma:prisma-seed
```

### Creating New Libraries

Use `nx generate ~repo:lib [my-library]`; README.md has the details.

## Architecture

### Project Structure

- `apps/` - Application entry points
  - `staff/` - Main Recidiviz Staff Dashboard (React SPA with Node backend)
  - `jii/` - Justice Impacted Individuals webapp (React, Firebase Functions backend)
  - `@reentry/` - Reentry app (Next.js frontend, Python FastAPI backend)
  - `@sentencing/` - PSI/Sentencing tools (React frontend in `libs/sentencing-client/`, Fastify/tRPC server)
  - `@meetings/` - Meeting Assistant (React Native/Expo mobile app)
  - `@jii-texting/` - JII Texting service (Fastify server)
  - `staff-server/` - Legacy Node/Express backend for the staff dashboard (Pathways/Lantern metrics)
- `libs/` - Shared libraries
  - `@*/prisma/` - Prisma schemas and clients per domain
  - `@*/trpc-types/` - tRPC type definitions
  - `staff-shared-filters/` - Shared Pathways/Lantern filtering logic used by both the staff frontend and `staff-server` (`~staff-shared-filters`)
  - `auth-utils/` - Universal auth configs and state-code constants shared by the staff frontend and `staff-server` (`~auth-utils`)
  - `datatypes/` - Shared TypeScript types
  - `design-system/` - UI component library
  - `utils/` - Shared helpers (`formatDate`, `pluralize`, `formatName`, etc.); import via `~utils`. Prefer these over local re-implementations.
  - `atmos/` - Terraform infrastructure components

### Path Aliases

Import paths use a `~` prefix for workspace libraries (e.g. `~datatypes`, `~@sentencing/prisma`); tsconfig.base.json defines them.

### Key Technology Patterns

- **State management**: MobX for staff app, React Query for newer apps
- **API layers**: tRPC for type-safe APIs (sentencing, meetings, reentry), REST for legacy
- **Styling**: styled-components (React), Tailwind CSS (Next.js and `apps/jii`)
- **Testing**: Vitest for unit tests, Playwright for E2E. `@nx/jest` is still registered in nx.json for `@meetings/app` only, so Jest flags such as `--testPathPattern` do not work elsewhere
- **Database**: Prisma ORM with PostgreSQL (Cloud SQL)
- **Auth**: Auth0 with separate staging/production tenants

### Design System

Design artifacts (components, color palettes, etc.) are defined in two locations:

- **~design-system** (preferred): The monorepo's UI component library located in `libs/design-system/`
- **@recidiviz/design-system**: External package with additional components not yet ported to the monorepo
  - Source code: https://github.com/Recidiviz/web-libraries/tree/main/packages/design-system
  - When you need to understand available components, their props, or implementation details, reference the source code at this URL

Prefer using ~design-system when components are available in both locations.

### Environment Variables

- Stored in Google Secret Manager (GSM)
- SOPS-encrypted YAML files for local development (`env.*.enc.yaml`)
- Prefix targets with `requires-sops-env:` to auto-load encrypted env vars
- Frontend vars prefixed with `VITE_` (Vite) or `NEXT_PUBLIC_` (Next.js)

### Backend Services

- **staff-server**: Legacy Node/Express on port 3001, Redis cache on port 6380
- **@sentencing/server**: Fastify + tRPC + Prisma
- **@reentry/backend**: Python FastAPI (separate venv with `uv`)
- **@meetings/server**: Fastify + tRPC + Prisma

## @reentry Backend (Python)

Backend tasks are nx targets (`nx <target> @reentry/backend`, e.g. `dev`, `migrate-db`, `seed-db`, `test`). See `apps/@reentry/CLAUDE.md` for setup and details.

## Testing Patterns

- Test files: `*.test.ts` or `*.test.tsx` colocated with source
- Use Vitest for unit/integration tests
- React Testing Library for component tests
- MSW for API mocking
- Playwright for E2E (staff app in `apps/staff/e2e/`)

## Nx-Specific Notes

- Run `nx affected -t test` to test only affected projects
- Use `nx graph` to visualize project dependencies
- Reset Nx cache: `nx reset`
- Projects are inferred from `project.json` files
- Targets like `lint`, `test`, `build` are inferred by plugins

## Shared Claude Skills

Some skills come from the shared [`Recidiviz/claude-skills`](https://github.com/Recidiviz/claude-skills)
marketplace, declared under `extraKnownMarketplaces` and `enabledPlugins` in `.claude/settings.json`.
They are invoked with a plugin-namespaced name, so `/create-pr:create-pr` rather than `/create-pr`.

**The `enabledPlugins` declaration does not install anything.** It only turns on a plugin that is
already installed on your machine. Each developer installs each declared plugin once per machine, in a
terminal or through the VS Code extension's **Manage plugins** dialog:

```bash
claude plugin marketplace add Recidiviz/claude-skills
claude plugin install <name>@recidiviz
```

The `marketplace add` step is separate on purpose. The `extraKnownMarketplaces` declaration points a
_session_ at the marketplace, but the `claude plugin` CLI does not resolve it until you add it, so
`install` on its own fails with `Plugin "<name>" not found in marketplace "recidiviz"`. Add it once per
machine, not once per plugin. If the add step reports `Unrecognized key`, your Claude Code is too old for
the catalog's schema — run `claude update` (v2.1.193 or later).

Install at the default user scope. Do not pass `--scope project`: it rewrites the checked-in
`.claude/settings.json` with no change in meaning, leaving noise on whatever branch you are on.

If a declared plugin is not installed, its skills and hooks silently do not load. A session-start hook in
this repo checks for this and prints the commands for any plugin that is missing. To opt out of a
declared plugin locally, set it to `false` under `enabledPlugins` in `.claude/settings.local.json`.

## Code Style

### License Headers

Every source file needs the GPL license header. The `notice/notice` lint rule in `eslint.config.mjs` enforces it and fills in the current year, so run `nx lint <project> --fix` on new files instead of writing the header by hand.
