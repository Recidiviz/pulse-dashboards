# Meeting Assistant App

## Setup

1. Follow the instructions for using the [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/) with Expo
1. Follow the instructions for using the [iOS Emulator](https://docs.expo.dev/workflow/ios-simulator/) with Expo
1. Run `adb reverse tcp:3002 tcp:3002` to allow the Android Emulator to talk to a local backend server
1. [Optional] To be able to submit builds:
   1. [Sign up](https://expo.dev/signup) for an Expo account and file an access request at [go/access](http://go/access) to be added to the Recidiviz Expo org.
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
1. There are three development targets: `web`, `dev:ios`, and `dev:android`. Run them using `nx` i.e. `nx web @meetings/app`. To target a physical device instead, see [Running locally on a physical device](#running-locally-on-a-physical-device) below.
   1. To run against the live staging backend specify `-c staging`

### Running locally on a physical device

#### iOS

1. Make sure that your device and mac are connected to the same Apple Account. Ensure that this account has been [added as a developer](https://appstoreconnect.apple.com/access/users)
1. Ensure that your device has Development Mode enabled. You can enable development mode by connecting your device to your Mac via USB-C (when the two are under the same Apple Account), then navigating on your device to Settings > Privacy and Security > Enable development mode
1. Open XCode, and navigate to XCode > Settings > Apple Accounts. Make sure your apple account (the one that's a developer) is listed and, if not, add it
1. On clicking into your account, you should see that the "Recidiviz Inc" team is listed as a team you belong to as a developer
1. Click the Recidiviz Inc team, and then click "Manage Certificates". Click the "+" icon that appears in the pop-up window, and add Apple Development credentials
1. Run the local server with `nx dev @meetings/server`.
1. The "auto" config we use for easily deploying to native iOS devices skips the native prebuild step for speed, so it won't pick up changes to `app.config.ts`, native dependencies, plugins, permissions, or assets (like fonts) on its own. Before running it for the first time on a branch,
   or if you've made changes to any of those things, run `nx run @meetings/app:prebuild --platform ios --clean`
1. Run `nx dev:ios:auto @meetings/app` to deploy to your device! This will (after signing into GCloud) make you select a device to deploy on which, if you've followed the previous steps, should include your physical iOS device.

**If your device shows "No development servers found"**: Enter the URL manually OR scan the QR code provided in the terminal when Expo finishes deploying the app. The `:auto` targets set `REACT_NATIVE_PACKAGER_HOSTNAME` so the console/QR code should show your Mac's LAN IP (e.g. http://192.168.0.127:8081) rather than `127.0.0.1`; if it still shows the wrong address, use `scripts/get-lan-ip.sh` to find the correct one and enter it manually.

#### Android

1. Run the local server with `nx dev @meetings/server`.
1. The "auto" config we use for easily deploying to native Android devices skips the native prebuild step for speed, so it won't pick up changes to `app.config.ts`, native dependencies, plugins, permissions, or assets (like fonts) on its own. Before running it for the first time on a branch,
   or if you've made changes to any of those things, run `nx run @meetings/app:prebuild --platform android --clean`
1. Connect your device using either option below, then confirm it's recognized by running `adb devices` — it should show up as `device` (not `unauthorized` or `offline`)

**Option A: USB**

1. Enable Developer options on your device: go to Settings > About phone and tap "Build number" seven times
1. Enable USB debugging under Settings > System > Developer options
1. Connect your device to your computer via USB and accept the "Allow USB debugging" prompt on the device

**Option B: Wireless debugging**

1. Enable Developer options (see above), then enable "Wireless debugging" under Settings > System > Developer options
1. The first time pairing a given device, click on the Wireless debugging setting, then tap "Pair device with pairing code" and run `adb pair <ip>:<port>` in your mac terminal using the address shown on screen, entering the 6-digit code when prompted (your computer and device must be on the same Wi-Fi network)
1. That's it for first-time setup — `nx dev:android:auto @meetings/app` automatically tries to reconnect to any already-paired device on future sessions (via `apps/@meetings/app/scripts/android-wireless-connect.sh`), as long as you haven't forgotten the device or switched networks. You can also run that script manually any time to reconnect without deploying, or to troubleshoot connection issues.

1. Run `nx dev:android:auto @meetings/app` to deploy to your device! This will (after signing into GCloud) make you select a device to deploy on which, if you've followed the previous steps, should include your physical Android device.

**If your device shows "No development servers found"**: Enter the URL manually OR scan the QR code provided in the terminal when Expo finishes deploying the app. The `:auto` targets set `REACT_NATIVE_PACKAGER_HOSTNAME` so the console/QR code should show your Mac's LAN IP (e.g. http://192.168.0.127:8081) rather than `127.0.0.1`; if it still shows the wrong address, use `scripts/get-lan-ip.sh` to find the correct one and enter it manually.

### Local Mode with Skip Authentication

When running in local mode against a local server, you can skip the Auth0 authentication flow:

1. Ensure the backend server is running in development mode (`NODE_ENV=development`)
1. Run `nx android @meetings/app` (or `nx ios @meetings/app`)
1. On the login screen, click "Skip Authentication (Local Mode)"
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

## Over-the-air (OTA) updates

JS-only changes can be shipped to existing native builds via [EAS Update](https://docs.expo.dev/eas-update/introduction/),
without a new app store submission. Updates are delivered per channel and only
apply to builds whose `runtimeVersion` matches (set by the `appVersion` policy in
`app.config.ts`, i.e. the app `version`); native code changes still require a fresh build.

A scheduled workflow (`.github/workflows/meetings-ota-staging.yml`) publishes the
latest `main` bundle to the `staging` channel every weekday morning, so staging
builds stay current without a rebuild. It can also be triggered on demand from the
Actions tab (`workflow_dispatch`).

To publish an OTA update manually, from this directory (`--environment preview`
inlines the staging `EXPO_PUBLIC_*` vars into the bundle):

```bash
eas update --channel staging --environment preview --message "..."
```

### PR previews

PRs that affect the app publish an EAS Update to channel `pr-<number>` and comment
a QR code on the PR.

Scan the QR with your phone's camera; the link opens the **Recidiviz Staging**
app (or open the `recidiviz-staging://pr-preview?channel=pr-<number>` link on
the device directly). The app switches its update channel via a runtime header
override, downloads the PR bundle, and reloads automatically. A red chip with
the PR id and a close icon appears at the right of the header; tap it to exit
the preview and return to staging.

Caveats:

- Previews only load when the update's runtime version (the app `version`)
  matches the installed staging build.
- Native code changes can't be previewed this way; they need a new build.
- The staging build must be recent enough to contain the preview handler.

The dev client can still load any branch manually from its launcher's EAS Updates
list for local development.
