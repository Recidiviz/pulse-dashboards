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

import { ConfigContext, ExpoConfig } from "expo/config";

const APP_NAME = "Meeting Assistant";
const PACKAGE = "com.recidiviz.meetings";
const SCHEME = "meetings";

const getDynamicAppConfig = (
  environment: "development" | "preview" | "production",
) => {
  if (environment === "production") {
    return {
      name: APP_NAME,
      bundleIdentifier: PACKAGE,
      packageName: PACKAGE,
      scheme: SCHEME,
    };
  }

  if (environment === "preview") {
    return {
      name: `${APP_NAME} Preview`,
      bundleIdentifier: `${PACKAGE}.preview`,
      packageName: `${PACKAGE}.preview`,
      scheme: `${SCHEME}-prev`,
    };
  }

  return {
    name: `${APP_NAME} Development`,
    bundleIdentifier: `${PACKAGE}.dev`,
    packageName: `${PACKAGE}.dev`,
    scheme: `${SCHEME}-dev`,
  };
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const { name, bundleIdentifier, packageName, scheme } = getDynamicAppConfig(
    (process.env["APP_ENV"] as "development" | "preview" | "production") ??
      "development",
  );

  return {
    ...config,
    name,
    slug: "meetings",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: bundleIdentifier,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
      ],
      package: packageName,
    },
    web: {
      bundler: "metro",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      [
        "react-native-auth0",
        {
          domain: "login-staging.recidiviz.org",
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
            "Allow $(PRODUCT_NAME) to access your microphone.",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "6db95bf2-07f3-4753-890d-1950ac2a58fb",
      },
    },
    owner: "recidiviz",
    updates: {
      url: "https://u.expo.dev/6db95bf2-07f3-4753-890d-1950ac2a58fb",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
  };
};
