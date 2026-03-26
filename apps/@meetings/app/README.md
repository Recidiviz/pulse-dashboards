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

### Running locally on a physical device

1. Run the local server with `HOST=0.0.0.0 nx dev @meetings/app`. This will output a few IP
   addresses the server is listening on.
1. In your .env.dev.enc.yaml file, set EXPO_PUBLIC_SERVER_URL to the URL of your local dev backend,
   using one of the local IP address emitted (such as 192.168.0.127- I've had success using the one
   that starts with 192.168). Make sure you revert this change when putting a PR up for review.
1. Run `nx dev:ios:device @meetings/app`

If your device shows "No development servers found", enter the URL manually. The IP address will be
shown in the console under the QR code, something like http://192.168.0.127:8081.

### Offline Mode with Skip Authentication

When running in offline mode against a local server, you can skip the Auth0 authentication flow:

1. Ensure the backend server is running in development mode (`NODE_ENV=development`)
1. Run `nx android @meetings/app` (or `nx ios @meetings/app`)
1. On the login screen, click "Skip Authentication (Offline Mode)"
1. The app will bypass Auth0 and the backend will use a mock user with `pseudonymizedId: "staff-pid-1"`

**Note**: Skip authentication is only allowed when the backend is running in development mode for security reasons.

## Releasing

To build the app and submit to TestFlight / App store, run the following from this directory:

```bash
eas build --platform ios --profile [staging|production] --auto-submit
```

To submit the app, you need our App Store Connect API key. Download it from Secret Manager
(meetings_app_store_connect_key) as a file called AuthKey_3KP2AHK76R.p8 in this directory.

### Building separately

If you want to build the app, but not submit it to apple, run:

```bash
eas build --platform ios --profile [staging|production]
```

### Submitting to TestFlight / App Store separately

When submitting an already existing build, you must prefix the command with `APP_ENV=<profile>` so
that EAS resolves the correct bundle identifier from `app.config.ts`. Without it, the config
defaults to `development` and EAS will register the wrong app in App Store Connect.

```bash
APP_ENV=staging eas submit --platform ios --profile staging
APP_ENV=production eas submit --platform ios --profile production
```

Then select the build you want to submit when prompted.
