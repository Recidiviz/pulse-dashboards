# Meeting Assistant App

## Setup

1. Follow the instructions for using the [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/) with Expo
1. Follow the instructions for using the [iOS Emulator](https://docs.expo.dev/workflow/ios-simulator/) with Expo
1. Run `adb reverse tcp:3002 tcp:3002` to allow the Android Emulator to talk to a local backend server
1. [Optional] To be able to run locally against real data or submit builds:
    1. [Sign up](https://expo.dev/signup) for an Expo account and ask in the #meeting-assistant slack channel to be added to the Recidiviz org.
    1. Install the EAS cli: `npm install -g eas-cli`
    1. Log in to expo: `eas login`

## Environment Variables

Environment variables for the app are managed using SOPS-encrypted YAML files, which serve as the single source of truth.
These files are version-controlled and automatically decrypted when running targets prefixed with `requires-sops-env:`.

### SOPS Files

- `env.dev.enc.yaml` - Development environment (EAS `development`)
- `env.production.enc.yaml` - Production environment (EAS `production`)
- `env.staging.enc.yaml` - Staging environment (EAS `preview`)

### Editing Environment Variables

To edit encrypted environment variables:

```bash
# Edit development environment
sops apps/@meetings/app/env.dev.enc.yaml
```

### Syncing to EAS

After editing SOPS files, sync the variables to EAS (Expo Application Services) for Expo cloud builds:

```bash
# Sync development env to EAS
nx sync-env-to-eas @meetings/app

# Sync staging env to EAS preview
nx sync-env-to-eas @meetings/app --configuration staging

# Sync production env to EAS
nx sync-env-to-eas @meetings/app --configuration production
```

## Running locally

1. Follow [instructions](../../@meetings/server/README.md) for running a local server
1. There are three development targets: `web`, `ios`, and `android`. Run them using `nx` i.e. `nx run @meetings/app:web`
   1. To run against the live staging backend specify `--configuration=staging` 

### Offline Mode with Skip Authentication

When running in offline mode against a local server, you can skip the Auth0 authentication flow:

1. Ensure the backend server is running in development mode (`NODE_ENV=development`)
1. Run `nx android @meetings/app` (or `nx ios @meetings/app`)
1. On the login screen, click "Skip Authentication (Offline Mode)"
1. The app will bypass Auth0 and the backend will use a mock user with `pseudonymizedId: "staff-pid-1"`

**Note**: Skip authentication is only allowed when the backend is running in development mode for security reasons.
