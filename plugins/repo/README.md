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

## Contractor Management

A CLI tool for managing contractor access to SOPS-encrypted environment files using a hybrid encryption approach (SOPS with GCP KMS + age encryption).

### Overview

The contractor management system allows you to securely share environment files with external contractors without granting them access to your GCP KMS keys. It uses:

- **age encryption**: Generates individual `age` keypairs for each contractor
- **SOPS encryption**: Maintains dual encryption with both GCP KMS and contractor age keys. Allows for transparent contractor-env editing
- **Project-scoped access**: Control which `nx` project secrets a contractor can access
- **Automatic rotation**: Re-encrypts all files when removing contractor access


```bash
nx run repo:manage-contractor-sops
```

### Commands

#### Onboard a contractor
Onboarding a contractor will generate an `age` keypair that they can use to access contractor env files.

You will be prompted to select which nx projects they should have access to.

* Existing `.contractor.env.yaml` files will be re-encrypted and have the public key for the new contractor added as a recipient
* The root `.sops.yaml` will be modified so that any newly created contractor env files will automatically include the contractor as a recipient 

An `INSTRUCTIONS.md` file will be generated in the `.contractor-keys` directory. This will contain setup instructions for the contractor. **CAUTION**: The instructions must be distributed through a secure channel and deleted upon sending. They contain the contractor's public key and a link to a onetimesecret.com private key.

#### Create contractor environment file
This will create a contractor accessible environment file using an existing `env.enc.yaml` file's contents.

You will be prompted to select which contractors should have access to the newly created file.

You may optionally onboard new contractors during this process.

#### Modify contractor access for a project

This command allows you to change which contractors have access to a specific project's contractor files through an interactive checkbox UI.

You will be prompted to:
1. Select a project (with optional filtering)
2. View current contractors with access
3. Toggle checkboxes to add/remove contractors
4. Preview changes before applying

This is the recommended way to manage access after initial onboarding, as it:
- Shows the current state before making changes
- Allows bulk addition/removal in a single operation
- Automatically updates `.sops.yaml` rules and re-encrypts all contractor files in the project
- Provides a clear diff of changes (contractors added/removed)

#### Offboard a contractor

This command will remove contractor access from **ALL** projects. It performs the following actions:

Removes contractor access:
1. Removes age key from creation rules `.sops.yaml`
2. Re-encrypts all contractor env files without the contractor's public key as a recipient
3. Removes contractor from the `contractor-keys.enc.yaml` database

#### Environment risk detection

The tool warns when creating contractor files from sensitive environments:
- ⚠️ **Risky**: production, staging, demo environments
- ✅ **Safe**: local, offline, development environments
- ℹ️ **Unknown**: Other environments (requires confirmation)

### Key Features

- **Automatic keypair management**: Age keys generated and stored in encrypted `contractor-keys.enc.yaml`
- **Project-specific rules**: Each `nx` project gets its own SOPS rule in `.sops.yaml`
- **Dual encryption**: Files encrypted with both GCP KMS (for team) and age (for contractors)
- **Zero-trust offboarding**: Re-encrypting files ensures contractor can no longer decrypt them. However, they will still be able to decrypt any previously shared data.
- **Dry-run mode**: Test operations with `--dry-run` flag

### Encryption model

Contractors can edit and re-encrypt `*.contractor.enc.yaml` files without GCP access thanks to **SOPS hybrid encryption** and asymmetric cryptography:

1. **Each SOPS file contains**:
   - Encrypted data (the actual secrets)
   - A data encryption key (DEK) that's encrypted separately for each recipient
   - Multiple recipients: GCP KMS key + multiple age public keys

2. **When a contractor edits a file**:
   - SOPS decrypts the DEK using the contractor's age private key
   - Contractor edits the plaintext content
   - SOPS generates a new DEK and encrypts it for ALL recipients listed in `.sops.yaml`

3. **GCP KMS encryption is a public operation**:
   - Encrypting data with a GCP KMS key does NOT require authentication
   - Only decryption requires GCP IAM permissions
   - SOPS can call the GCP KMS encrypt API without credentials to generate the encrypted DEK for FTEs
   - This is similar to how anyone can encrypt data with a public PGP key without the owner's permission

4. **Result**: Both contractors (using age) and FTEs (using GCP KMS) can independently decrypt and re-encrypt the same file, with each save operation automatically encrypting the DEK for all recipients.

This architecture enables seamless collaboration where contractors can modify files via `git pull/push` without requiring GCP access or manual file sharing.

