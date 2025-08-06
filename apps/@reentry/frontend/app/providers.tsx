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
import { createTRPCReact } from "@trpc/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import superjson from "superjson";

import { IS_V2_INTAKE_CHAT } from "~@reentry/frontend/featureFlags";
import type { AppRouter } from "~@reentry/trpc-types";

export const trpc = createTRPCReact<AppRouter>();

export function Providers({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [stateCode, setStateCode] = useState<string>("");

  useEffect(() => {
    setToken(sessionStorage.getItem("intake_token"));
    setStateCode(sessionStorage.getItem("state_code") ?? "");
  }, []);

  const queryClient = useRef(
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
  );

  if (IS_V2_INTAKE_CHAT) {
    const wsClient = useMemo(
      () =>
        token &&
        stateCode &&
        createWSClient({
          url: (process.env["NEXT_PUBLIC_API_URL"] ?? "") + "/trpc",
          connectionParams: () => {
            return {
              statecode: stateCode,
              authorization: `Bearer ${token}`,
            };
          },
        }),
      [stateCode, token],
    );

    const trpcClient = useMemo(
      () =>
        token &&
        stateCode &&
        wsClient &&
        trpc.createClient({
          links: [
            splitLink({
              condition(op) {
                return op.type === "subscription";
              },
              true: wsLink({ client: wsClient, transformer: superjson }),
              false: httpBatchLink({
                url: (process.env["NEXT_PUBLIC_API_URL"] ?? "") + "/trpc",
                async headers() {
                  return {
                    statecode: stateCode,
                    authorization: `Bearer ${token}`,
                  };
                },
                transformer: superjson,
              }),
            }),
          ],
        }),
      [stateCode, token],
    );

    if (trpcClient) {
      return (
        <trpc.Provider client={trpcClient} queryClient={queryClient.current}>
          <QueryClientProvider client={queryClient.current}>
            {children}
          </QueryClientProvider>
        </trpc.Provider>
      );
    }
  }

  return (
    <QueryClientProvider client={queryClient.current}>
      {children}
    </QueryClientProvider>
  );
}
