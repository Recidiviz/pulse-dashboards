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
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useFonts } from "expo-font";
import React, { useEffect, useRef } from "react";
import { useAuth0 } from "react-native-auth0";
import superjson from "superjson";

import {
  extractAndRemoveStateCode,
  stateCodeParam,
} from "~@meetings/app/entities/state-code";
import { UserContextProvider } from "~@meetings/app/entities/user";
import { AppUpdateModal } from "~@meetings/app/features/app-update";
import {
  peekPendingLoginDeepLink,
  savePendingLoginDeepLink,
  useRestorePendingLoginDeepLink,
} from "~@meetings/app/features/login-deep-link";
import { LoginScreen } from "~@meetings/app/pages/login";
import {
  AnalyticsProvider,
  useAnalytics,
} from "~@meetings/app/shared/analytics";
import { publicTrpc } from "~@meetings/app/shared/api";
import { AppStackParamList, env } from "~@meetings/app/shared/config";

import AuthenticatedApp from "../AuthenticatedApp";
import { linking } from "./linking";

const Drawer = createDrawerNavigator();
const publicQueryClient = new QueryClient();

const trpcUrl = env.EXPO_PUBLIC_SERVER_URL;

type AppNavigatorContentProps = {
  loggedIn: boolean;
  skipAuth: boolean;
  onSkipAuth: () => void;
};

const AppNavigatorContent = ({
  loggedIn,
  skipAuth,
  onSkipAuth,
}: AppNavigatorContentProps) => {
  const { screen } = useAnalytics();
  const navigationRef = useNavigationContainerRef<AppStackParamList>();
  const routeNameRef = useRef<string | undefined>(undefined);

  const restorePendingDeepLink = useRestorePendingLoginDeepLink({
    loggedIn,
    navigationRef,
    linking,
  });

  const handleNavigationReady = () => {
    routeNameRef.current = navigationRef.getCurrentRoute()?.name;
    restorePendingDeepLink();
  };

  const handleStateChange = () => {
    const currentRoute = navigationRef.getCurrentRoute();
    const currentRouteName = currentRoute?.name;
    if (!currentRouteName || currentRouteName === routeNameRef.current) {
      routeNameRef.current = currentRouteName;
      return;
    }
    const params = currentRoute?.params as Record<string, unknown> | undefined;
    const personId = params?.["personId"] as string | undefined;
    screen(currentRouteName, { personId });
    routeNameRef.current = currentRouteName;
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      documentTitle={{ enabled: false }}
      onReady={handleNavigationReady}
      onStateChange={handleStateChange}
    >
      <Drawer.Navigator
        screenOptions={{ headerShown: false, swipeEnabled: false }}
      >
        {!loggedIn ? (
          <Drawer.Screen name="Login">
            {(props) => <LoginScreen {...props} onSkipAuth={onSkipAuth} />}
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
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth0();
  // skipAuth state triggers re-render when user clicks "Skip Authentication"
  const [skipAuth, setSkipAuth] = React.useState(false);
  // Blocks deep-link capture on logged-out renders after session expiry
  const hasBeenLoggedInRef = useRef(false);

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

  if (isLoading) {
    return null;
  }

  const loggedIn = (user !== undefined && user !== null) || skipAuth;

  if (loggedIn) {
    hasBeenLoggedInRef.current = true;
    // Seed stateCodeParam during render so StateContext sees it on mount;
    // the restore effect can run too late
    const pending = peekPendingLoginDeepLink();
    if (pending) {
      const { stateCode } = extractAndRemoveStateCode(pending);
      if (stateCode) {
        stateCodeParam.current = stateCode;
      }
    }
  } else if (!hasBeenLoggedInRef.current) {
    // Must run during render, before linking rewrites the URL to /login
    savePendingLoginDeepLink();
  }

  return (
    <publicTrpc.Provider
      client={publicTrpcClient}
      queryClient={publicQueryClient}
    >
      <QueryClientProvider client={publicQueryClient}>
        <AnalyticsProvider email={user?.email} isSkipAuthUser={skipAuth}>
          <AppUpdateModal />
          <AppNavigatorContent
            loggedIn={loggedIn}
            skipAuth={skipAuth}
            onSkipAuth={() => setSkipAuth(true)}
          />
        </AnalyticsProvider>
      </QueryClientProvider>
    </publicTrpc.Provider>
  );
};

export default AppNavigator;
