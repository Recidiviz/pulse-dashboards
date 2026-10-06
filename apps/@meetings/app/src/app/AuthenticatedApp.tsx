// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { httpBatchLink } from "@trpc/client";
import React, { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import superjson from "superjson";

import {
  AgencyConfigProvider,
  useAgencyConfigs,
} from "~@meetings/app/entities/agency-config";
import {
  DEFAULT_STATE_CODE,
  StateCode,
  StateCodeProvider,
} from "~@meetings/app/entities/state-code";
import {
  ACCESS_TOKEN_MIN_TTL_SECONDS,
  useUserContext,
} from "~@meetings/app/entities/user";
import { useImpersonationStore } from "~@meetings/app/features/impersonation";
import { jiiTrpc, trpc } from "~@meetings/app/shared/api";
import { env } from "~@meetings/app/shared/config";
import { queryCachePersister } from "~@meetings/app/shared/lib/queryCachePersister";
import { FirebaseAuthClient } from "~firebase-auth";

import { AuthenticatedContent } from "./AuthenticatedContent";

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_WEEK_MS,
    },
  },
});

const getFirebaseAuthClient = () => {
  const { EXPO_PUBLIC_FIREBASE_PROJECT_ID, EXPO_PUBLIC_FIREBASE_API_KEY } = env;
  // Only missing from contractor env in practice.
  if (!EXPO_PUBLIC_FIREBASE_PROJECT_ID || !EXPO_PUBLIC_FIREBASE_API_KEY) {
    throw new Error(
      "EXPO_PUBLIC_FIREBASE_PROJECT_ID and EXPO_PUBLIC_FIREBASE_API_KEY must be set to initialize firebase auth",
    );
  }
  return new FirebaseAuthClient(
    EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_API_KEY,
  );
};

/**
 * Passes the user and agency config values StateCodeProvider needs
 */
const ConnectedStateCodeProvider = ({
  children,
  selectedStateRef,
}: {
  children: React.ReactNode;
  selectedStateRef: React.RefObject<StateCode>;
}) => {
  const {
    isSkipAuthUser,
    recidivizAllowedStates,
    stateCode: userStateCode,
  } = useUserContext();
  const {
    agencyConfigs,
    isPending: configsPending,
    isError: configsErrored,
  } = useAgencyConfigs();

  return (
    <StateCodeProvider
      selectedStateRef={selectedStateRef}
      isSkipAuthUser={isSkipAuthUser}
      recidivizAllowedStates={recidivizAllowedStates}
      userStateCode={userStateCode}
      agencyConfigs={agencyConfigs}
      configsPending={configsPending}
      configsErrored={configsErrored}
    >
      {children}
    </StateCodeProvider>
  );
};

/**
 * Sets up tRPC client and provides it to the app.
 * This component must be wrapped by UserContextProvider.
 */
const AuthenticatedApp: React.FC = () => {
  const { isLoading, isSkipAuthUser, getCredentials } = useUserContext();
  const { impersonatedEmail, impersonatedStateCode } = useImpersonationStore();

  // State code ref is managed here since it's only needed for authenticated requests. StateContext
  // will initialize this to the user's state for state users, or allow Recidiviz users to change it
  // via settings.
  const selectedStateRef = useRef<StateCode>(DEFAULT_STATE_CODE);
  // impersonatedEmail is "" when not impersonating
  const impersonatedEmailRef = useRef(impersonatedEmail);
  const impersonatedStateCodeRef = useRef(impersonatedStateCode);
  // We need to refresh our firebase token when switching between identities - this
  // ref will allow us to flag when the token needs a refresh.
  const firebaseSessionEmailRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    impersonatedEmailRef.current = impersonatedEmail;
    impersonatedStateCodeRef.current = impersonatedStateCode;
  }, [impersonatedEmail, impersonatedStateCode]);

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: env.EXPO_PUBLIC_SERVER_URL,
          async headers() {
            let statecode = selectedStateRef.current;
            const impersonationHeaders: Record<string, string> = {};
            if (impersonatedEmailRef.current) {
              impersonationHeaders["X-Impersonated-Email"] =
                impersonatedEmailRef.current;
              statecode = impersonatedStateCodeRef.current;
            }

            // In skip auth mode, send a special header
            if (isSkipAuthUser) {
              return {
                ...impersonationHeaders,
                "X-Skip-Auth": "true",
                statecode,
              };
            }

            const audience = env.EXPO_PUBLIC_AUTH0_AUDIENCE;
            const creds = await getCredentials(
              undefined,
              ACCESS_TOKEN_MIN_TTL_SECONDS,
              { audience },
            );

            // Omit the auth header when creds is undefined (session expiry)
            // instead of sending "Bearer undefined".
            if (!creds) {
              return { statecode, ...impersonationHeaders };
            }

            return {
              Authorization: `Bearer ${creds.accessToken}`,
              statecode,
              ...impersonationHeaders,
            };
          },
          transformer: superjson,
        }),
      ],
    }),
  );

  const [jiiTrpcClient] = useState(() =>
    jiiTrpc.createClient({
      links: [
        httpBatchLink({
          url: env.EXPO_PUBLIC_JII_API_URL,
          headers: async () => {
            const firebaseAuthClient = getFirebaseAuthClient();
            // Get a new token when firebaseImpersonationRef is undefined (i.e. the
            // first time we try to mint), or when the impersonated user has changed
            // since the last token refresh.
            if (
              firebaseSessionEmailRef.current !== impersonatedEmailRef.current
            ) {
              const { firebaseToken } =
                await trpcClient.v1.firebaseAuth.getFirebaseToken.query();
              await firebaseAuthClient.authenticate(firebaseToken);
              firebaseSessionEmailRef.current = impersonatedEmailRef.current;
            }

            const stateCode = impersonatedEmailRef.current
              ? impersonatedStateCodeRef.current
              : selectedStateRef.current;
            return {
              Authorization: `Bearer ${await firebaseAuthClient.getIdToken()}`,
              StateCode: stateCode,
              UseDemoData: `${isSkipAuthUser || stateCode === "US_DEMO"}`,
            };
          },
          transformer: superjson,
        }),
      ],
    }),
  );

  if (isLoading) {
    return null;
  }

  // The NE success planner (the only consumer of jiiTrpc) is web-only, so
  // mount the jiiTrpc provider on web.
  const withJiiTrpc = (children: React.ReactNode) =>
    Platform.OS === "web" ? (
      <jiiTrpc.Provider client={jiiTrpcClient} queryClient={queryClient}>
        {children}
      </jiiTrpc.Provider>
    ) : (
      children
    );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {withJiiTrpc(
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryCachePersister,
            maxAge: ONE_WEEK_MS,
          }}
        >
          <AgencyConfigProvider>
            <ConnectedStateCodeProvider selectedStateRef={selectedStateRef}>
              <AuthenticatedContent />
            </ConnectedStateCodeProvider>
          </AgencyConfigProvider>
        </PersistQueryClientProvider>,
      )}
    </trpc.Provider>
  );
};

export default AuthenticatedApp;
