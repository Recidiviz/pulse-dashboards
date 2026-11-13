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
import {
  createTRPCClient,
  httpLink,
  TRPCClient,
  TRPCClientError,
  TRPCLink,
} from "@trpc/client";
import { observable } from "@trpc/server/observable";
import superjson from "superjson";

import type { UsCoParoleBoardCalendarRouter } from "~@parole-board/common";
import { subrouteScopedLink } from "~trpc-client-utils";

/** The tRPC client for Colorado's public calendar and its QueryClient. */
export interface PublicCalendarTrpc {
  client: TRPCClient<UsCoParoleBoardCalendarRouter>;
  queryClient: QueryClient;
}

function failingLink(message: string): TRPCLink<UsCoParoleBoardCalendarRouter> {
  return () => () =>
    observable((observer) => {
      observer.error(new TRPCClientError(message));
    });
}

/**
 * Builds the anonymous client for Colorado's calendar API on the Modules
 * server at url, under its "Calendar.usCo.paroleBoard" path, so calls name
 * only the procedure, such as public.months.get. The public read takes no
 * token and no StateCode header, so requests carry neither, and each query
 * is its own GET (httpLink, not a batch) so a cache in front of the server
 * can key on its URL. Without a url every request fails before it's sent.
 */
export function createPublicCalendarTrpc(
  url: string | undefined,
): PublicCalendarTrpc {
  const client = createTRPCClient<UsCoParoleBoardCalendarRouter>({
    links: url
      ? [
          subrouteScopedLink("Calendar.usCo.paroleBoard"),
          httpLink({ url, transformer: superjson }),
        ]
      : [failingLink("VITE_MODULE_BACKEND_URL isn't set")],
  });
  return { client, queryClient: new QueryClient() };
}
