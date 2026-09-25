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

import type { ConfigContext, ExpoConfig } from "expo/config";

const APP_NAME = "Recidiviz";
const PACKAGE = "org.recidiviz.app";
const SCHEME = "recidiviz";
const EAS_PROJECT_ID = "fce0159d-1a8d-493b-a891-e7413b1a8ea5";

// The marketing version is a property of a release, not of the source: it is
// written here by meetings-native-release-execute.yml at build time and never
// committed with a real value. The release tags record which commit shipped as
// which version, per environment.
const PLACEHOLDER_VERSION = "0.0.0";
// Annotated as `string`, not left to infer the literal type: once the release
// workflow writes a real version here, comparing two different string literals
// would otherwise be a type error.
const RELEASE_VERSION: string = PLACEHOLDER_VERSION;

// Simulates a version in a local or preview build, for exercising anything that
// branches on it (the forced-upgrade check in src/features/app-update, say).
// Honored only while RELEASE_VERSION is still the placeholder, so it can never
// change what a release ships as: the `staging` and `preview` build profiles
// share the EAS environment `preview`, so a variable set there for testing
// would otherwise reach staging's real builds.
const version =
  RELEASE_VERSION === PLACEHOLDER_VERSION
    ? process.env["MEETINGS_APP_VERSION"] ?? PLACEHOLDER_VERSION
    : RELEASE_VERSION;

type Environment = "development" | "preview" | "staging" | "production";

const getDynamicAppConfig = (environment: Environment) => {
  if (environment === "production") {
    return {
      name: APP_NAME,
      bundleIdentifier: PACKAGE,
      packageName: PACKAGE,
      scheme: SCHEME,
      auth0Domain: "login.recidiviz.org",
    };
  }

  if (environment === "staging") {
    return {
      name: `${APP_NAME} Staging`,
      bundleIdentifier: `${PACKAGE}.staging`,
      packageName: `${PACKAGE}.staging`,
      scheme: `${SCHEME}-staging`,
      auth0Domain: "login-staging.recidiviz.org",
    };
  }

  if (environment === "preview") {
    return {
      name: `${APP_NAME} Preview`,
      bundleIdentifier: `${PACKAGE}.preview`,
      packageName: `${PACKAGE}.preview`,
      scheme: `${SCHEME}-prev`,
      auth0Domain: "login-staging.recidiviz.org",
    };
  }

  return {
    name: `${APP_NAME} Development`,
    bundleIdentifier: `${PACKAGE}.dev`,
    packageName: `${PACKAGE}.dev`,
    scheme: `${SCHEME}-dev`,
    auth0Domain: "login-staging.recidiviz.org",
  };
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const environment = (process.env["APP_ENV"] as Environment) ?? "development";
  const { name, bundleIdentifier, packageName, scheme, auth0Domain } =
    getDynamicAppConfig(environment);

  return {
    ...config,
    name,
    slug: "recidiviz",
    version,
    orientation: "portrait",
    icon: "./src/shared/assets/images/Apple_icon.png",
    scheme,
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: false,
      bundleIdentifier: bundleIdentifier,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
      ],
      package: packageName,
    },
    web: {
      bundler: "metro",
      favicon: "./src/shared/assets/images/favicon-32x32.png",
    },
    plugins: [
      // Keep the generated exp+recidiviz scheme out of release builds; all
      // variants share the slug, so they'd intercept dev-client launcher links.
      [
        "expo-dev-client",
        { addGeneratedScheme: environment === "development" },
      ],
      [
        "expo-splash-screen",
        {
          image: "./src/shared/assets/images/Apple_icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      [
        "react-native-auth0",
        {
          domain: auth0Domain,
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          note: "Use SENTRY_AUTH_TOKEN env to authenticate with Sentry.",
          project: "meetings-app",
          organization: "recidiviz-inc",
        },
      ],
      [
        "expo-audio",
        {
          microphonePermission:
            "The app uses the microphone to record your meeting.",
          enableBackgroundRecording: true,
          enableBackgroundPlayback: false,
        },
      ],
      "@react-native-community/datetimepicker",
      [
        "expo-font",
        {
          fonts: [
            "./src/shared/assets/fonts/LibreBaskerville-Bold.ttf",
            "./src/shared/assets/fonts/Inter.ttf",
            "./src/shared/assets/fonts/Inter-Medium.ttf",
          ],
        },
      ],
      [
        "@intercom/intercom-react-native",
        {
          // API keys and appId are provided at runtime via env vars
          useManualInit: true,
        },
      ],
    ],
    extra: {
      eas: {
        projectId: EAS_PROJECT_ID,
      },
    },
    owner: "recidiviz",
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
      // Declare the channel header (channels in eas.json match APP_ENV names)
      // so expo-updates permits the pr-preview runtime override; undeclared
      // headers throw InvalidRequestHeadersOverrideException.
      requestHeaders: { "expo-channel-name": environment },
      // Checks natively on every launch, before the JS bundle mounts.
      checkAutomatically: "ON_LOAD",
      // Keeps launch instant: the app renders from cache and any available
      // update downloads in the background, leaving the banner to apply it.
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: "fingerprint",
    },
    experiments: {
      // https://expo.dev/changelog/mitigating-critical-security-vulnerability-in-react-server-components#react-versions-in-a-monorepo
      autolinkingModuleResolution: true,
      // Expo forwards this to babel-preset-expo as `supportsReactCompiler`
      reactCompiler: true,
    },
  };
};
