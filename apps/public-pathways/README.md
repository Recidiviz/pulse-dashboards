# Public Pathways

A public-facing web application for viewing criminal justice system trends data powered by Recidiviz. Built with React, Vite, and Tailwind CSS.

## Prerequisites

- Node.js v20 (managed via nvm)
- Yarn
- [SOPS](https://github.com/getsops/sops) for managing encrypted environment variables
- Google Cloud SDK (`gcloud`) for authenticating with GCP KMS

## Getting Started

### 1. Install dependencies

From the repository root:

```bash
yarn install
```

### 2. Set up SOPS

SOPS is used to encrypt and decrypt environment variable files (e.g., `env.dev.enc.yaml`). The encrypted files are checked into git so developers can share secrets securely.

#### Install SOPS

```bash
# macOS
brew install sops

# Or download from GitHub releases
# https://github.com/getsops/sops/releases
```

#### Authenticate with GCP

SOPS uses GCP KMS for encryption/decryption. You need to authenticate with the `public-pathways-staging` GCP project:

```bash
gcloud auth application-default login
```

Make sure you have access to the `public-pathways-staging` GCP project and the KMS key configured in `.sops.yaml`.

#### Decrypt environment variables

To view the decrypted contents of the env file:

```bash
sops apps/public-pathways/env.dev.enc.yaml
```

This opens the file in your `$EDITOR`. Close without saving to just view it.

#### Edit environment variables

```bash
sops apps/public-pathways/env.dev.enc.yaml
```

Make your changes, save, and close. SOPS will re-encrypt the file automatically.

#### Add a new secret

Open the file with `sops`, add your new key-value pair, save, and close. The new value will be encrypted and the file can be committed to git.

## Development

### Run the dev server

```bash
nx dev public-pathways
```

This runs the `requires-sops-env:dev` target, which automatically decrypts environment variables from `env.dev.enc.yaml` and starts the Vite dev server.

### Run tests

```bash
nx test public-pathways
```

### Typecheck

```bash
nx typecheck public-pathways
```

### Lint

```bash
nx lint public-pathways
nx lint public-pathways --fix
```

## Build and Deploy

### Build

```bash
# Staging (default)
nx build public-pathways

# Production
nx build public-pathways --configuration=production
```

### Deploy

```bash
# Staging
nx deploy public-pathways

# Production
nx deploy public-pathways --configuration=production
```

### Preview deploy (creates a temporary channel)

```bash
nx deploy-preview public-pathways
```

## Shared Pathways Library

This app shares types, constants, filter definitions, and metric logic with the staff dashboard via the `~shared-pathways` library (`libs/shared-pathways/`).

```typescript
import {
  FILTER_TYPES,
  Dimension,
  PopulationFilterValues,
  MetricId,
  SnapshotDataRecord,
} from "~shared-pathways";
```

The `~` prefix is a workspace path alias configured in `tsconfig.base.json`. See `libs/shared-pathways/src/index.ts` for the full list of exports.

## Syncing content

Pathways content (page copy, metric copy) lives in `libs/shared-pathways/src/content` and is shared with the staff app. To sync content from the Google Sheet, run:

```bash
nx sync-content shared-pathways
```

See the [shared-pathways README](../../libs/shared-pathways/README.md) for required environment variables.
