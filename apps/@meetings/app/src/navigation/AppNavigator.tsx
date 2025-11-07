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

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React from "react";
import { useAuth0 } from "react-native-auth0";
import superjson from "superjson";

import LoginScreen from "../screens/LoginScreen";
import { trpc } from "../trpc/client";
import DrawerNavigator from "./DrawerNavigator";

const Stack = createStackNavigator();
const queryClient = new QueryClient();

const trpcUrl =
  process.env["EXPO_PUBLIC_SERVER_URL"] ?? "http://localhost:3002";

const AppNavigator = () => {
  const { user, isLoading, getCredentials } = useAuth0();
  // skipAuth state triggers re-render when user clicks "Skip Authentication"
  const [skipAuth, setSkipAuth] = React.useState(false);
  // skipAuthRef allows the TRPC headers() function to access current value
  // (headers() is defined once at initialization, so it needs a ref not state)
  const skipAuthRef = React.useRef(false);
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
                statecode: "US_NE",
              };
            }

            const creds = await getCredentials();
            return {
              Authorization: `Bearer ${creds?.accessToken}`,
              // TODO: Extract statecode from Auth0 token
              statecode: "US_NE",
            };
          },
          transformer: superjson,
        }),
      ],
    }),
  );

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
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!loggedIn ? (
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen {...props} onSkipAuth={handleSkipAuth} />
                )}
              </Stack.Screen>
            ) : (
              <Stack.Screen name="Main" component={DrawerNavigator} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </trpc.Provider>
  );
};

export default AppNavigator;
