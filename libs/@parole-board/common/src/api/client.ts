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

import type { QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  TRPCClient,
  TRPCClientError,
  TRPCLink,
} from "@trpc/client";
import { observable } from "@trpc/server/observable";
import {
  createTRPCOptionsProxy,
  TRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { subrouteScopedLink } from "~trpc-client-utils";

import type { UsCoParoleBoardCalendarRouter } from "./types";

/** The calendar API's tRPC client, its React Query options proxy and cache. */
export interface CalendarTrpc {
  client: TRPCClient<UsCoParoleBoardCalendarRouter>;
  querier: TRPCOptionsProxy<UsCoParoleBoardCalendarRouter>;
  /**
   * The QueryClient the options proxy was built on. The hooks read the
   * ambient QueryClientProvider, which should hold this same client.
   */
  queryClient: QueryClient;
}

/**
 * Wraps a tRPC client for the calendar API in the options proxy the data
 * hooks read.
 */
export function toCalendarTrpc(
  client: TRPCClient<UsCoParoleBoardCalendarRouter>,
  queryClient: QueryClient,
): CalendarTrpc {
  const querier = createTRPCOptionsProxy<UsCoParoleBoardCalendarRouter>({
    client,
    queryClient,
  });
  return { client, querier, queryClient };
}

/**
 * A link that fails every request with message and never reaches the
 * network.
 */
export function failingLink(
  message: string,
): TRPCLink<UsCoParoleBoardCalendarRouter> {
  return () => () =>
    observable((observer) => {
      observer.error(new TRPCClientError(message));
    });
}

/**
 * Builds the client for Colorado's calendar API on the Modules server, at
 * VITE_MODULE_BACKEND_URL and under its "Calendar.usCo.paroleBoard" path, so
 * calls name only the procedure, such as admin.months.get. Requests
 * carry the user's Auth0 token and a StateCode header naming the state the
 * user acts in, which the editor procedures require, and go only to that URL.
 * A request fails before it's sent when the URL isn't set (an empty URL would
 * send the token to the host app's own origin), when getToken has no token,
 * such as before Auth0 has loaded, or when getStateCode has no state code.
 *
 * Args:
 *   getToken: Returns the current user's Auth0 access token, or undefined
 *     when there is none. It runs before every request batch.
 *   getStateCode: Returns the state the user acts in, such as "US_CO", or
 *     undefined when there is none. It runs before every request batch.
 *   queryClient: The host app's QueryClient, which holds the calendar cache.
 *     The host renders the calendar under a QueryClientProvider with it.
 */
export function createCalendarTrpc({
  getToken,
  getStateCode,
  queryClient,
}: {
  getToken: () => Promise<string | undefined> | string | undefined;
  getStateCode: () => string | undefined;
  queryClient: QueryClient;
}): CalendarTrpc {
  const url: string | undefined = import.meta.env["VITE_MODULE_BACKEND_URL"];
  const client = createTRPCClient<UsCoParoleBoardCalendarRouter>({
    links: url
      ? [
          subrouteScopedLink("Calendar.usCo.paroleBoard"),
          httpBatchLink({
            url,
            headers: async () => {
              const token = await getToken();
              if (!token) {
                throw new TRPCClientError(
                  "The calendar needs a signed-in user",
                );
              }
              const stateCode = getStateCode();
              if (!stateCode) {
                throw new TRPCClientError("The calendar needs a state code");
              }
              return {
                Authorization: `Bearer ${token}`,
                StateCode: stateCode,
              };
            },
            transformer: superjson,
          }),
        ]
      : [failingLink("VITE_MODULE_BACKEND_URL isn't set")],
  });
  return toCalendarTrpc(client, queryClient);
}
