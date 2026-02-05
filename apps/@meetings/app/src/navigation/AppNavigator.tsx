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
import { UserContextProvider } from "../context/UserContext";
import env from "../env";
import LoginScreen from "../screens/LoginScreen";
import { publicTrpc } from "../trpc/client";
import AuthenticatedApp from "./AuthenticatedApp";
import { RootStackParamList } from "./DrawerNavigator";

const Drawer = createDrawerNavigator();
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
    Inter: require("./../../assets/fonts/Inter.ttf"),
    "LibreBaskerville-Bold": require("./../../assets/fonts/LibreBaskerville-Bold.ttf"),
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
        <NavigationContainer linking={linking}>
          <Drawer.Navigator screenOptions={{ headerShown: false }}>
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
