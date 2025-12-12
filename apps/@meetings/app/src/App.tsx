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

import "../global.css";

import * as Sentry from "@sentry/react-native";
import React from "react";
import { Auth0Provider } from "react-native-auth0";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import config from "~@meetings/app/auth0-config";

import AppErrorBoundary from "./components/AppErrorBoundary";
import { SnackbarProvider } from "./components/Snackbar";
import { RecordingProvider } from "./context/RecordingContext";
import AppNavigator from "./navigation/AppNavigator";

Sentry.init({
  dsn: process.env["EXPO_PUBLIC_SENTRY_DSN"],
  tracesSampleRate: 0,
  profilesSampleRate: 0,
  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,
});

// @ts-expect-error BigInt may not have toJSON in all environments
// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () {
  const int = Number.parseInt(this.toString());
  return Number.isNaN(int) ? this.toString() : int;
};

const App = () => {
  return (
    <GestureHandlerRootView>
      <SnackbarProvider>
        <Auth0Provider
          domain={config.domain as string}
          clientId={config.clientId as string}
        >
          <AppErrorBoundary>
            <RecordingProvider>
              <AppNavigator />
            </RecordingProvider>
          </AppErrorBoundary>
        </Auth0Provider>
      </SnackbarProvider>
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(App);
