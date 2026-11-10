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

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useContext, useRef, useState } from "react";
import superjson from "superjson";

import { IDAHO_TH_ACTIVE_PROVIDER_HEADER } from "~@idaho-th/shared";

import type { IdahoTHStore } from "../datastores/IdahoTHStore";
import { IdahoTHStoreContext } from "../datastores/IdahoTHStoreContext";
import { getIdahoThRuntimeConfig } from "../runtimeConfig";
import { toastError } from "../utils/errors/toast";
import { trpc } from "./client";
import {
  getErrorMessage,
  handleProviderAuthorizationError,
  isUnauthorizedError,
} from "./errorHandler";

export interface TrpcProviderProps {
  getToken?: () => Promise<string | undefined>;
  onUnauthorized?: () => void;
  children: React.ReactNode;
}

export const TrpcProvider: React.FC<TrpcProviderProps> = ({
  getToken,
  onUnauthorized,
  children,
}) => {
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  // The provider is mounted inside the store context, but its own tests render
  // it bare, so the store is read as an optional value rather than through the
  // throwing hook.
  const storeRef = useRef<IdahoTHStore | undefined>(undefined);
  storeRef.current = useContext(IdahoTHStoreContext);

  const handleError = (
    error: unknown,
    suppress: boolean,
    queryClient: QueryClient,
  ) => {
    if (isUnauthorizedError(error)) {
      onUnauthorizedRef.current?.();
      return;
    }
    const housingProviderStore = storeRef.current?.housingProviderStore;
    if (
      handleProviderAuthorizationError(error, housingProviderStore, queryClient)
    )
      return;
    if (suppress) return;
    toastError(getErrorMessage(error));
  };

  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
      },
      queryCache: new QueryCache({
        onError: (error, query) =>
          handleError(error, !!query.meta?.["suppressGlobalError"], client),
      }),
      mutationCache: new MutationCache({
        onError: (error, _variables, _context, mutation) =>
          handleError(
            error,
            !!(
              mutation.meta?.["suppressGlobalError"] || mutation.options.onError
            ),
            client,
          ),
      }),
    });
    return client;
  });

  const [trpcClient] = useState(() => {
    const { apiUrl } = getIdahoThRuntimeConfig();

    return trpc.createClient({
      links: [
        httpBatchLink({
          url: apiUrl,
          methodOverride: "POST",
          async headers() {
            const headers: Record<string, string> = {};

            const tk = getTokenRef.current;
            const token = tk ? await tk() : undefined;
            if (token) headers["Authorization"] = `Bearer ${token}`;

            // An assertion, not a grant: the server re-checks it against the
            // caller's assignments. Staff never set it, so staff requests are
            // same as what they were before.
            const { activeProviderId } =
              storeRef.current?.housingProviderStore ?? {};
            if (activeProviderId) {
              headers[IDAHO_TH_ACTIVE_PROVIDER_HEADER] = activeProviderId;
            }

            return headers;
          },
          transformer: superjson,
        }),
      ],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
