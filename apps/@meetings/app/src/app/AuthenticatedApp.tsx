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
import superjson from "superjson";

import {
  DEFAULT_STATE_CODE,
  StateCode,
  StateCodeProvider,
} from "~@meetings/app/context/StateContext";
import { AgencyConfigProvider } from "~@meetings/app/entities/agency-config";
import { useUserContext } from "~@meetings/app/entities/user";
import { useImpersonationStore } from "~@meetings/app/hooks/useImpersonationStore";
import { AnalyticsProvider } from "~@meetings/app/shared/analytics";
import { trpc } from "~@meetings/app/shared/api";
import { env } from "~@meetings/app/shared/config";
import { queryCachePersister } from "~@meetings/app/shared/lib/queryCachePersister";

import { AuthenticatedContent } from "./AuthenticatedContent";

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_WEEK_MS,
    },
  },
});

/**
 * Sets up tRPC client and provides it to the app.
 * This component must be wrapped by UserContextProvider.
 */
const AuthenticatedApp: React.FC = () => {
  const { email, isLoading, isSkipAuthUser, getCredentials } = useUserContext();
  const { impersonatedEmail, impersonatedStateCode } = useImpersonationStore();

  // State code ref is managed here since it's only needed for authenticated requests. StateContext
  // will initialize this to the user's state for state users, or allow Recidiviz users to change it
  // via settings.
  const selectedStateRef = useRef<StateCode>(DEFAULT_STATE_CODE);
  const impersonatedEmailRef = useRef(impersonatedEmail);
  const impersonatedStateCodeRef = useRef(impersonatedStateCode);

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
            const creds = await getCredentials(undefined, undefined, {
              audience,
            });

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

  if (isLoading) {
    return null;
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryCachePersister, maxAge: ONE_WEEK_MS }}
      >
        <AgencyConfigProvider>
          <AnalyticsProvider email={email} isSkipAuthUser={isSkipAuthUser}>
            <StateCodeProvider selectedStateRef={selectedStateRef}>
              <AuthenticatedContent />
            </StateCodeProvider>
          </AnalyticsProvider>
        </AgencyConfigProvider>
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
};

export default AuthenticatedApp;
