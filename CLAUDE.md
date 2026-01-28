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

# Run a specific test file
nx test staff --testPathPattern="MyComponent.test"

# Run E2E tests (Playwright)
nx e2e staff

# Run Cucumber E2E tests (requires dev server running)
nx test-e2e-workflows staff
```

### Linting and Type Checking

```bash
nx lint staff
nx lint staff --fix
nx typecheck staff
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

```bash
# Use the repo plugin for new libraries
nx generate ~repo:lib [my-library]
```

## Architecture

### Project Structure

- `apps/` - Application entry points
  - `staff/` - Main Recidiviz Staff Dashboard (React SPA with Node backend)
  - `jii/` - Justice Impacted Individuals webapp (React, Firebase Functions backend)
  - `@reentry/` - Reentry app (Next.js frontend, Python FastAPI backend)
  - `@sentencing/` - PSI/Sentencing tools (React frontend in staff, Fastify/tRPC server)
  - `@meetings/` - Meeting Assistant (React Native/Expo mobile app)
  - `@jii-texting/` - JII Texting service (Fastify server)
- `libs/` - Shared libraries
  - `@*/prisma/` - Prisma schemas and clients per domain
  - `@*/trpc-types/` - tRPC type definitions
  - `staff-shared-server/` - Legacy Node server and shared filtering logic
  - `datatypes/` - Shared TypeScript types
  - `design-system/` - UI component library
  - `atmos/` - Terraform infrastructure components

### Path Aliases

Import paths use `~` prefix for workspace libraries (configured in tsconfig.base.json):

```typescript
import { something } from "~datatypes";
import { Component } from "~@jii/common-ui";
import { prisma } from "~@sentencing/prisma";
```

### Key Technology Patterns

- **State management**: MobX for staff app, React Query for newer apps
- **API layers**: tRPC for type-safe APIs (sentencing, meetings, reentry), REST for legacy
- **Styling**: styled-components (React), Tailwind CSS (Next.js)
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Database**: Prisma ORM with PostgreSQL (Cloud SQL)
- **Auth**: Auth0 with separate staging/production tenants

### Environment Variables

- Stored in Google Secret Manager (GSM)
- SOPS-encrypted YAML files for local development (`env.*.enc.yaml`)
- Prefix targets with `requires-sops-env:` to auto-load encrypted env vars
- Frontend vars prefixed with `VITE_` (Vite) or `NEXT_PUBLIC_` (Next.js)

### Backend Services

- **staff-shared-server**: Legacy Node/Express on port 3001, Redis cache on port 6380
- **@sentencing/server**: Fastify + tRPC + Prisma
- **@reentry/backend**: Python FastAPI (separate venv with `uv`)
- **@meetings/server**: Fastify + tRPC + Prisma

## @reentry Backend (Python)

The reentry backend uses Python with FastAPI. Commands run from `apps/@reentry/backend`:

```bash
# Install system deps (macOS)
brew install cairo pango glib gobject-introspection gdk-pixbuf uv

# Start services
cd apps/@reentry && docker compose up

# Run migrations
cd backend && uv run alembic upgrade head

# Seed database
uv run python -m app.manage seed-db

# Run backend
uv run fastapi dev

# Run tests
RECIDIVIZ_DATABASE_URL_TESTS='postgresql+asyncpg://postgres:password@localhost:5433/recidiviz_test' uv run pytest
```

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

## Code Style

### License Headers

When creating new files, use the current year in the license header:

```typescript
// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================
```
