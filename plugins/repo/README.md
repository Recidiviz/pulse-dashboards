# repo

This library defines an Nx plugin called "repo" that defines commands for operating on this repo.

# Generators

## lib

The `lib` generator creates a Typescript or React library project with contents and settings tailored to Recidiviz defaults. It should be the starting point for adding a new Nx library to this workspace.

`nx generate ~repo:lib [my-project]`


# Inferred Tasks
## SOPS-ENV Plugin

An Nx plugin that provides automatic SOPS-encrypted environment variable management for your projects.

### Overview

This plugin automatically injects SOPS-encrypted environment variables into your Nx tasks, mirroring Nx's standard `.env` file behavior but using SOPS-encrypted YAML files instead.

### Features

- **Automatic target inference**: Prefix any target with `requires-sops-env:` and get automatic environment loading
- **Environment inheritance**: Mimics Nx's `.env` file priority system with support for target and configuration-specific files
- **SOPS encryption**: All environment files are encrypted with SOPS for security
- **Zero configuration**: Works automatically with the `requires-sops-env:` prefix
- **Tag-based sharing**: Share environment files across projects using `sops-env:@project/name` tags

### Quick Start

#### 1. Install SOPS

```bash
# macOS
brew install sops

# Other platforms: https://github.com/getsops/sops
```

#### 2. Create encrypted environment files

Create SOPS-encrypted YAML files in your project root:

```bash
# Base environment (loaded for all targets)
apps/myapp/env.enc.yaml

# Target-specific (loaded only for 'build' target)
apps/myapp/env.build.enc.yaml

# Configuration-specific (loaded only for 'staging' configuration)
apps/myapp/env.staging.enc.yaml

# Target + Configuration specific (highest priority)
apps/myapp/env.build.staging.enc.yaml
```

Example YAML structure:

```yaml
# env.staging.enc.yaml
DATABASE_URL: postgres://staging.example.com/db
API_KEY: sops-encrypted-value
FEATURE_FLAGS: '{"new_ui": true}'
```

#### 3. Prefix your target

In your `project.json`, prefix any target that needs environment variables:

```json
{
  "targets": {
    "requires-sops-env:build": {
      "executor": "@nx/esbuild:esbuild",
      "options": {
        "outputPath": "dist/apps/myapp"
      },
      "configurations": {
        "staging": {},
        "production": {}
      }
    }
  }
}
```

#### 4. Run your task

```bash
# The plugin automatically creates an unprefixed target that loads env vars
nx build myapp --configuration=staging
```

### How It Works

#### Automatic Target Creation

When the plugin detects a target with the `requires-sops-env:` prefix, it automatically creates an unprefixed delegate target:

```
requires-sops-env:build  →  build (auto-created)
```

The un-prefixed target:
1. Loads SOPS environment variables based on the target and configuration
2. Injects them into `process.env`
3. Delegates to the prefixed target
4. The child process inherits all environment variables

#### Environment File Priority

Following Nx's `.env` file behavior, SOPS files are loaded in priority order (later files override earlier ones):

For `nx build myapp --configuration=staging`:

1. `env.enc.yaml` (base)
2. `env.build.enc.yaml` (target-specific)
3. `env.staging.enc.yaml` (configuration-specific)
4. `env.build.staging.enc.yaml` (target + configuration - highest priority)

#### Tag-Based Environment Sharing

Share environment files across projects using tags:

```json
{
  "name": "myapp-worker",
  "tags": ["sops-env:@myorg/myapp"],
  "targets": {
    "requires-sops-env:start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node worker.js"
      }
    }
  }
}
```

This project will use SOPS files from `@myorg/myapp` instead of its own directory.

### SOPS Encryption Setup

#### Create a key

Create a new `kms-keyring-key` component instance in [security-operations-automation](https://github.com/Recidiviz/security-operations-automation/blob/1519961a9f76257d3f057ba23b35ed24152dc95e/atmos/stacks/recidiviz-jii-staging.yaml#L30-L46)

#### Configure SOPS

Create a `.sops.yaml` in your workspace root:

```yaml
creation_rules:
  - path_regex: \.enc\.yaml$
    gcp_kms: projects/PROJECT/locations/LOCATION/keyRings/KEYRING/cryptoKeys/KEY
```

#### Encrypt a file

```bash
# Create and encrypt
sops apps/myapp/env.staging.enc.yaml

# Or encrypt existing file
sops -e apps/myapp/env.staging.yaml > apps/myapp/env.staging.enc.yaml
```

### Configuration Options

#### Environment Variables

- `NX_SKIP_SOPS=true`: Skip SOPS decryption entirely

### File Structure

```
src/
├── executors/
│   ├── sops-env.ts                  # Nx plugin (createNodesV2) helper
│   ├── sops-delegate-executor.ts    # Main executor for env loading
│   ├── sops-delegate-schema.json    # Executor schema
│   └── utils.ts                     # SOPS utilities
```

### Troubleshooting

#### "SOPS is not installed"

Install SOPS: `brew install sops` (macOS) or see https://github.com/getsops/sops

#### "Failed to decrypt SOPS file"

- Ensure you're logged into GCP and can access the remote key
- Check `.sops.yaml` creation rules match your file pattern

#### Environment variables not loading

- Ensure target is prefixed with `requires-sops-env:`
- Check SOPS files exist in project root
- Run with `NX_VERBOSE_LOGGING=true` to see which files are loaded
- Verify file naming matches pattern: `env[.identifier].enc.yaml`

#### Target not found

The unprefixed target is created automatically. If you see "target not found", ensure:
- The prefixed target exists in `project.json`
- Nx daemon is restarted: `nx reset`

### Examples

#### Basic usage

```json
{
  "targets": {
    "requires-sops-env:serve": {
      "executor": "@nx/vite:dev-server",
      "options": {
        "port": 3000
      }
    }
  }
}
```

```bash
# Automatically loads env.enc.yaml and env.serve.enc.yaml
nx serve myapp
```

#### With configurations

```json
{
  "targets": {
    "requires-sops-env:deploy": {
      "executor": "nx:run-commands",
      "options": {
        "command": "terraform apply"
      },
      "configurations": {
        "staging": {},
        "production": {}
      }
    }
  }
}
```

```bash
# Loads: env.enc.yaml → env.deploy.enc.yaml → env.staging.enc.yaml → env.deploy.staging.enc.yaml
nx deploy myapp --configuration=staging
```

### Migration from dotenv

If you're using `.env` files, migrate to SOPS:

1. Encrypt your existing `.env` files:
   ```bash
   sops --config /dev/null --output-type yaml --gcp_kms projects/.../KMS_ID --encrypt .env.staging > env.staging.enc.yaml
   ```

2. Update target names with `requires-sops-env:` prefix

3. Remove `.env` files (now encrypted in `env.*.enc.yaml`)
