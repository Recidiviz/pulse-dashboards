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

import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  getPathFromState as defaultGetPathFromState,
  getStateFromPath as defaultGetStateFromPath,
  LinkingOptions,
  NavigationContainer,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import { useAuth0 } from "react-native-auth0";
import superjson from "superjson";

import AppUpdateModal from "~@meetings/app/components/AppUpdateModal";
import { UserContextProvider } from "~@meetings/app/context/UserContext";
import { stateCodeParam } from "~@meetings/app/navigation/config";
import { extractAndRemoveStateCode } from "~@meetings/app/navigation/lib";
import { LoginScreen } from "~@meetings/app/pages/login";
import { publicTrpc } from "~@meetings/app/shared/api";
import { AppStackParamList, env } from "~@meetings/app/shared/config";

import AuthenticatedApp from "./../AuthenticatedApp";

const Drawer = createDrawerNavigator();
const publicQueryClient = new QueryClient();

const trpcUrl = env.EXPO_PUBLIC_SERVER_URL;

const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Login: "login",
      Main: {
        screens: {
          Onboarding: "onboarding",
          ClientsRoot: {
            screens: {
              Clients: "clients",
              ClientProfile: "clients/:personId",
              ClientNewMeeting: "clients/:personId/new-meeting",
              ClientMeeting: "clients/:personId/meetings/:meetingId",
            },
          },
          ResidentsRoot: {
            screens: {
              Residents: "residents",
              ResidentProfile: "residents/:personId",
              ResidentNewMeeting: "residents/:personId/new-meeting",
              ResidentMeeting: "residents/:personId/meetings/:meetingId",
            },
          },
          StateSelection: "settings",
        },
      },
    },
  },
  // Extract stateCode before default URL parsing so it isn't stored as a
  // screen param. The value is kept in stateCodeParam for getPathFromState.
  getStateFromPath(path, config) {
    const { stateCode, cleanPath } = extractAndRemoveStateCode(path);
    if (stateCode) {
      stateCodeParam.current = stateCode;
    }
    return defaultGetStateFromPath(cleanPath, config);
  },
  // Re-inject stateCode as a query param on every URL React Navigation generates,
  // so it persists across all navigation events.
  getPathFromState(state, config) {
    const path = defaultGetPathFromState(state, config);
    if (!stateCodeParam.current) return path;
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}stateCode=${encodeURIComponent(stateCodeParam.current)}`;
  },
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth0();
  // skipAuth state triggers re-render when user clicks "Skip Authentication"
  const [skipAuth, setSkipAuth] = React.useState(false);

  // Public tRPC client for unauthenticated endpoints
  const [publicTrpcClient] = React.useState(() =>
    publicTrpc.createClient({
      links: [
        httpBatchLink({
          url: trpcUrl,
          transformer: superjson,
        }),
      ],
    }),
  );

  const [, fontsLoadingError] = useFonts({
    Inter: require("~@meetings/app/shared/assets/fonts/Inter.ttf"),
    "LibreBaskerville-Bold": require("~@meetings/app/shared/assets/fonts/LibreBaskerville-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoadingError) {
      console.error("Error loading fonts: ", fontsLoadingError);
    }
  }, [fontsLoadingError]);

  const handleSkipAuth = () => {
    setSkipAuth(true);
  };

  if (isLoading) {
    return null;
  }
  const loggedIn = (user !== undefined && user !== null) || skipAuth;

  return (
    <publicTrpc.Provider
      client={publicTrpcClient}
      queryClient={publicQueryClient}
    >
      <QueryClientProvider client={publicQueryClient}>
        <AppUpdateModal />
        <NavigationContainer
          linking={linking}
          documentTitle={{ enabled: false }}
        >
          <Drawer.Navigator
            screenOptions={{ headerShown: false, swipeEnabled: false }}
          >
            {!loggedIn ? (
              <Drawer.Screen name="Login">
                {(props) => (
                  <LoginScreen {...props} onSkipAuth={handleSkipAuth} />
                )}
              </Drawer.Screen>
            ) : (
              <Drawer.Screen name="Main">
                {() => (
                  <UserContextProvider isSkipAuthUser={skipAuth}>
                    <AuthenticatedApp />
                  </UserContextProvider>
                )}
              </Drawer.Screen>
            )}
          </Drawer.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </publicTrpc.Provider>
  );
};

export default AppNavigator;
