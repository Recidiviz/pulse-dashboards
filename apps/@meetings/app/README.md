# Meeting Assistant App

## Setup

1. Follow the instructions for using the [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/) with Expo
1. Follow the instructions for using the [iOS Emulator](https://docs.expo.dev/workflow/ios-simulator/) with Expo
1. Run `adb reverse tcp:3002 tcp:3002` to allow the Android Emulator to talk to a local backend server
1. [Optional] To be able to run locally against real data or submit builds:
    1. [Sign up](https://expo.dev/signup) for an Expo account and ask in the #meeting-assistant slack channel to be added to the Recidiviz org.
    1. Install the EAS cli: `npm install -g eas-cli`
    1. Log in to expo: `eas login`

## Running locally

Running against local fixture data:

1. Follow [instructions](../../@meetings/server/README.md) for running a local server
1. Run `nx offline:android @meetings/app`

Running against the live staging backend:

1. Run `nx dev:android @meetings/app`

### Offline Mode with Skip Authentication

When running in offline mode against a local server, you can skip the Auth0 authentication flow:

1. Ensure the backend server is running in development mode (`NODE_ENV=development`)
1. Set the environment variable `EXPO_PUBLIC_OFFLINE_MODE=true` in your `.env` file
1. Run `nx offline:android @meetings/app` (or `nx offline:ios @meetings/app`)
1. On the login screen, click "Skip Authentication (Offline Mode)"
1. The app will bypass Auth0 and the backend will use a mock user with `pseudonymizedId: "staff-pid-1"`

**Note**: Skip authentication is only allowed when the backend is running in development mode for security reasons.
