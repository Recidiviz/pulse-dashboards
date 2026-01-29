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
  LinkingOptions,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import { useAuth0 } from "react-native-auth0";
import superjson from "superjson";

import AppUpdateModal from "../components/AppUpdateModal";
import { useStateSelection } from "../context/StateContext";
import env from "../env";
import LoginScreen from "../screens/LoginScreen";
import { publicTrpc, trpc } from "../trpc/client";
import DrawerNavigator, { RootStackParamList } from "./DrawerNavigator";

const Drawer = createDrawerNavigator();
const queryClient = new QueryClient();
const publicQueryClient = new QueryClient();

const trpcUrl = env.EXPO_PUBLIC_SERVER_URL;

type AppStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<RootStackParamList>;
};

const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Login: "login",
      Main: {
        screens: {
          Clients: "clients",
          Residents: "residents",
          ClientProfile: "clients/:personId",
          ResidentProfile: "residents/:personId",
          ClientNewMeeting: "clients/:personId/new-meeting",
          ResidentNewMeeting: "residents/:personId/new-meeting",
          ClientMeeting: "clients/:personId/meetings/:meetingId",
          ResidentMeeting: "residents/:personId/meetings/:meetingId",
          StateSelection: "settings",
        },
      },
    },
  },
};

const AppNavigator = () => {
  const { selectedStateCode } = useStateSelection();
  const { user, isLoading, getCredentials } = useAuth0();
  // skipAuth state triggers re-render when user clicks "Skip Authentication"
  const [skipAuth, setSkipAuth] = React.useState(false);

  // Refs to allow the TRPC headers() function to access current values
  // (headers() is defined once at initialization, so it needs a ref not state)
  const skipAuthRef = React.useRef(false);
  const userRef = React.useRef(user);
  const selectedStateRef = React.useRef(selectedStateCode);

  // Update userRef whenever user changes
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Update selectedStateRef whenever selectedStateCode changes
  React.useEffect(() => {
    selectedStateRef.current = selectedStateCode;
  }, [selectedStateCode]);

  const [trpcClient] = React.useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: trpcUrl,
          async headers() {
            // In skip auth mode, send a special header
            // Use ref here since this closure is created once during initialization
            if (skipAuthRef.current) {
              return {
                "X-Skip-Auth": "true",
                statecode: selectedStateRef.current,
              };
            }

            const audience = env.EXPO_PUBLIC_AUTH0_AUDIENCE;
            const creds = await getCredentials(undefined, undefined, {
              audience,
            });
            // Use userRef.current to get the latest user value
            const currentUser = userRef.current;
            const userAppMetadata =
              currentUser?.[`https://dashboard.recidiviz.org/app_metadata`];

            // For recidiviz users, use the selected state code from StateContext
            // Otherwise use the user's assigned state code
            const stateCode =
              userAppMetadata?.stateCode === "recidiviz"
                ? selectedStateRef.current
                : userAppMetadata?.stateCode.toUpperCase();

            // If stateCode is empty because the user, userAppMetadata, or stateCode is undefined,
            // just pass it anyway and let the backend auth fail.
            return {
              Authorization: `Bearer ${creds?.accessToken}`,
              statecode: stateCode,
            };
          },
          transformer: superjson,
        }),
      ],
    }),
  );

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
    Inter: require("./../../assets/fonts/Inter.ttf"),
    "LibreBaskerville-Bold": require("./../../assets/fonts/LibreBaskerville-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoadingError) {
      console.error("Error loading fonts: ", fontsLoadingError);
    }
  }, [fontsLoadingError]);

  const handleSkipAuth = () => {
    // Update both ref (for TRPC headers) and state (to trigger re-render)
    skipAuthRef.current = true;
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
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer linking={linking}>
              <Drawer.Navigator screenOptions={{ headerShown: false }}>
                {!loggedIn ? (
                  <Drawer.Screen name="Login">
                    {(props) => (
                      <LoginScreen {...props} onSkipAuth={handleSkipAuth} />
                    )}
                  </Drawer.Screen>
                ) : (
                  <Drawer.Screen name="Main" component={DrawerNavigator} />
                )}
              </Drawer.Navigator>
            </NavigationContainer>
          </QueryClientProvider>
        </trpc.Provider>
      </QueryClientProvider>
    </publicTrpc.Provider>
  );
};

export default AppNavigator;
