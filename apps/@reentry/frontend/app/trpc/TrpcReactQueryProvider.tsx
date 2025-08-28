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

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import superjson from "superjson";

import { IS_V2_INTAKE_CHAT } from "~@reentry/frontend/featureFlags";
import { useAuth } from "~@reentry/frontend/lib/auth";
import { trpc, trpcUrl } from "~@reentry/frontend/trpc";
import {
  ConnectionState,
  ConnectionStatus,
  UseTrpcReactQueryOptions,
} from "~@reentry/frontend/trpc/types";

const TrpcConnectionContext = createContext<ConnectionStatus | undefined>(
  undefined,
);
export const useTrpcConnection = () => {
  const ctx = useContext(TrpcConnectionContext);
  if (ctx === undefined) {
    throw new Error(
      "useTrpcConnection must be used within TrpcReactQueryProvider.",
    );
  }
  return ctx;
};

export const useTrpcReactQuery = (options?: UseTrpcReactQueryOptions) => {
  const [connectionState, setConnectionState] = useState<
    ConnectionState | undefined
  >(options?.enableWS ? "connecting" : undefined);
  const [connectionError, setConnectionError] = useState<Event>();
  const [queryClient] = useState(() => new QueryClient());
  const [wsClient, setWsClient] = useState<ReturnType<typeof createWSClient>>();

  const auth = useAuth();

  const getAuthHeaders = useCallback(async () => {
    if (!options?.token) {
      await auth.refreshToken();
    }
    const token = options?.token ?? auth.getAccessToken() ?? undefined;
    const stateCode =
      options?.stateCode ?? auth.userAppMetadata?.["stateCode"] ?? undefined;

    return {
      authorization: token ? `Bearer ${token}` : undefined,
      statecode: stateCode?.toUpperCase(),
    };
  }, [options?.token, options?.stateCode, auth]);

  useEffect(() => {
    if (!options?.enableWS) {
      setWsClient((prev) => {
        prev?.close();
        return undefined;
      });
      setConnectionState(undefined);
      setConnectionError(undefined);
      return;
    }

    const client = createWSClient({
      url: trpcUrl,
      connectionParams: getAuthHeaders,
      onOpen: () => setConnectionState("connected"),
      onClose: () => setConnectionState("closed"),
      onError: (err) => {
        console.error("WS error", err);
        setConnectionState("error");
        setConnectionError(err);
      },
    });

    setWsClient(client);
    setConnectionState("connecting");

    return () => {
      client.close();
    };
  }, [options?.enableWS, getAuthHeaders]);

  const trpcClient = useMemo(() => {
    const links =
      options?.enableWS && wsClient
        ? [
            splitLink({
              condition: (op) => op.type === "subscription",
              true: wsLink({ client: wsClient, transformer: superjson }),
              false: httpBatchLink({
                url: trpcUrl,
                headers: getAuthHeaders,
                transformer: superjson,
              }),
            }),
          ]
        : [
            httpBatchLink({
              url: trpcUrl,
              headers: getAuthHeaders,
              transformer: superjson,
            }),
          ];

    return trpc.createClient({
      links,
    });
  }, [options?.enableWS, wsClient, getAuthHeaders]);
  return {
    queryClient,
    trpcClient,
    wsClient,
    connectionState,
    connectionError,
  };
};

export const TrpcReactQueryProvider = ({
  children,
  ...options
}: {
  children: React.ReactNode;
} & UseTrpcReactQueryOptions) => {
  const {
    queryClient,
    trpcClient,
    wsClient,
    connectionState,
    connectionError,
  } = useTrpcReactQuery(options);

  // Close Websocket connection on unmount
  useEffect(() => {
    return () => {
      if (wsClient) {
        wsClient.close();
      }
    };
  }, [wsClient]);

  if (!IS_V2_INTAKE_CHAT) return children;

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <TrpcConnectionContext.Provider
          value={{
            connectionState,
            connectionError,
          }}
        >
          {children}
        </TrpcConnectionContext.Provider>
      </trpc.Provider>
    </QueryClientProvider>
  );
};
